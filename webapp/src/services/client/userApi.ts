import { apiPost } from "."; // Adjusted import path

/**
 * Defines the expected structure of the response from the POST /api/users endpoint.
 */
export interface UserCreateResponse {
  newUser: boolean;
  walletAddress: string;
}

/**
 * Calls the backend API to create a new user.
 *
 * @returns {Promise<UserCreateResponse>} A promise that resolves with the user sync response.
 * @throws {ClientApiError} If the API call fails (handled by apiClient).
 */
export async function createUser(): Promise<UserCreateResponse> {
  // The /api/users endpoint currently doesn't expect a body for this POST request.
  // If it did, we would pass it as the second argument to apiPost.
  return apiPost<UserCreateResponse>("/api/users", {});
}
