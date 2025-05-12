import { NextRequest } from "next/server";
import {
  abortMultipartUpload,
  listParts,
  initializeS3Client,
} from "@/lib/common/utils/s3/index";
import { handleApiRoute } from "@/lib/server/utils/api";
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
  context: { params: Promise<{ uploadId: string }> }
): Promise<Response> {
  console.log("getHandler");
  if (!privyUser) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  console.log("context", context);

  const { uploadId } = await context.params;
  console.log("uploadId!", uploadId);
  const key = req.nextUrl.searchParams.get("key");
  console.log("key!", key);

  if (!key || typeof key !== "string") {
    throw new AppError("Missing or invalid key parameter", 400);
  }

  try {
    const s3 = initializeS3Client("uploadVideo");
    const parts = await listParts(s3, {
      key,
      uploadId,
    });
    return Response.json({ success: true, data: parts });
  } catch (error) {
    console.error("Error listing parts:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    throw new AppError("Failed to list parts", 500);
  }
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
  { params }: { params: Promise<{ uploadId: string }> }
): Promise<Response> {
  if (!privyUser) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { uploadId } = await params;
  const key = req.nextUrl.searchParams.get("key");

  if (!key || typeof key !== "string") {
    throw new AppError("Missing or invalid key parameter", 400);
  }

  try {
    const s3 = initializeS3Client("uploadVideo");
    await abortMultipartUpload(s3, {
      key,
      uploadId,
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.name === "AccessDenied") {
      throw new AppError(
        "Access denied to abort upload. Please check S3 permissions and bucket policy.",
        403
      );
    }
    throw new AppError("Failed to abort upload", 500);
  }
}

export const GET = handleApiRoute(getHandler, { requireAuth: true });
export const DELETE = handleApiRoute(deleteHandler, { requireAuth: true });
