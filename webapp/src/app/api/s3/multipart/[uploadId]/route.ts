import { NextRequest } from "next/server";
import {
  abortMultipartUpload,
  listParts,
  initializeS3Client,
} from "@/lib/common/utils/s3/index";
import { handleApiRoute } from "@/lib/server/apiUtils";
import { AppError } from "@/lib/server/AppError";
import { User } from "@privy-io/server-auth";

/**
 * GET /api/s3/multipart/[uploadId]
 *
 * Lists all parts of a multipart upload.
 *
 * Query parameters:
 * - key: string; // S3 key for the upload
 *
 * Response:
 * {
 *   success: true,
 *   data: Part[]; // Array of parts with PartNumber and ETag
 * }
 */
async function getHandler(
  req: NextRequest,
  privyUser: User | null,
  context: { params: { uploadId: string } }
): Promise<Response> {
  if (!privyUser) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { uploadId } = context.params;
  const key = req.nextUrl.searchParams.get("key");

  if (!key || typeof key !== "string") {
    throw new AppError(
      "Content key must be a string",
      400,
      "INVALID_CONTENT_KEY"
    );
  }

  const s3 = initializeS3Client("uploadVideo");
  const parts = await listParts(s3, {
    key,
    uploadId,
  });

  return Response.json({ success: true, data: parts });
}

/**
 * DELETE /api/s3/multipart/[uploadId]
 *
 * Aborts a multipart upload and cleans up any uploaded parts.
 *
 * Query parameters:
 * - key: string; // S3 key for the upload
 *
 * Response:
 * {
 *   success: true
 * }
 */
async function deleteHandler(
  req: NextRequest,
  privyUser: User | null,
  context: { params: { uploadId: string } }
): Promise<Response> {
  if (!privyUser) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { uploadId } = context.params;
  const key = req.nextUrl.searchParams.get("key");

  if (!key || typeof key !== "string") {
    throw new AppError(
      "The object key must be passed as a query parameter. For example: ?key=abc.jpg",
      400,
      "INVALID_KEY_PARAMETER"
    );
  }

  const s3 = initializeS3Client("uploadVideo");
  await abortMultipartUpload(s3, {
    key,
    uploadId,
  });

  return Response.json({ success: true });
}

export const GET = handleApiRoute(getHandler, { requireAuth: true });
export const DELETE = handleApiRoute(deleteHandler, { requireAuth: true });
