import { useMemo } from "react";
import type { VideoMetadata } from "@/types/video";
import type { UnlockOption } from "../types";
import { deriveAccessControl } from "../utils/accessControl";
import { extractUnlockOptions } from "../reducer"; // Assuming extractUnlockOptions can be used as a standalone utility

/**
 * Custom hook to derive unlock options for a video.
 *
 * @param metadata - The metadata of the video.
 * @returns An array of unlock options.
 */
export const useUnlockOptions = (
  metadata: VideoMetadata | undefined
): UnlockOption[] => {
  const unlockOptions = useMemo(() => {
    if (!metadata) {
      return [];
    }
    const accessControl = deriveAccessControl(metadata);
    return extractUnlockOptions(accessControl, metadata);
  }, [metadata]);

  return unlockOptions;
};
