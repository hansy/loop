export * from "./userApi";
export * from "./videoApi";

// Standardized success and error response shapes expected from the server
// These should align with what apiUtils.ts (server-side) produces.

interface ServerSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

interface ServerErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
    stack?: string; // Present in non-production
  };
}

// Client-side error class to wrap server errors
export class ClientApiError extends Error {
  public readonly statusCode: number;
  public readonly serverError?: {
    message: string;
    code?: string;
    details?: unknown;
  };

  constructor(
    message: string,
    statusCode: number,
    serverError?: {
      message: string;
      code?: string;
      details?: unknown;
    }
  ) {
    super(message);
    this.name = "ClientApiError";
    this.statusCode = statusCode;
    this.serverError = serverError;
  }
}

// Helper to process the response
async function processResponse<T>(
  response: Response
): Promise<ServerSuccessResponse<T>> {
  const responseBody = await response.json();

  if (!response.ok) {
    // Assuming the body is ServerErrorResponse when !response.ok
    const errorPayload = responseBody as ServerErrorResponse;
    console.error("API Error:", errorPayload.error);
    throw new ClientApiError(
      errorPayload.error.message || "An API error occurred",
      response.status,
      errorPayload.error
    );
  }
  // Assuming the body is ServerSuccessResponse when response.ok
  return responseBody as ServerSuccessResponse<T>;
}

/**
 * Performs a GET request to the specified path.
 * @param path The API endpoint path.
 * @param options Optional RequestInit options.
 * @returns Promise resolving to the data from ServerSuccessResponse.
 * @throws ClientApiError if the request fails or API returns an error.
 */
export async function apiGet<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...options?.headers,
    },
    ...options,
  });
  const result = await processResponse<T>(response);
  return result.data;
}

/**
 * Performs a POST request to the specified path.
 * @param path The API endpoint path.
 * @param body Optional request body (will be JSON.stringify-ed).
 * @param options Optional RequestInit options.
 * @returns Promise resolving to the data from ServerSuccessResponse.
 * @throws ClientApiError if the request fails or API returns an error.
 */
export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
  const result = await processResponse<T>(response);
  return result.data;
}

/**
 * Performs a PUT request to the specified path.
 * @param path The API endpoint path.
 * @param body Optional request body (will be JSON.stringify-ed).
 * @param options Optional RequestInit options.
 * @returns Promise resolving to the data from ServerSuccessResponse.
 * @throws ClientApiError if the request fails or API returns an error.
 */
export async function apiPut<T>(
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
  const result = await processResponse<T>(response);
  return result.data;
}

/**
 * Performs a DELETE request to the specified path.
 * @param path The API endpoint path.
 * @param options Optional RequestInit options.
 * @returns Promise resolving to the data from ServerSuccessResponse (often simple success/message).
 * @throws ClientApiError if the request fails or API returns an error.
 */
export async function apiDelete<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...options?.headers,
    },
    ...options,
  });
  const result = await processResponse<T>(response);
  return result.data;
}
