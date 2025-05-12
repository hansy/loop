import { z } from "zod";

// Base schema for common fields
const baseTokenRuleSchema = z.object({
  id: z.string(),
  type: z.literal("token"),
  chain: z.string().min(1, "Chain is required"),
  contract: z
    .string()
    .min(1, "Contract address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address format"),
});

// ERC20 specific schema
export const erc20RuleSchema = baseTokenRuleSchema.extend({
  subtype: z.literal("ERC20"),
  numTokens: z.number().min(1, "Number of tokens must be at least 1"),
});

// ERC721 specific schema
export const erc721RuleSchema = baseTokenRuleSchema.extend({
  subtype: z.literal("ERC721"),
  tokenId: z.string().optional(),
});

// ERC1155 specific schema
export const erc1155RuleSchema = baseTokenRuleSchema.extend({
  subtype: z.literal("ERC1155"),
  numTokens: z.number().min(1, "Number of tokens must be at least 1"),
  tokenId: z.string().min(1, "Token ID is required"),
});

// Union type for all token rules
export const tokenRuleSchema = z.discriminatedUnion("subtype", [
  erc20RuleSchema,
  erc721RuleSchema,
  erc1155RuleSchema,
]);

// Type inference
export type TokenRuleSchema = z.infer<typeof tokenRuleSchema>;

// Validation function that returns error messages
export function validateTokenRule(rule: unknown): {
  success: boolean;
  error?: string;
} {
  const result = tokenRuleSchema.safeParse(rule);

  if (result.success) {
    return { success: true };
  }

  // Format the error message
  const errorMessage = result.error.errors.map((err) => err.message).join(", ");

  return { success: false, error: errorMessage };
}
