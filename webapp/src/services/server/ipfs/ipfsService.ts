import { AppError } from "@/services/server/api/error";
import { upload } from "@/services/server/external/filebase";
import { METADATA_BUCKET } from "@/services/server/external/s3";

export const pinJSON = async (
  data: Record<string, string>,
  key: string
): Promise<string> => {
  try {
    const result = await upload(data, key, METADATA_BUCKET);

    return result.cid;
  } catch (error) {
    console.error("Error pinning JSON", error);
    throw new AppError("Error pinning JSON", 500, "IPFS_PIN_JSON_ERROR", error);
  }
};
