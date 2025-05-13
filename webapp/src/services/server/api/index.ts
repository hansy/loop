import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { User } from "@privy-io/server-auth";
import { AppError } from "./error";
import { getVerifiedPrivyUserFromCookies } from "../external/privy";
import { IS_PRODUCTION } from "@/utils/env";

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
  TContext extends { params: Promise<Record<string, string>> }
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

      // Delegate to the original handler, passing the request, (potentially null) privyUser, and context
      return await handler(req, privyUser, context);
    } catch (error) {
      // If auth fails (AppError from getVerifiedPrivyUserFromCookies) or handler throws an error,
      // use errorResponse to standardize and log it.
      return errorResponse(error);
    }
  };
}

/**
 * Configuration options for webhook verification
 */
export interface WebhookVerificationOptions {
  /**
   * Function to verify the webhook signature
   * @param payload - The raw request body
   * @param signature - The signature from the header
   * @param headers - All request headers for additional context
   * @returns Whether the signature is valid
   */
  verifySignatureFunc: (
    payload: string,
    signature: string,
    headers: Headers
  ) => boolean;
  /**
   * The header name containing the webhook signature
   */
  signatureHeader: string;
  verifySignature: boolean;
}

/**
 * A higher-order function to wrap webhook handlers for standardized
 * success/error responses, webhook signature verification, and error handling.
 *
 * @param handler The webhook handler function.
 *                It receives the NextRequest and the verified webhook payload.
 *                It should return a NextResponse or Response.
 * @param options Configuration for the handler, including webhook verification settings.
 * @returns An async function that takes NextRequest and returns a Promise<NextResponse | Response>.
 */
export function handleWebhook<TPayload = unknown>(
  handler: (
    req: NextRequest,
    payload: TPayload
  ) => Promise<NextResponse | Response>,
  options: WebhookVerificationOptions
): (req: NextRequest) => Promise<NextResponse | Response> {
  return async (req) => {
    const rawBody = await req.text();

    try {
      if (options.verifySignature) {
        // Get the signature from headers
        const signature = req.headers.get(options.signatureHeader);
        if (!signature) {
          return errorResponse(
            new AppError("Missing webhook signature", 401, "MISSING_SIGNATURE"),
            401
          );
        }

        // Verify the webhook signature
        const isValid = options.verifySignatureFunc(
          rawBody,
          signature,
          req.headers
        );
        if (!isValid) {
          return errorResponse(
            new AppError("Invalid signature", 401, "INVALID_SIGNATURE"),
            401
          );
        }
      }

      // Parse the body as JSON for processing
      const payload = JSON.parse(rawBody) as TPayload;

      // Delegate to the original handler
      return await handler(req, payload);
    } catch (error) {
      console.error("Error processing webhook:", error);
      return errorResponse(error, 500);
    }
  };
}
