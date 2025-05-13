import { useEffect, useMemo } from "react";
import Uppy, { UppyFile, Meta, Body } from "@uppy/core";
import type { UploadResultWithSignal } from "@uppy/aws-s3/lib/utils";
import { Dashboard } from "@uppy/react";
import AwsS3, { type AwsS3Part } from "@uppy/aws-s3";
import { apiPost, apiGet, apiDelete } from "@/lib/client/apiClient";

// Import Uppy styles
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

interface VideoUploaderProps {
  videoId: string;
  onSuccess: (key: string, type: string) => void;
  onError?: (error: Error) => void;
}

/**
 * VideoUploader component that handles multipart uploads to S3 using Uppy
 *
 * Features:
 * - Drag and drop interface
 * - Progress tracking
 * - Automatic multipart upload handling
 * - Error handling
 * - File type validation
 * - Direct S3 uploads with presigned URLs
 *
 * @param videoId - Required UUID for the video. Used in S3 key generation and metadata.
 * @param onSuccess - Optional callback when upload completes successfully
 * @param onError - Optional callback when upload fails
 */
export function VideoUploader({
  videoId,
  onSuccess,
  onError,
}: VideoUploaderProps) {
  const uppy = useMemo(() => {
    const instance = new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        maxFileSize: 30 * 1024 * 1024 * 1024, // 30GB
        allowedFileTypes: ["video/*"],
      },
      autoProceed: false,
    }).use(AwsS3, {
      shouldUseMultipart: true,
      async createMultipartUpload(file: UppyFile<Meta, Body>) {
        const extension = file.extension;

        try {
          const result = await apiPost<{ key: string; uploadId: string }>(
            "/api/s3/multipart",
            {
              key: `${videoId}/video.${extension}`,
              type: file.type,
              metadata: file.meta,
            }
          );

          return result;
        } catch {
          return Promise.reject("Error creating multipart upload");
        }
      },

      async abortMultipartUpload(
        _file: UppyFile<Meta, Body>,
        options: UploadResultWithSignal
      ) {
        const keyEnc = encodeURIComponent(options.key);
        const uploadIdEnc = encodeURIComponent(options.uploadId ?? "");

        try {
          await apiDelete(`/api/s3/multipart/${uploadIdEnc}?key=${keyEnc}`);
        } catch {
          return Promise.reject("Error aborting multipart upload");
        }
      },

      async signPart(
        _file: UppyFile<Meta, Body>,
        {
          uploadId,
          key,
          partNumber,
          signal,
        }: {
          uploadId: string;
          key: string;
          partNumber: number;
          signal?: AbortSignal;
        }
      ) {
        if (signal?.aborted) {
          const err = new DOMException(
            "The operation was aborted",
            "AbortError"
          );
          throw err;
        }

        if (uploadId == null || key == null || partNumber == null) {
          throw new Error(
            "Cannot sign without a key, an uploadId, and a partNumber"
          );
        }

        const keyEnc = encodeURIComponent(key);

        try {
          const result = await apiGet<{
            url: string;
            expires: number;
          }>(`/api/s3/multipart/${uploadId}/${partNumber}?key=${keyEnc}`);

          return result;
        } catch {
          return Promise.reject("Error signing part");
        }
      },

      async listParts(
        _file: UppyFile<Meta, Body>,
        options: UploadResultWithSignal
      ) {
        const keyEnc = encodeURIComponent(options.key);
        const uploadIdEnc = encodeURIComponent(options.uploadId ?? "");

        try {
          const result = await apiGet<AwsS3Part[]>(
            `/api/s3/multipart/${uploadIdEnc}?key=${keyEnc}`
          );

          return result;
        } catch {
          return Promise.reject("Error listing parts");
        }
      },

      async completeMultipartUpload(
        _file: UppyFile<Meta, Body>,
        {
          key,
          uploadId,
          parts,
        }: {
          key: string;
          uploadId: string;
          parts: AwsS3Part[];
        }
      ) {
        const keyEnc = encodeURIComponent(key);
        const uploadIdEnc = encodeURIComponent(uploadId);

        try {
          const result = await apiPost<{ location?: string }>(
            `/api/s3/multipart/${uploadIdEnc}/complete?key=${keyEnc}`,
            { parts }
          );

          return result;
        } catch {
          return Promise.reject("Error completing multipart upload");
        }
      },
    });

    // Handle file added event
    instance.on("file-added", async () => {
      try {
        const uploadResult = await instance.upload();

        console.log("uploadResult", uploadResult);

        if (uploadResult?.successful?.[0]) {
          const uploadedFile = uploadResult.successful[0];
          // @ts-expect-error - Uppy file is not typed correctly
          const key = uploadedFile.s3Multipart?.key;
          const type = uploadedFile.type;

          if (key && type) {
            onSuccess(key, type);
          }
        }
      } catch (e) {
        onError?.(e instanceof Error ? e : new Error(String(e)));
      }
    });

    return instance;
  }, [videoId, onSuccess, onError]);

  useEffect(() => {
    return () => {
      uppy.cancelAll();
    };
  }, [uppy]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Dashboard
        uppy={uppy}
        hideUploadButton={true}
        doneButtonHandler={undefined}
        proudlyDisplayPoweredByUppy={false}
        height={200}
        width={0}
        locale={{
          // @ts-expect-error - Uppy locale is not typed correctly
          strings: {
            dropPasteFiles: "Drop video here or %{browseFiles}",
            browseFiles: "browse",
          },
        }}
      />
    </div>
  );
}
