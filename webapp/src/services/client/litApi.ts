/**
 * Service for handling Lit Protocol related API calls
 */

import { apiGet } from ".";
import { AuthSig } from "@lit-protocol/types";

/**
 * Defines the expected structure of the response from the GET /api/das endpoint.
 */
export interface DelegatedAuthSigResponse {
  delegatedAuthSig: AuthSig;
}

/**
 * Fetches a delegated auth signature from the backend.
 *
 * @returns {Promise<AuthSig>} A promise that resolves with the delegated auth signature.
 * @throws {ClientApiError} If the API call fails (handled by apiClient).
 */
export async function fetchDelegatedAuthSig(
  walletAddress: string
): Promise<AuthSig> {
  return apiGet<DelegatedAuthSigResponse>(
    `/api/das?walletAddress=${walletAddress}`
  ).then((response) => response.delegatedAuthSig);
}
