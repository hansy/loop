# API Request Flow & Error Handling

This document outlines the generic flow for API requests within the web application, covering client-side initiation, authentication within API utilities, API route handling, and standardized error management.

## 1. Client-Side Request Initiation

- **Location**: `webapp/src/lib/client/apiClient.ts`
- **Process**:
  - The client (e.g., React components, contexts) uses helper functions (`apiGet`, `apiPost`, `apiPut`, `apiDelete`) from `apiClient.ts`.
  - These functions wrap the native `fetch` API.
  - The `processResponse` helper within `apiClient.ts` handles:
    - Parsing the JSON response.
    - Checking `res.ok` for success.
    - Returning `data` from `ServerSuccessResponse<T>` on success.
    - Constructing and throwing a `ClientApiError` (using details from `ServerErrorResponse`) on failure or parsing error.
  - Calling code on the client should use `try...catch` to handle `ClientApiError`.

## 2. API Route Handling & Authentication

- **Location**:
  - API Route Files: e.g., `webapp/src/app/api/users/route.ts`
  - Core Logic: `webapp/src/lib/server/apiUtils.ts` (specifically `handleApiRoute`)
  - Authentication: `webapp/src/lib/server/privy.ts` (specifically `getVerifiedPrivyUserFromCookies`)
- **Process**:
  - API route handlers (e.g., `POST` in `/api/users/route.ts`) are wrapped with the `handleApiRoute` higher-order function from `apiUtils.ts`.
  - `handleApiRoute` now centrally manages authentication and error handling.
  - **Authentication within `handleApiRoute`**:
    - It accepts an `options` parameter, where `requireAuth` defaults to `true`.
    - If `requireAuth` is true, `handleApiRoute` calls `await getVerifiedPrivyUserFromCookies(await cookies())`.
      - `cookies()` is from `next/headers`.
      - `getVerifiedPrivyUserFromCookies` (from `privy.ts`) retrieves the `privy-id-token` from cookies and uses `privyClient.getUser({ idToken })` to verify the token and fetch the Privy user object.
      - If token verification or user fetching fails (e.g., token missing, invalid, Privy API error), `getVerifiedPrivyUserFromCookies` throws an `AppError`. This error is caught by `handleApiRoute` and processed by `errorResponse`.
    - The verified Privy `User` object (or `null` if `requireAuth` was `false` and no user was found) is then passed as an argument to the specific API route handler function (e.g., `postHandler`).
  - **Route Handler Logic**:
    - The specific route handler (e.g., `postHandler`) receives the `NextRequest`, the `privyUser` object, and any route `context`.
    - It can then directly use the `privyUser` object for user-specific information (e.g., `privyUser.id` for the DID) without needing to re-fetch or verify the user.
  - **Business Logic & Custom Errors**:
    - The route handler implements its specific business logic.
    - For predictable errors (e.g., resource not found, validation failure), the handler should throw an `AppError` with an appropriate `statusCode`, `errorCode`, and `details`.
  - **Success Response**:
    - On successful completion, the handler returns data using `successResponse(data, statusCode)` (from `apiUtils.ts`).
  - **Error Handling by `handleApiRoute`**:
    - Catches any error thrown within the route handler itself OR during the authentication step within `handleApiRoute`.
    - Uses `errorResponse(error, defaultStatusCode)` to generate a standardized JSON error response.
    - `errorResponse` logs the error server-side.
    - **Production Error Masking**: For `AppError`s with `statusCode >= 500` or generic `Error`s (defaulting to 500), if `NODE_ENV` is 'production', a generic "Internal Server Error" message is sent to the client, hiding specific details. Otherwise (development or 4xx `AppError`s), more detailed error messages are sent.

## Error Types Summary

- **`AppError` (`webapp/src/lib/server/AppError.ts`)**:
  - Custom server-side error class for expected/handled errors.
  - Properties: `statusCode` (HTTP status), `errorCode` (machine-readable string), `details` (additional info).
- **`ClientApiError` (`webapp/src/lib/client/apiClient.ts`)**:
  - Custom client-side error class.
  - Instantiated by `apiClient.ts` when an API call fails or returns an error.
  - Wraps `message`, `errorCode`, `details`, and `statusCode` from the server's `ServerErrorResponse`.

## Standardized Response Formats

### Success (`ServerSuccessResponse<T>`)

```json
{
  "success": true,
  "data": "<T>", // The actual data payload
  "statusCode": "<number>" // e.g., 200, 201
}
```

### Error (`ServerErrorResponse`)

```json
{
  "success": false,
  "message": "<string>", // Human-readable error message
  "errorCode": "<string>", // Optional: Machine-readable error code
  "details": "<unknown>", // Optional: Additional error details
  "statusCode": "<number>" // e.g., 400, 401, 403, 404, 500
}
```

This structure ensures consistent request processing, authentication, error handling, and response formatting, contributing to a more robust, maintainable, and debuggable API.
