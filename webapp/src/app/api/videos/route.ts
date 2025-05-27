import { NextRequest } from "next/server";
import { handleApiRoute, successResponse } from "@/services/server/api";
import { AppError } from "@/services/server/api/error";
import { User as PrivyUserType } from "@privy-io/server-auth";
import { createVideo, updateVideo } from "@/services/server/database";
import { VideoMetadataSchema } from "@/validations/videoSchemas";
import { transcode } from "@/services/server/external/livepeer";
import { getObjectCID } from "@/services/server/external/filebase";
import { IPFS_BUCKET } from "@/services/server/external/s3";

/**
 * POST /api/videos
 *
 * Creates a new video record and initiates transcoding with Livepeer.
 * Requires authentication.
 *
 * @returns {Promise<Response>} 201 Created with video details or an error response
 */
export const POST = handleApiRoute(
  async (req: NextRequest, privyUser: PrivyUserType | null) => {
    if (!privyUser) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = await req.json();

    // Validate the metadata
    const validationResult = VideoMetadataSchema.safeParse(body);

    if (!validationResult.success) {
      throw new AppError(
        "Invalid video metadata provided",
        400,
        "VALIDATION_FAILED",
        { issues: validationResult.error.format() }
      );
    }

    const metadata = validationResult.data;

    // Get the cover image CID from IPFS
    if (metadata.coverImage) {
      const coverImageCID = await getObjectCID(
        metadata.coverImage.id,
        IPFS_BUCKET
      );

      if (coverImageCID) {
        metadata.coverImage.src = `ipfs://${coverImageCID}`;
      } else {
        metadata.coverImage = undefined;
      }
    }

    // Create video record using the service
    const video = await createVideo({
      id: metadata.id,
      userId: privyUser.customMetadata.appUserId as string,
      metadata,
    });

    // Send transcode request to Livepeer
    const transcodeTaskId = await transcode(video.id, metadata.sources[0]);

    // Update video record with transcode task ID
    const updatedVideo = await updateVideo(video.id, {
      transcodeTaskId,
    });

    return successResponse(
      {
        videoId: updatedVideo.id,
        status: updatedVideo.status,
      },
      201
    );
  },
  { requireAuth: true }
);
