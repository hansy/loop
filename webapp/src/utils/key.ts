import { METADATA_FILENAME } from "@/config/filenameConfig";

export const createVideoMetadataKeyName = (videoId: string) => {
  return `${videoId}/${METADATA_FILENAME}`;
};
