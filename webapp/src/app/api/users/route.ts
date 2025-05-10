import { NextRequest } from "next/server";
import { User } from "@privy-io/server-auth";
import { v7 as uuidv7 } from "uuid";
import { handleApiRoute, successResponse } from "@/lib/server/apiUtils";
import { AppError } from "@/lib/server/AppError";

/**
 * Handles POST requests to create a new user or sync an existing one.
 * Authentication is handled by `handleApiRoute`.
 *
 * Checks if an `internalUserId` is already set in Privy user's custom metadata.
 * If yes, returns existing user data.
 * If no, generates a new `internalUserId`, (simulates DB save), sets it in Privy custom metadata,
 * and then returns the new user data.
 */
async function postHandler(req: NextRequest, privyUser: User | null) {
  if (!privyUser) {
    throw new AppError(
      "Authenticated user not available in handler.",
      401,
      "AUTH_USER_UNAVAILABLE"
    );
  }

  // New user: Generate internal ID, (simulate DB save), then set metadata
  const internalUserId = uuidv7();
  const walletAddress = privyUser.wallet?.address || null;
  const email = privyUser.email?.address || privyUser.google?.email || null;

  // --- BEGIN Placeholder for Database Interaction ---
  console.log("New user registration: Data for database save:", {
    internalUserId,
    did: privyUser.id,
    walletAddress,
    email,
    // Consider saving linkedAccounts details as well
    // linkedAccounts: privyUser.linkedAccounts.map(acc => ({ ... })),
  });
  // --- END Placeholder for Database Interaction ---

  return successResponse(
    {
      userId: internalUserId,
      did: privyUser.id,
      existingUser: false,
    },
    201, // 201 Created for new user
    "User successfully created and registered."
  );
}

export const POST = handleApiRoute(postHandler);
