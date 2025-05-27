import { BucketType, Part } from "@aws-sdk/client-s3";

/**
 * Supported S3 storage types for operations
 */
export type StorageType = "storj" | "ipfs";

/**
 * S3 client credentials configuration
 */
export interface S3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
}

/**
 * S3 client credentials map
 */
export interface S3CredentialsMap {
  storj: S3Credentials;
  ipfs: S3Credentials;
}

/**
 * Response from splitting an S3 key into ID and filename
 */
export interface SplitKeyResult {
  id?: string;
  filename?: string;
}

/**
 * Parameters for creating a multipart upload
 */
export interface CreateMultipartUploadParams {
  key: string;
  contentType: string;
  metadata: Record<string, string>;
}

/**
 * Response from creating a multipart upload
 */
export interface CreateMultipartUploadResponse {
  key?: string;
  uploadId?: string;
}

/**
 * Parameters for getting a presigned URL for an upload part
 */
export interface UploadPartParams {
  key: string;
  uploadId: string;
  partNumber: number;
}

/**
 * Response containing a presigned URL for an upload part
 */
export interface UploadPartResponse {
  url: string;
  expires: number;
}

/**
 * Parameters for listing parts of a multipart upload
 */
export interface ListPartsParams {
  key: string;
  uploadId: string;
  parts?: Part[];
  marker?: string;
}

/**
 * Parameters for completing a multipart upload
 */
export interface CompleteMultipartUploadParams {
  key: string;
  uploadId: string;
  parts: Part[];
}

/**
 * Parameters for aborting a multipart upload
 */
export interface AbortMultipartUploadParams {
  key: string;
  uploadId: string;
}

/**
 * Parameters for putting an object
 */
export interface PutObjectParams {
  bucket: BucketType;
  key: string;
  body: string;
  contentType?: string;
}

/**
 * Parameters for removing an object
 */
export interface RemoveObjectParams {
  bucket: BucketType;
  key: string;
}
