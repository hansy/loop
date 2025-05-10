import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { User } from "@privy-io/server-auth";
import { AppError } from "./AppError";
import { getVerifiedPrivyUserFromCookies } from "./privy";
import { IS_PRODUCTION } from "@/lib/common/utils/env";

interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
    stack?: string; // Optionally include stack in non-production environments
  };
}

/**
 * Creates a standardized success JSON response.
 * @param data The data payload for the successful response.
 * @param status HTTP status code, defaults to 200.
 * @param message Optional success message.
 * @returns NextResponse object with standardized success JSON.
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse<SuccessResponse<T>> {
  const responseBody: SuccessResponse<T> = { success: true, data };
  if (message) {
    responseBody.message = message;
  }
  return NextResponse.json(responseBody, { status });
}

/**
 * Creates a standardized error JSON response and logs the error server-side.
 * @param error The error object. Can be an instance of AppError or any other error.
 * @param defaultStatus Default HTTP status code if not determinable from AppError, defaults to 500.
 * @returns NextResponse object with standardized error JSON.
 */
export function errorResponse(
  error: unknown, // Use unknown for better type safety
  defaultStatus: number = 500
): NextResponse<ErrorResponse> {
  let responseBody: ErrorResponse;
  let statusCode: number = defaultStatus;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    responseBody = {
      success: false,
      error: {
        message:
          IS_PRODUCTION && error.statusCode >= 500
            ? "Internal Server Error"
            : error.message,
        code: error.errorCode,
        details: error.details,
      },
    };
    // For AppErrors, log the original error, especially if it might have more details than sent to client
    console.error(
      `AppError (${error.statusCode}, Code: ${error.errorCode || "N/A"}): ${
        error.message
      }`,
      {
        details: error.details,
        stack: error.stack,
      }
    );
  } else if (error instanceof Error) {
    // Generic Error instance
    responseBody = {
      success: false,
      error: {
        message:
          IS_PRODUCTION && statusCode >= 500
            ? "Internal Server Error"
            : error.message,
      },
    };
    console.error(`Generic Error (${statusCode}): ${error.message}`, {
      stack: error.stack,
    });
  } else {
    // Fallback for non-Error objects thrown
    statusCode = defaultStatus; // Ensure statusCode is set
    responseBody = {
      success: false,
      error: {
        message:
          IS_PRODUCTION && statusCode >= 500
            ? "Internal Server Error"
            : "An unexpected error occurred",
      },
    };
    console.error(`Unknown Error (${statusCode}):`, error);
  }

  // Optionally add stack trace to response in non-production environments for easier debugging
  if (!IS_PRODUCTION && error instanceof Error && responseBody.error) {
    responseBody.error.stack = error.stack;
  }

  return NextResponse.json(responseBody, { status: statusCode });
}

/**
 * A higher-order function to wrap Next.js API route handlers for standardized
 * success/error responses, optional authentication, and error handling.
 *
 * @param handler The API route handler function.
 *                It receives the NextRequest, an optional Privy User object (if authenticated),
 *                and route context. It should return a NextResponse or Response.
 * @param options Configuration for the handler, e.g., whether authentication is required.
 * @returns An async function that takes NextRequest and context, and returns a Promise<NextResponse | Response>.
 */
export function handleApiRoute<
  TContext = { params?: Record<string, string | string[]> }
>(
  handler: (
    req: NextRequest,
    privyUser: User | null, // Allow null if auth is not required or fails gracefully in handler
    context: TContext
  ) => Promise<NextResponse | Response>,
  options?: { requireAuth?: boolean }
): (req: NextRequest, context: TContext) => Promise<NextResponse | Response> {
  return async (req, context) => {
    let privyUser: User | null = null;
    const requireAuth = options?.requireAuth ?? true; // Default to true if not specified

    try {
      if (requireAuth) {
        // Attempt to get the verified Privy user from cookies
        // This function will throw an AppError if auth fails (e.g., token missing, invalid)
        privyUser = await getVerifiedPrivyUserFromCookies(await cookies());
      }
      // Delegate to the original handler, passing the request, (potentially null) privyUse r, and context
      return await handler(req, privyUser, context);
    } catch (error) {
      // If auth fails (AppError from getVerifiedPrivyUserFromCookies) or handler throws an error,
      // use errorResponse to standardize and log it.
      return errorResponse(error);
    }
  };
}
