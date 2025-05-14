import { apiPost, apiGet } from ".";
import { VideoMetadata } from "@/validations/videoSchemas";
import { Video } from "@/types/video";

/**
 * Defines the response structure from the video upload endpoint
 */
export interface VideoUploadResponse {
  videoId: string;
  status: string;
}

/**
 * Uploads video metadata to the backend and initiates transcoding
 *
 * @param metadata - The video metadata to upload
 * @returns A promise that resolves with the video upload response
 * @throws {ClientApiError} If the API call fails
 */
export async function uploadVideo(
  metadata: VideoMetadata
): Promise<VideoUploadResponse> {
  return apiPost<VideoUploadResponse>("/api/videos", metadata);
}

/**
 * Fetches all videos for the authenticated user
 *
 * @returns A promise that resolves with an array of videos
 * @throws {ClientApiError} If the API call fails
 */
export async function getUserVideos(): Promise<Video[]> {
  return apiGet<Video[]>("/api/videos");
}
