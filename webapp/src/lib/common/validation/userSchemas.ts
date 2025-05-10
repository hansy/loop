import { z } from "zod";

/**
 * Schema for validating the input data when creating a new user.
 * This data is typically extracted from the Privy user object, plus a generated ID.
 */
export const NewUserInputSchema = z.object({
  id: z
    .string({
      required_error: "ID is required.",
      invalid_type_error: "ID must be a string.",
    })
    .uuid("ID must be a valid UUID."),

  did: z
    .string({
      required_error: "Privy DID (did) is required.",
      invalid_type_error: "Privy DID (did) must be a string.",
    })
    .min(1, "Privy DID (did) cannot be empty."),

  walletAddress: z
    .string({
      required_error: "Wallet address is required.",
      invalid_type_error: "Wallet address must be a string.",
    })
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      "Invalid wallet address format. Must be a 42-character hex string starting with 0x."
    ),

  emailAddress: z
    .string({
      invalid_type_error: "Email address must be a string.",
    })
    .email("Invalid email address format.")
    .nullable()
    .optional(),
});

/**
 * TypeScript type inferred from the NewUserInputSchema.
 * Useful for type hinting elsewhere in the application.
 */
export type NewUserInput = z.infer<typeof NewUserInputSchema>;
