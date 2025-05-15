import { SessionSigsMap, AuthSig } from "@lit-protocol/types";

/**
 * Extracts the auth signature from a signed message
 *
 * @param signedMessage - The signed message to extract from
 * @returns The auth signature or undefined if not found
 */
const extractAuthSig = (signedMessage: string): AuthSig | undefined => {
  try {
    const parsed = JSON.parse(signedMessage);
    return parsed.capabilities?.[1] || undefined;
  } catch (error) {
    console.error("Error parsing signedMessage:", error);
    return undefined;
  }
};

/**
 * Gets the auth signature from session signatures
 *
 * @param sessionSigs - The session signatures to extract from
 * @returns The auth signature or undefined if not found
 */
export const authSigfromSessionSigs = (
  sessionSigs: SessionSigsMap | undefined
): AuthSig | undefined => {
  if (!sessionSigs) {
    return undefined;
  }

  const keys = Object.keys(sessionSigs);
  const obj = sessionSigs[keys[1]];

  return extractAuthSig(obj.signedMessage);
};
