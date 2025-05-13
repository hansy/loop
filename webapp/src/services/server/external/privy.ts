import { PrivyClient, User } from "@privy-io/server-auth";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { AppError } from "../api/error";

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const privyAppSecret = process.env.PRIVY_APP_SECRET;

// Initial console errors for missing env vars are kept for immediate feedback at startup/build
if (!privyAppId) {
  console.error(
    "CRITICAL: Missing NEXT_PUBLIC_PRIVY_APP_ID. Privy client will not function."
  );
}
if (!privyAppSecret) {
  console.error(
    "CRITICAL: Missing PRIVY_APP_SECRET. Privy client will not function."
  );
}

/**
 * The Privy Server Client instance.
 * Initialized once using environment variables.
 * Ensure `NEXT_PUBLIC_PRIVY_APP_ID` and `PRIVY_APP_SECRET` are set.
 */
export const privyClient = (() => {
  if (!privyAppId || !privyAppSecret) {
    // The IIFE still returns null if misconfigured, subsequent checks will handle it.
    return null;
  }
  return new PrivyClient(privyAppId, privyAppSecret);
})();

/**
 * Verifies the Privy authentication token from the provided cookie store and retrieves the full User object.
 * Uses privyClient.getUser({ idToken }) which handles verification internally.
 * Throws AppError on failure (e.g., client not initialized, token invalid, user fetch failed).
 *
 * @param {ReadonlyRequestCookies} cookieStore - An object with a `get` method to retrieve cookies.
 * @returns {Promise<User>} The Privy User object if authentication is successful.
 * @throws {AppError} If Privy client is not initialized, token is missing/invalid, or user fetch fails.
 */
export async function getVerifiedPrivyUserFromCookies(
  cookieStore: ReadonlyRequestCookies
): Promise<User> {
  // Changed return type from Promise<User | null> to Promise<User>
  if (!privyClient) {
    throw new AppError(
      "Server authentication service is not configured.",
      500,
      "PRIVY_CLIENT_UNINITIALIZED"
    );
  }

  const privyIdTokenCookie = cookieStore.get("privy-id-token");

  if (!privyIdTokenCookie || !privyIdTokenCookie.value) {
    // This indicates a client-side issue or missing token, hence 401
    throw new AppError(
      "Authentication token not provided.",
      401,
      "PRIVY_TOKEN_MISSING"
    );
  }

  try {
    const privyUser = await privyClient.getUser({
      idToken: privyIdTokenCookie.value,
    });
    // If getUser resolves but returns nullish (though docs imply it throws or returns User),
    // we might add a check here, but typically it throws on failure.
    if (!privyUser) {
      // Defensive check, Privy docs suggest it throws for invalid tokens/users.
      throw new AppError(
        "Failed to retrieve user from Privy after token validation.",
        500,
        "PRIVY_USER_FETCH_EMPTY"
      );
    }
    return privyUser;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "Error during Privy getUser call (token verification or user fetch):",
      errorMessage,
      { originalError: error } // Log the full original error for details
    );
    // This is an authentication failure (e.g. invalid token) or internal Privy error during fetch.
    // A 401 is appropriate if the token is deemed invalid by Privy.
    // If it was a network error talking to Privy, it might lean towards 500/502, but let's start with 401 for auth issues.
    throw new AppError(
      "Authentication with external service failed.", // Generic message for client
      401, // Or 500 if it was a network issue to Privy, hard to distinguish without parsing Privy errors
      "PRIVY_GET_USER_CALL_FAILED",
      { originalErrorMessage: errorMessage } // Provide original message for server logs via AppError details
    );
  }
}

export const setPrivyUserCustomMetadata = async (
  privyUser: User,
  customMetadata: Record<string, string | number | boolean>
) => {
  try {
    await privyClient?.setCustomMetadata(privyUser.id, customMetadata);
  } catch (error) {
    throw new AppError(
      "Failed to update user custom metadata.",
      500,
      "PRIVY_UPDATE_USER_CUSTOM_METADATA_FAILED",
      { originalError: error }
    );
  }
};
