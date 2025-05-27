import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  ListPartsCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type Part,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "@/services/server/api/error";
import {
  type StorageType,
  type S3CredentialsMap,
  type SplitKeyResult,
  type CreateMultipartUploadParams,
  type CreateMultipartUploadResponse,
  type UploadPartParams,
  type UploadPartResponse,
  type ListPartsParams,
  type CompleteMultipartUploadParams,
  type AbortMultipartUploadParams,
  type PutObjectParams,
  type RemoveObjectParams,
} from "./types";

export const IPFS_BUCKET = process.env.NEXT_PUBLIC_S3_IPFS_BUCKET as string;
export const STORJ_BUCKET = process.env.NEXT_PUBLIC_S3_STORJ_BUCKET as string;

export const CREDS: S3CredentialsMap = {
  storj: {
    accessKeyId: String(process.env.S3_VIDEO_UPLOAD_ACCESS_KEY),
    secretAccessKey: String(process.env.S3_VIDEO_UPLOAD_SECRET_KEY),
    endpoint: String(process.env.S3_VIDEO_UPLOAD_ENDPOINT),
  },
  ipfs: {
    accessKeyId: String(process.env.S3_IPFS_ACCESS_KEY),
    secretAccessKey: String(process.env.S3_IPFS_SECRET_KEY),
    endpoint: String(process.env.S3_IPFS_ENDPOINT),
  },
};

const getStorageType = (storageType?: StorageType): string => {
  switch (storageType) {
    case "storj":
      return STORJ_BUCKET;
    case "ipfs":
      return IPFS_BUCKET;
    default:
      return STORJ_BUCKET;
  }
};

/**
 * Initializes an S3 client with the specified credentials
 * @param credType - The type of credentials to use
 * @returns An initialized S3Client instance
 */
export const initializeS3Client = (storageType: StorageType): S3Client => {
  return new S3Client({
    endpoint: CREDS[storageType].endpoint,
    region: "us-east-1",
    credentials: {
      accessKeyId: CREDS[storageType].accessKeyId,
      secretAccessKey: CREDS[storageType].secretAccessKey,
    },
  });
};

/**
 * Splits an S3 key into ID and filename components
 * @param key - The S3 key to split
 * @returns An object containing the ID and filename, or empty object if invalid
 */
export const splitKey = (key: string): SplitKeyResult => {
  const regex = /^([^\/]+)\/([^\/]+)$/;
  const match = key.match(regex);

  if (!match || match.length !== 3) {
    return {};
  }

  return {
    id: match[1],
    filename: match[2],
  };
};

/**
 * Validates if a part number is within acceptable range
 * @param partNumber - The part number to validate
 * @returns True if the part number is valid
 */
export const validatePartNumber = (partNumber: number): boolean => {
  return (
    Number.isInteger(partNumber) && partNumber >= 1 && partNumber <= 10_000
  );
};

/**
 * Validates if a part object has the required properties
 * @param part - The part object to validate
 * @returns True if the part is valid
 */
export const isValidPart = (part: Part): boolean => {
  return (
    part &&
    typeof part === "object" &&
    typeof part.PartNumber === "number" &&
    typeof part.ETag === "string"
  );
};

/**
 * Gets a presigned URL for uploading an object
 * @param s3 - The S3 client instance
 * @param storageType - The type of bucket to use
 * @param key - The object key
 * @returns An object containing the HTTP method and presigned URL
 */
export const getPresignedUrl = async (
  s3: S3Client,
  key: string,
  storageType?: StorageType
): Promise<{ method: string; url: string }> => {
  const params = {
    Key: key,
    Bucket: getStorageType(storageType),
  };

  const command = new PutObjectCommand(params);

  try {
    const url = await getSignedUrl(s3, command);
    return { method: "PUT", url };
  } catch (e) {
    console.error("Error Getting pre-signed url", e);
    throw new AppError(
      "Failed to generate presigned URL",
      500,
      "S3_PRESIGNED_URL_ERROR",
      e
    );
  }
};

/**
 * Gets a presigned URL for retrieving an object
 * @param s3 - The S3 client instance
 * @param key - The object key
 * @returns The presigned URL
 */
export const getObjectPresigned = async (
  s3: S3Client,
  key: string,
  storageType?: StorageType
): Promise<string> => {
  const params = {
    Bucket: getStorageType(storageType),
    Key: key,
  };
  const command = new GetObjectCommand(params);

  try {
    return await getSignedUrl(s3, command);
  } catch (e) {
    console.error("Error Getting Object", e);
    throw new AppError(
      "Failed to generate object presigned URL",
      500,
      "S3_OBJECT_PRESIGNED_URL_ERROR",
      e
    );
  }
};

/**
 * Initiates a multipart upload
 * @param s3 - The S3 client instance
 * @param params - The parameters for creating the multipart upload
 * @returns The upload ID and key
 */
export const createMultipartUpload = async (
  s3: S3Client,
  params: CreateMultipartUploadParams,
  storageType?: StorageType
): Promise<CreateMultipartUploadResponse> => {
  const command = new CreateMultipartUploadCommand({
    Bucket: getStorageType(storageType),
    Key: params.key,
    ContentType: params.contentType,
    Metadata: params.metadata,
  });

  try {
    const { Key, UploadId } = await s3.send(command);
    return { key: Key, uploadId: UploadId };
  } catch (e) {
    console.error("Error creating multipart upload", e);
    throw new AppError(
      "Failed to create multipart upload",
      500,
      "S3_CREATE_MULTIPART_ERROR",
      e
    );
  }
};

