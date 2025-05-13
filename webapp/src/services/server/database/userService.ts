import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { User } from "@/types/db";
import { AppError } from "@/services/server/api/error";
import { NewUserInputSchema, NewUserInput } from "@/validations/userSchemas";

/**
 * Finds a user in the database by their Privy DID.
 *
 * @param {string} privyDid - The Privy DID of the user to find.
 * @returns {Promise<User | undefined>} The user object if found, otherwise undefined.
 * @throws {AppError} If privyDid is missing or if a database error occurs.
 */
export async function findUserByPrivyDid(
  privyDid: string
): Promise<User | undefined> {
  try {
    return await db.query.users.findFirst({
      where: eq(users.did, privyDid),
    });
  } catch (error) {
    throw new AppError(
      "Database query failed while finding user by Privy DID.",
      500,
      "DB_QUERY_FAILED",
      { originalError: error } // Ensure the original 'empty' error is still passed along
    );
  }
}

/**
 * Validates input and creates a new user in the database.
 *
 * @param {NewUserInput} userInput - The data for the new user, matching the Zod schema for validation.
 * @returns {Promise<User>} The newly created user object.
 * @throws {AppError} If validation fails, required fields are missing, or if a database error occurs.
 */
export async function createUser(userInput: NewUserInput): Promise<User> {
  const validationResult = NewUserInputSchema.safeParse(userInput);

  if (!validationResult.success) {
    throw new AppError(
      "Invalid user data provided for creation.",
      400,
      "VALIDATION_FAILED",
      { issues: validationResult.error.format(), originalInput: userInput }
    );
  }

  try {
    const insertedUsers = await db
      .insert(users)
      .values(validationResult.data)
      .returning();

    if (!insertedUsers || insertedUsers.length === 0) {
      throw new AppError(
        "User creation failed: No data returned after insert.",
        500,
        "DB_INSERT_NO_RETURN"
      );
    }
    return insertedUsers[0];
  } catch (error: unknown) {
    let isUniqueConstraint = false;
    let constraintDetails: string | undefined;
    if (
      error instanceof Error &&
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      isUniqueConstraint = true;
      if ("constraint" in error) {
        constraintDetails = (error as { constraint: string }).constraint;
      }
    }

    if (isUniqueConstraint) {
      throw new AppError(
        "A user with the provided ID, Privy DID, email, or wallet address already exists.",
        409,
        "USER_ALREADY_EXISTS",
        { originalError: error, conflictingConstraint: constraintDetails }
      );
    }

    throw new AppError(
      "Database insertion failed while creating user.",
      500,
      "DB_INSERT_FAILED",
      { originalError: error }
    );
  }
}
