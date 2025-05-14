import { ObjectManager } from "@filebase/sdk";
import { CREDS } from "./s3";
import { AppError } from "@/services/server/api/error";

export const upload = async (
  data: Record<string, string>,
  key: string,
  bucket: string
) => {
  try {
    const { accessKeyId, secretAccessKey } = CREDS.ipfs;
    const objectManager = new ObjectManager(accessKeyId, secretAccessKey, {
      bucket,
    });

    return await objectManager.upload(key, JSON.stringify(data), {}, {});
  } catch (error) {
    throw new AppError(
      "Error uploading to Filebase",
      500,
      "FILEBASE_UPLOAD_ERROR",
      error
    );
  }
};
