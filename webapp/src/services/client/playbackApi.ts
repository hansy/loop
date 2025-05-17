import { apiPost } from ".";
import { PLAYBACK_ENDPOINT } from "@/config/appConfig";
import type { AuthSig } from "@lit-protocol/types";
import type { MediaSrc } from "@vidstack/react";

/**
 * Request body for the playback access endpoint
 */
export interface PlaybackAccessRequest {
  tokenId: string;
  authSig?: AuthSig;
}

/**
 * Fetches a signed URL for video playback.
 *
 * @param params - The request parameters including tokenId and optional authSig.
 * @returns A promise that resolves with the core MediaSrcDetails (InnermostPayload).
 * @throws {ClientApiError} If the API call fails.
 */
export async function getPlaybackSrc(
  params: PlaybackAccessRequest
): Promise<MediaSrc> {
  return await apiPost<MediaSrc>(`${PLAYBACK_ENDPOINT}`, params);
}
