import { z } from "zod";
import {
  VideoMetadataSchema,
  VideoMetadata,
} from "@/lib/common/validation/videoSchemas";
import { v7 as uuidv7 } from "uuid";

/**
 * Schema for validating form input during video creation
 * This schema is used for both client and server-side validation
 */
export const createVideoFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  visibility: z.enum(["public", "protected"] as const),
  isPaywalled: z.boolean(),
  price: z.number().min(0, "Price must be 0 or greater"),
  accessControlConditions: z.record(z.unknown()).optional(),
});

export type CreateVideoFormInput = z.infer<typeof createVideoFormSchema>;

/**
 * Validates form input and returns a properly formatted VideoMetadata object
 * @param input - The form input data
 * @param creator - The creator's wallet address
 * @returns The validated and formatted video metadata
 */
export function validateAndFormatVideoMetadata(
  input: CreateVideoFormInput,
  creator: string
): Omit<VideoMetadata, "id" | "tokenId" | "sources" | "coverImage"> {
  const validated = createVideoFormSchema.parse(input);

  // Format the price based on visibility and paywall status
  const price = {
    amount: BigInt(validated.isPaywalled ? validated.price * 1e6 : 0), // Convert to USDC subunits (6 decimals)
    currency: "USDC" as const,
    denominatedSubunits: BigInt(
      validated.isPaywalled ? validated.price * 1e6 : 0
    ),
  };

  // Format the access control conditions
  const playbackAccess =
    validated.visibility === "protected" && validated.accessControlConditions
      ? {
          acl: validated.accessControlConditions,
          type: "lit" as const,
        }
      : undefined;

  const metadata = {
    title: validated.title,
    description: validated.description,
    creator,
    visibility: validated.visibility,
    isDownloadable: false,
    isNSFW: false,
    price,
    playbackAccess,
  };

  // Validate the final metadata against the VideoMetadataSchema
  if (validated.visibility === "protected") {
    VideoMetadataSchema.parse({
      ...metadata,
      id: uuidv7(), // Temporary ID for validation
      tokenId: BigInt(0), // Temporary tokenId for validation
      sources: [], // Empty sources for validation
      coverImage: "https://placeholder.com", // Temporary cover image for validation
    });
  } else {
    VideoMetadataSchema.parse({
      ...metadata,
      id: uuidv7(), // Temporary ID for validation
      tokenId: BigInt(0), // Temporary tokenId for validation
      sources: [], // Empty sources for validation
      coverImage: "https://placeholder.com", // Temporary cover image for validation
    });
  }

  return metadata;
}
