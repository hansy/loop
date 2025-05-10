import { NextRequest } from "next/server";
import { User } from "@privy-io/server-auth";
import { v7 as uuidv7 } from "uuid";
import { handleApiRoute, successResponse } from "@/lib/server/apiUtils";
import { AppError } from "@/lib/server/AppError";

/**
 * Handles POST requests to create a new user.
 * Authentication is handled by the `handleApiRoute` wrapper, which provides
 * the verified Privy User object.
 *
 * It extracts user information from the Privy User object, generates a unique
 * internal ID, and (currently) logs this information.
 */
async function postHandler(
  req: NextRequest, // req is still available if needed for body, etc.
  privyUser: User | null // privyUser is now passed by handleApiRoute
) {
  if (!privyUser) {
    // This should ideally be caught by handleApiRoute if requireAuth is true (default)
    // But as a safeguard or if requireAuth was explicitly false and we still expect a user here:
    throw new AppError(
      "Authenticated user not available in handler.",
      401,
      "AUTH_USER_UNAVAILABLE"
    );
  }

  const walletAddress = privyUser.wallet?.address || null;
  const email = privyUser.email?.address || privyUser.google?.email || null;
  const internalUserId = uuidv7();

  // Placeholder for database interaction:
  console.log(
    "New user data for database (from /api/users route - standardized):",
    {
      internalUserId,
      did: privyUser.id, // Use privyUser.id directly
      walletAddress,
      email,
      linkedAccounts: privyUser.linkedAccounts.map((acc) => ({
        type: acc.type,
        address: acc.type === "wallet" ? acc.address : undefined,
        email: acc.type === "email" ? acc.address : undefined,
        subject: acc.type === "google_oauth" ? acc.subject : undefined,
      })),
    }
  );

  return successResponse(
    {
      userId: internalUserId,
      did: privyUser.id,
    },
    200, // Or 201 if truly a new resource creation confirmed by DB
    "User processing initiated successfully."
  );
}

// Wrap the handler with handleApiRoute. It will require auth by default.
export const POST = handleApiRoute(postHandler);
