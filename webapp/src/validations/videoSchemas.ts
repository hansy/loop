import { z } from "zod";

/**
 * Schema for validating video source.
 */
const VideoSourceSchema = z.object({
  id: z.string(),
  src: z.string().url(),
  type: z.string(),
});

/**
 * Schema for validating video cover image.
 */
// const VideoCoverImageSchema = z.object({
//   width: z.number().int().positive(),
//   height: z.number().int().positive(),
//   src: z.string().url(),
// });

/**
 * Schema for validating video price.
 */
const VideoPriceSchema = z.object({
  amount: z.bigint(),
  currency: z.literal("USDC"),
  denominatedSubunits: z.bigint(),
});

/**
 * Schema for validating video access control.
 */
const VideoAccessSchema = z.object({
  acl: z.record(z.unknown()),
  type: z.literal("lit"),
  ciphertext: z.string().optional(),
  dataToEncryptHash: z.string().optional(),
});

/**
 * Base schema for video metadata.
 */
const VideoMetadataBaseSchema = z.object({
  id: z.string().uuid(),
  tokenId: z.bigint(),
  title: z.string().min(1),
  creator: z.string(),
  description: z.string().optional(),
  visibility: z.enum(["public", "protected"]),
  isDownloadable: z.boolean(),
  isNSFW: z.boolean(),
  price: VideoPriceSchema,
  sources: z.array(VideoSourceSchema).min(1, "Video must be uploaded first"),
  coverImage: z.string().url().optional(),
  playbackAccess: VideoAccessSchema.optional(),
});

/**
 * Schema for validating protected video metadata.
 */
const VideoMetadataProtectedSchema = VideoMetadataBaseSchema.extend({
  visibility: z.literal("protected"),
  playbackAccess: VideoAccessSchema,
});

/**
 * Schema for validating public video metadata.
 */
const VideoMetadataPublicSchema = VideoMetadataBaseSchema.extend({
  visibility: z.literal("public"),
});

/**
 * Schema for validating video metadata.
 */
export const VideoMetadataSchema = z.discriminatedUnion("visibility", [
  VideoMetadataProtectedSchema,
  VideoMetadataPublicSchema,
]);

/**
 * Schema for validating the input data when creating a new video.
 */
export const NewVideoInputSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  metadata: VideoMetadataSchema,
});

/**
 * TypeScript types inferred from the schemas.
 */
export type VideoMetadata = z.infer<typeof VideoMetadataSchema>;
export type NewVideoInput = z.infer<typeof NewVideoInputSchema>;
