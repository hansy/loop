# S3 Utilities

This module provides a set of utilities for interacting with AWS S3, specifically designed for handling video uploads and metadata storage in our application.

## Architecture

The module is organized into two main files:

- `types.ts`: Contains all TypeScript interfaces and types
- `index.ts`: Contains the implementation of S3 operations

### Supported Operations

1. **Basic Object Operations**

   - `putObject`: Upload a single object to S3
   - `removeObject`: Delete an object from S3
   - `getPresignedUrl`: Generate a presigned URL for direct upload
   - `getObjectPresigned`: Generate a presigned URL for object retrieval

2. **Multipart Upload Operations**

   - `createMultipartUpload`: Initialize a multipart upload
   - `getUploadPartSignedUrl`: Get a presigned URL for uploading a part
   - `listParts`: List all parts of a multipart upload
   - `completeMultipartUpload`: Complete a multipart upload
   - `abortMultipartUpload`: Abort an in-progress multipart upload

3. **Utility Functions**
   - `initializeS3Client`: Create an S3 client with specified credentials
   - `splitKey`: Parse an S3 key into ID and filename components
   - `validatePartNumber`: Validate part numbers for multipart uploads
   - `isValidPart`: Validate part objects for multipart uploads

## Usage

### Basic Object Upload

```typescript
import { initializeS3Client, putObject } from "@/lib/common/utils/s3";

const s3 = initializeS3Client("uploadVideo");
await putObject(s3, {
  bucket: "video",
  key: "user123/video.mp4",
  body: "video content",
  contentType: "video/mp4",
});
```

### Multipart Upload

```typescript
import {
  initializeS3Client,
  createMultipartUpload,
  getUploadPartSignedUrl,
  completeMultipartUpload,
} from "@/lib/common/utils/s3";

// 1. Initialize upload
const s3 = initializeS3Client("uploadVideo");
const { key, uploadId } = await createMultipartUpload(s3, {
  key: "user123/video.mp4",
  contentType: "video/mp4",
  metadata: { userId: "user123" },
});

// 2. Get presigned URL for each part
const partNumber = 1;
const { url, expires } = await getUploadPartSignedUrl(s3, {
  key,
  uploadId,
  partNumber,
});

// 3. Upload part using the presigned URL
// ... (client-side upload using the URL)

// 4. Complete the upload
const location = await completeMultipartUpload(s3, {
  key,
  uploadId,
  parts: [{ PartNumber: partNumber, ETag: "etag" }],
});
```

## Error Handling

All operations use the application's standard error handling through `AppError`. Each operation has a specific error code for better error tracking:

- `S3_PRESIGNED_URL_ERROR`: Failed to generate presigned URL
- `S3_OBJECT_PRESIGNED_URL_ERROR`: Failed to generate object presigned URL
- `S3_CREATE_MULTIPART_ERROR`: Failed to create multipart upload
- `S3_UPLOAD_PART_PRESIGNED_URL_ERROR`: Failed to generate upload part presigned URL
- `S3_LIST_PARTS_ERROR`: Failed to list upload parts
- `S3_COMPLETE_MULTIPART_ERROR`: Failed to complete multipart upload
- `S3_ABORT_MULTIPART_ERROR`: Failed to abort multipart upload
- `S3_PUT_OBJECT_ERROR`: Failed to upload object
- `S3_DELETE_OBJECT_ERROR`: Failed to delete object

## Configuration

The module requires the following environment variables:

```env
# Video Upload Bucket
NEXT_PUBLIC_S3_VIDEO_UPLOAD_BUCKET=
S3_VIDEO_UPLOAD_ACCESS_KEY=
S3_VIDEO_UPLOAD_SECRET_KEY=
S3_VIDEO_UPLOAD_ENDPOINT=

# IPFS Bucket
S3_METADATA_BUCKET=
S3_IPFS_ACCESS_KEY=
S3_IPFS_SECRET_KEY=
S3_IPFS_ENDPOINT=
```

## Best Practices

1. **Error Handling**

   - Always wrap S3 operations in try-catch blocks
   - Use the provided error codes for better error tracking
   - Log errors with appropriate context

2. **Multipart Uploads**

   - Use multipart uploads for files larger than 5MB
   - Validate part numbers before use
   - Always clean up incomplete uploads using `abortMultipartUpload`

3. **Security**

   - Never expose S3 credentials to the client
   - Use presigned URLs for direct uploads
   - Validate all input parameters before use

4. **Performance**
   - Use appropriate part sizes for multipart uploads (5MB minimum)
   - Consider using parallel part uploads for large files
   - Cache S3 client instances when possible

## Contributing

When adding new functionality:

1. Add appropriate types in `types.ts`
2. Add JSDoc comments for all new functions
3. Include error handling using `AppError`
4. Add appropriate error codes
5. Update this README with new functionality
