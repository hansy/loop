import { handleApiRoute } from "@/services/server/api";
import { LinkedAccountWithMetadata } from "@privy-io/react-auth";
import { createUser } from "@/services/server/database";
import { AppError } from "@/services/server/api/error";
import { successResponse } from "@/services/server/api";
import { setPrivyUserCustomMetadata } from "@/services/server/external/privy";
import { getLatestWallet } from "@/utils/privyUtils";
import { v7 } from "uuid";

/**
 * POST /api/users
 *
 * Creates a new user in the database if one doesn't exist for the authenticated Privy user.
 * If a user already exists (based on Privy DID or wallet address), returns 200 OK.
 *
 * @returns {Promise<Response>} 201 Created for new users, 200 OK for existing users, or an error response.
 */
export const POST = handleApiRoute(async (_req, privyUser) => {
  if (!privyUser) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const wallet = getLatestWallet(
    privyUser.linkedAccounts as LinkedAccountWithMetadata[]
  );

  if (privyUser.customMetadata.appUserId) {
    return successResponse(
      { newUser: false, walletAddress: wallet.address },
      200
    );
  }

  const email = privyUser.email?.address || privyUser.google?.email;

  // Construct user input from Privy user data
  const userInput = {
    id: v7(), // Generate a UUID for the user ID
    did: privyUser.id,
    walletAddress: wallet.address,
    emailAddress: email,
  };

  try {
    await createUser(userInput);
    await setPrivyUserCustomMetadata(privyUser, {
      appUserId: userInput.id,
    });

    return successResponse(
      { newUser: true, walletAddress: wallet.address },
      201
    );
  } catch (error) {
    // Check if the error is a user already exists error
    if (
      error instanceof AppError &&
      error.errorCode === "USER_ALREADY_EXISTS"
    ) {
      // User already exists, return 200 OK
      return successResponse(
        { newUser: false, walletAddress: wallet.address },
        200
      );
    }
    // Re-throw other errors to be handled by handleApiRoute
    throw error;
  }
});
