import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { videos } from "@/db/schema";
import { Video } from "@/types/video";
import { AppError } from "@/services/server/api/error";
import { NewVideoInputSchema, NewVideoInput } from "@/validations/videoSchemas";

/**
 * Creates a new video record in the database.
 *
 * @param {NewVideoInput} videoInput - The data for the new video, matching the Zod schema for validation.
 * @returns {Promise<Video>} The newly created video object.
 * @throws {AppError} If validation fails, required fields are missing, or if a database error occurs.
 */
export async function createVideo(videoInput: NewVideoInput): Promise<Video> {
  const validationResult = NewVideoInputSchema.safeParse(videoInput);

  if (!validationResult.success) {
    throw new AppError(
      "Invalid video data provided for creation.",
      400,
      "VALIDATION_FAILED",
      { issues: validationResult.error.format(), originalInput: videoInput }
    );
  }

  try {
    const insertedVideos = await db
      .insert(videos)
      .values(validationResult.data)
      .returning();

    return insertedVideos[0];
  } catch (error) {
    throw new AppError(
      "Database insertion failed while creating video.",
      500,
      "DB_INSERT_FAILED",
      { originalError: error }
    );
  }
}

/**
 * Finds a video by its ID.
 *
 * @param {string} videoId - The ID of the video to find.
 * @returns {Promise<Video | undefined>} The video object if found, otherwise undefined.
 * @throws {AppError} If a database error occurs.
 */
export async function findVideoById(
  videoId: string
): Promise<Video | undefined> {
  try {
    return await db.query.videos.findFirst({
      where: eq(videos.id, videoId),
    });
  } catch (error) {
    throw new AppError(
      "Database query failed while finding video by ID.",
      500,
      "DB_QUERY_FAILED",
      { originalError: error }
    );
  }
}

/**
 * Finds all videos for a specific user.
 *
 * @param {string} userId - The ID of the user whose videos to find.
 * @returns {Promise<Video[]>} Array of video objects.
 * @throws {AppError} If a database error occurs.
 */
export async function findVideosByUserId(userId: string): Promise<Video[]> {
  try {
    return await db.query.videos.findMany({
      where: eq(videos.userId, userId),
    });
  } catch (error) {
    throw new AppError(
      "Database query failed while finding videos by user ID.",
      500,
      "DB_QUERY_FAILED",
      { originalError: error }
    );
  }
}

/**
 * Updates a video's status and related fields.
 *
 * @param {string} videoId - The ID of the video to update.
 * @param {Partial<Video>} updateData - The fields to update.
 * @returns {Promise<Video>} The updated video object.
 * @throws {AppError} If the video is not found or if a database error occurs.
 */
export async function updateVideo(
  videoId: string,
  updateData: Partial<Video>
): Promise<Video> {
  try {
    const updatedVideos = await db
      .update(videos)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, videoId))
      .returning();

    return updatedVideos[0];
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Database update failed while updating video.",
      500,
      "DB_UPDATE_FAILED",
      { originalError: error }
    );
  }
}

/**
 * Retrieves a video by its Livepeer transcode task ID.
 * This function is primarily used in webhook handlers to find videos
 * associated with completed or failed transcoding tasks.
 *
 * @param {string} taskId - The Livepeer transcode task ID to search for
 * @returns {Promise<Video | undefined>} The video object if found, undefined otherwise
 * @throws {AppError} If a database error occurs during the query
 */
export const getVideoByTranscodeTaskId = async (taskId: string) => {
  try {
    return await db.query.videos.findFirst({
      where: eq(videos.transcodeTaskId, taskId),
    });
  } catch (error) {
    throw new AppError(
      "Database query failed while getting video by transcode task ID.",
      500,
      "DB_QUERY_FAILED",
      {
        originalError: error,
      }
    );
  }
};