/**
 * Gets a presigned URL for uploading a part
 * @param s3 - The S3 client instance
 * @param params - The parameters for getting the upload part URL
 * @returns The presigned URL and expiration time
 */
export const getUploadPartSignedUrl = async (
  s3: S3Client,
  params: UploadPartParams,
  storageType?: StorageType
): Promise<UploadPartResponse> => {
  const expires = 800;
  const command = new UploadPartCommand({
    Bucket: getStorageType(storageType),
    Key: params.key,
    UploadId: params.uploadId,
    PartNumber: params.partNumber,
    Body: "",
  });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: expires });
    return { url, expires };
  } catch (e) {
    console.error("Error getting signed URL for upload part", e);
    throw new AppError(
      "Failed to generate upload part presigned URL",
      500,
      "S3_UPLOAD_PART_PRESIGNED_URL_ERROR",
      e
    );
  }
};

/**
 * Lists all parts of a multipart upload
 * @param s3 - The S3 client instance
 * @param params - The parameters for listing parts
 * @returns Array of parts
 */
export const listParts = async (
  s3: S3Client,
  params: ListPartsParams,
  storageType?: StorageType
): Promise<Part[]> => {
  const p = [...(params.parts || [])];
  const command = new ListPartsCommand({
    Bucket: getStorageType(storageType),
    Key: params.key,
    UploadId: params.uploadId,
    PartNumberMarker: params.marker,
  });

  try {
    const { Parts, IsTruncated, NextPartNumberMarker } = await s3.send(command);

    if (Parts) {
      p.push(...Parts);
    }

    if (IsTruncated) {
      return await listParts(s3, {
        ...params,
        parts: p,
        marker: NextPartNumberMarker,
      });
    }
    return p;
  } catch (e) {
    console.error("Error listing upload parts", e);
    throw new AppError(
      "Failed to list upload parts",
      500,
      "S3_LIST_PARTS_ERROR",
      e
    );
  }
};

/**
 * Completes a multipart upload
 * @param s3 - The S3 client instance
 * @param params - The parameters for completing the upload
 * @returns The location of the completed upload
 */
export const completeMultipartUpload = async (
  s3: S3Client,
  params: CompleteMultipartUploadParams,
  storageType?: StorageType
): Promise<string> => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: getStorageType(storageType),
    Key: params.key,
    UploadId: params.uploadId,
    MultipartUpload: {
      Parts: params.parts,
    },
  });

  // command.middlewareStack.add(
  //   (next) => async (args) => {
  //     // Check if request is incoming as middleware works both ways
  //     const response = await next(args);
  //     if (!response.response.statusCode) return response;

  //     console.log("complete multipart upload response", response);

  //     // Get cid from headers
  //     const cid = response.response.headers["x-amz-meta-cid"];
  //     console.log(cid);
  //     return response;
  //   },
  //   {
  //     step: "build",
  //     name: "addCidToOutput",
  //   }
  // );

  try {
    const response = await s3.send(command);

    console.log(response);
    const { Location } = response;

    if (!Location) {
      throw new AppError(
        "No location returned from complete multipart upload",
        500,
        "S3_COMPLETE_MULTIPART_NO_LOCATION"
      );
    }
    return Location;
  } catch (e) {
    console.error("Error completing multipart upload", e);
    throw new AppError(
      "Failed to complete multipart upload",
      500,
      "S3_COMPLETE_MULTIPART_ERROR",
      e
    );
  }
};

/**
 * Aborts a multipart upload
 * @param s3 - The S3 client instance
 * @param params - The parameters for aborting the upload
 */
export const abortMultipartUpload = async (
  s3: S3Client,
  params: AbortMultipartUploadParams,
  storageType?: StorageType
): Promise<void> => {
  const command = new AbortMultipartUploadCommand({
    Bucket: getStorageType(storageType),
    Key: params.key,
    UploadId: params.uploadId,
  });

  try {
    await s3.send(command);
  } catch (e) {
    console.error("Error aborting multipart upload", e);
    throw new AppError(
      "Failed to abort multipart upload",
      500,
      "S3_ABORT_MULTIPART_ERROR",
      e
    );
  }
};

/**
 * Uploads an object to S3
 * @param s3 - The S3 client instance
 * @param params - The parameters for putting the object
 */
export const putObject = async (
  s3: S3Client,
  params: PutObjectParams,
  storageType?: StorageType
): Promise<void> => {
  const command = new PutObjectCommand({
    Bucket: getStorageType(storageType),
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
  });

  try {
    await s3.send(command);
  } catch (e) {
    console.error("Error putting object", e);
    throw new AppError(
      "Failed to upload object",
      500,
      "S3_PUT_OBJECT_ERROR",
      e
    );
  }
};

/**
 * Removes an object from S3
 * @param s3 - The S3 client instance
 * @param params - The parameters for removing the object
 */
export const removeObject = async (
  s3: S3Client,
  params: RemoveObjectParams,
  storageType?: StorageType
): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: getStorageType(storageType),
    Key: params.key,
  });

  try {
    await s3.send(command);
  } catch (e) {
    console.error("Error deleting object", e);
    throw new AppError(
      "Failed to delete object",
      500,
      "S3_DELETE_OBJECT_ERROR",
      e
    );
  }
};
