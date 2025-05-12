import { NextRequest } from "next/server";
import {
  completeMultipartUpload,
  initializeS3Client,
} from "@/lib/common/utils/s3/index";
import { handleApiRoute } from "@/lib/server/utils/api";
import { AppError } from "@/lib/server/AppError";
import { User } from "@privy-io/server-auth";

/**
 * POST /api/s3/multipart/[uploadId]/complete
 *
 * Completes a multipart upload by combining all parts.
 *
 * Query parameters:
 * - key: string; // S3 key for the upload
 *
 * Request body:
 * {
 *   parts: Part[]; // Array of parts with PartNumber and ETag
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     location: string; // URL of the completed upload
 *   }
 * }
 */
async function handler(
  req: NextRequest,
  privyUser: User | null,
  context: { params: { uploadId: string } }
): Promise<Response> {
  if (!privyUser) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { uploadId } = context.params;
  const key = req.nextUrl.searchParams.get("key");
  const body = await req.json();
  const { parts } = body;

  if (!key || typeof key !== "string") {
    throw new AppError(
      "Missing or invalid key parameter",
      400,
      "INVALID_KEY_PARAMETER"
    );
  }

  if (!Array.isArray(parts) || parts.length === 0) {
    throw new AppError(
      "Missing or invalid parts array",
      400,
      "INVALID_PARTS_ARRAY"
    );
  }

  // Validate each part has required properties
  for (const part of parts) {
    if (!part.PartNumber || !part.ETag) {
      throw new AppError(
        "Invalid part format. Each part must have PartNumber and ETag",
        400,
        "INVALID_PART_FORMAT"
      );
    }
  }

  const s3 = initializeS3Client("uploadVideo");

  // Complete the multipart upload
  const location = await completeMultipartUpload(s3, {
    key,
    uploadId,
    parts,
  });

  return Response.json({
    success: true,
    data: { location },
  });
}

export const POST = handleApiRoute(handler, { requireAuth: true });
