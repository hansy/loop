import { NextRequest } from "next/server";
import {
  createMultipartUpload,
  initializeS3Client,
} from "@/lib/common/utils/s3/index";
import { handleApiRoute } from "@/lib/server/utils/api";
import { AppError } from "@/lib/server/AppError";
import { User } from "@privy-io/server-auth";

/**
 * POST /api/s3/multipart
 *
 * Initiates a multipart upload to S3.
 *
 * Request body:
 * {
 *   type: string;      // Content type of the file
 *   metadata: object;  // Optional metadata for the upload
 *   key: string;       // S3 key for the upload
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     key: string;     // S3 key
 *     uploadId: string; // Upload ID for the multipart upload
 *   }
 * }
 */
async function handler(
  req: NextRequest,
  privyUser: User | null
): Promise<Response> {
  if (!privyUser) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const body = await req.json();
  const { type, metadata, key } = body;

  if (typeof key !== "string") {
    throw new AppError(
      "Content key must be a string",
      400,
      "INVALID_CONTENT_KEY"
    );
  }

  if (typeof type !== "string") {
    throw new AppError(
      "Content type must be a string",
      400,
      "INVALID_CONTENT_TYPE"
    );
  }

  const s3 = initializeS3Client("uploadVideo");
  const data = await createMultipartUpload(s3, {
    key,
    contentType: type,
    metadata: metadata || {},
  });

  return Response.json({ success: true, data });
}

export const POST = handleApiRoute(handler, { requireAuth: true });
