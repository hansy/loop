import { METADATA_FILENAME } from "@/config/filename";

export const createVideoMetadataKeyName = (videoId: string) => {
  return `${videoId}/${METADATA_FILENAME}`;
};
