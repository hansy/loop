/**
 * Custom error class for application-specific errors on the server-side.
 * Allows for specifying an HTTP status code, an optional internal error code,
 * and optional structured details for the error.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;
  public readonly details?: unknown;

  /**
   * Creates an instance of AppError.
   * @param {string} message - The error message.
   * @param {number} [statusCode=500] - The HTTP status code associated with the error.
   * @param {string} [errorCode] - An optional internal error code string for specific error identification.
   * @param {unknown} [details] - Optional structured details providing more context about the error.
   */
  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name; // Set the error name to the class name
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;

    // This line is important for correctly capturing the stack trace in Node.js
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}
