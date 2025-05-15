import { apiPost } from ".";
import { PLAYBACK_ENDPOINT } from "@/config/appConfig";
import type { AuthSig } from "@lit-protocol/types";

/**
 * Response structure from the playback access endpoint
 */
export interface PlaybackAccessResponse {
  data: string;
}

/**
 * Request body for the playback access endpoint
 */
export interface PlaybackAccessRequest {
  tokenId: string;
  authSig?: AuthSig;
}

/**
 * Fetches a signed URL for video playback
 *
 * @param tokenId - The token ID of the video
 * @param authSig - Optional auth signature for protected videos
 * @returns A promise that resolves with the playback access response
 * @throws {ClientApiError} If the API call fails
 */
export async function getPlaybackUrl(
  params: PlaybackAccessRequest
): Promise<PlaybackAccessResponse> {
  return apiPost<PlaybackAccessResponse>(`${PLAYBACK_ENDPOINT}`, params);
}
