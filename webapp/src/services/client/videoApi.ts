import { apiPost } from ".";
import { VideoMetadata } from "@/validations/videoSchemas";

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
