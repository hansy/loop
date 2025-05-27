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

export const getObject = async (key: string, bucket: string) => {
  const { accessKeyId, secretAccessKey } = CREDS.ipfs;
  const objectManager = new ObjectManager(accessKeyId, secretAccessKey, {
    bucket,
  });

  try {
    const response = await objectManager.get(key, {});

    if (response) {
      return response;
    }

    throw new AppError("Object not found", 404, "FILEBASE_OBJECT_NOT_FOUND", {
      key,
    });
  } catch (error) {
    throw new AppError(
      "Error getting object from Filebase",
      500,
      "FILEBASE_GET_OBJECT_ERROR",
      error
    );
  }
};

export const getObjectCID = async (key: string, bucket: string) => {
  const obj = await getObject(key, bucket);

  return obj.Metadata?.cid;
};
