import { NextRequest } from "next/server";
import {
  getUploadPartSignedUrl,
  initializeS3Client,
} from "@/services/server/external/s3/index";
import { handleApiRoute } from "@/services/server/api";
import { AppError } from "@/services/server/api/error";
import { User } from "@privy-io/server-auth";

/**
 * GET /api/s3/multipart/[uploadId]/[partId]
 *
 * Gets a presigned URL for uploading a specific part of a multipart upload.
 *
 * Query parameters:
 * - key: string; // S3 key for the upload
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     url: string;     // Presigned URL for uploading the part
 *     expires: number; // URL expiration time in seconds
 *   }
 * }
 */

async function handler(
  req: NextRequest,
  privyUser: User | null,
  {
    params,
  }: {
    params: Promise<{ uploadId: string; partId: string }>;
  }
): Promise<Response> {
  if (!privyUser) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { uploadId, partId } = await params;
  const key = req.nextUrl.searchParams.get("key");
  const partNumber = parseInt(partId, 10);

  if (isNaN(partNumber) || partNumber < 1) {
    throw new AppError("Invalid part number", 400, "INVALID_PART_NUMBER");
  }

  if (!key || typeof key !== "string") {
    throw new AppError("Missing key parameter", 400, "MISSING_KEY_PARAMETER");
  }

  const s3 = initializeS3Client("uploadVideo");
  const data = await getUploadPartSignedUrl(s3, {
    key,
    uploadId,
    partNumber,
  });

  return Response.json({ success: true, data });
}

export const GET = handleApiRoute(handler);
