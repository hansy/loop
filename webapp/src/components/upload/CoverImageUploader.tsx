import { useEffect, useCallback, useRef, useState } from "react";
import Uppy, { UppyFile, Meta, Body } from "@uppy/core";
import type { UploadResultWithSignal } from "@uppy/aws-s3/lib/utils";
import { Dashboard } from "@uppy/react";
import AwsS3, { type AwsS3Part } from "@uppy/aws-s3";
import { apiPost, apiGet, apiDelete } from "@/services/client";

// Import Uppy styles
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

interface CoverImageUploaderUppyProps {
  videoId: string;
  onSuccess: (key: string, type: string) => void;
  onError?: (error: Error) => void;
}

/**
 * CoverImageUploaderUppy component that handles image uploads to S3 using Uppy
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
export function CoverImageUploader({
  videoId,
  onSuccess,
  onError,
}: CoverImageUploaderUppyProps) {
  // Use a ref to maintain the Uppy instance across renders
  const uppyRef = useRef<Uppy | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle file added event with useCallback to prevent recreation
  const handleFileAdded = useCallback(async () => {
    if (!uppyRef.current) return;

    try {
      const uploadResult = await uppyRef.current.upload();

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
  }, [onSuccess, onError]);

  // Initialize Uppy instance only once
  useEffect(() => {
    let isMounted = true;

    const initializeUppy = () => {
      if (!uppyRef.current) {
        const instance = new Uppy({
          restrictions: {
            maxNumberOfFiles: 1,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedFileTypes: ["image/*"],
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
                  key: `${videoId}/cover.${extension}`,
                  type: file.type,
                  metadata: file.meta,
                }
              );
              return result;
            } catch (error) {
              return Promise.reject(error);
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

        instance.on("file-added", handleFileAdded);

        uppyRef.current = instance;
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeUppy();

    // Cleanup function
    return () => {
      isMounted = false;
      if (uppyRef.current) {
        uppyRef.current.destroy();
        uppyRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [videoId, handleFileAdded]); // Only recreate when videoId changes

  if (!isInitialized) {
    return (
      <div className="w-full max-w-3xl mx-auto h-[200px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-gray-500">Initializing uploader...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Dashboard
        uppy={uppyRef.current!}
        hideUploadButton={true}
        doneButtonHandler={undefined}
        proudlyDisplayPoweredByUppy={false}
        height={200}
        width={0}
        locale={{
          // @ts-expect-error - Uppy locale is not typed correctly
          strings: {
            dropPasteFiles: "Drop cover image here or %{browseFiles}",
            browseFiles: "browse",
          },
        }}
      />
    </div>
  );
}
