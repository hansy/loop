import { handleApiRoute } from "@/lib/server/utils/api";
import { createUser } from "@/lib/server/data/userService";
import { AppError } from "@/lib/server/AppError";
import { successResponse } from "@/lib/server/utils/api";
import { User as PrivyUserType } from "@privy-io/server-auth";
import { setPrivyUserCustomMetadata } from "@/lib/server/privy";
/**
 * POST /api/users
 *
 * Creates a new user in the database if one doesn't exist for the authenticated Privy user.
 * If a user already exists (based on Privy DID or wallet address), returns 200 OK.
 *
 * @returns {Promise<Response>} 201 Created for new users, 200 OK for existing users, or an error response.
 */
export const POST = handleApiRoute(
  async (req, privyUser: PrivyUserType | null) => {
    if (!privyUser) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (privyUser.customMetadata.appUserId) {
      return successResponse({ newUser: false }, 200);
    }

    const email = privyUser.email?.address || privyUser.google?.email;

    // Construct user input from Privy user data
    const userInput = {
      id: crypto.randomUUID(), // Generate a UUID for the user ID
      did: privyUser.id,
      walletAddress: privyUser.wallet?.address || "",
      emailAddress: email,
    };

    try {
      await createUser(userInput);
      await setPrivyUserCustomMetadata(privyUser, {
        appUserId: userInput.id,
      });

      return successResponse({ newUser: true }, 201);
    } catch (error) {
      // Check if the error is a user already exists error
      if (
        error instanceof AppError &&
        error.errorCode === "USER_ALREADY_EXISTS"
      ) {
        // User already exists, return 200 OK
        return successResponse({ newUser: false }, 200);
      }
      // Re-throw other errors to be handled by handleApiRoute
      throw error;
    }
  }
);
