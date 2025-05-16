import { VideoMetadata } from "@/types";
import type { AccessControlState } from "@/features/accessControl/types";
import { convertFromLitFormat } from "@/features/accessControl/utils/litConversion";

/**
 * Derives access control state from video metadata
 * @param metadata Video metadata containing playback access control
 * @returns Access control state for the unlock wizard
 */
export function deriveAccessControl(
  metadata: VideoMetadata
): AccessControlState {
  if (!metadata.playbackAccess?.acl) {
    return [];
  }
  return convertFromLitFormat(metadata.playbackAccess.acl);
}
