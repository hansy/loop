import { useEffect, useCallback, useRef, useState } from "react";
import Uppy, { UppyFile, Meta, Body } from "@uppy/core";
import type { UploadResultWithSignal } from "@uppy/aws-s3/lib/utils";
import { Dashboard } from "@uppy/react";
import AwsS3, { type AwsS3Part } from "@uppy/aws-s3";
import { apiPost, apiGet, apiDelete } from "@/services/client";
import { StorageType } from "@/services/server/external/s3/types";

// Import Uppy styles
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

interface Props {
  keyWithoutExtension: string;
  uploaderText: string;
  storageType: StorageType;
  onSuccess: (key: string, type: string) => void;
  onError?: (error: Error) => void;
  allowedFileTypes?: string[];
  maxFileSize?: number;
}

const sanitizeFilename = (filename: string): string => {
  return filename
    .normalize("NFKD") // Normalize unicode to remove special formatting (e.g., fancy AM/PM)
    .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9._-]/g, ""); // Remove anything that's not alphanumeric, dot, underscore, or dash
};

/**
 * FileUploader component that handles multipart uploads to S3 using Uppy
 *
 * Features:
 * - Drag and drop interface
 * - Progress tracking
 * - Automatic multipart upload handling
 * - Error handling
 * - File type validation
 * - Direct S3 uploads with presigned URLs
 *
 * @param keyWithoutExtension - The key without the extension.
 * @param uploaderText - Text to display in the uploader.
 * @param storageType - Storage type to use for the upload.
 * @param onSuccess - Optional callback when upload completes successfully
 * @param onError - Optional callback when upload fails
 * @param allowedFileTypes - Optional array of allowed file types.
 * @param maxFileSize - Optional maximum file size in bytes.
 */
export function FileUploader({
  keyWithoutExtension,
  uploaderText,
  storageType,
  onSuccess,
  onError,
  allowedFileTypes,
  maxFileSize,
}: Props) {
  // Use a ref to maintain the Uppy instance across renders
  const uppyRef = useRef<Uppy | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isUnmountingRef = useRef(false);

  // Handle file added event with useCallback to prevent recreation
  const handleFileAdded = useCallback(async () => {
    if (!uppyRef.current) return;

    try {
      const uploadResult = await uppyRef.current.upload();

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
  }, [onSuccess, onError]);

  // Initialize Uppy instance only once
  useEffect(() => {
    isUnmountingRef.current = false;

    // Only initialize if we haven't already
    if (!uppyRef.current) {
      const instance = new Uppy({
        debug: true,
        id: keyWithoutExtension,
        restrictions: {
          maxNumberOfFiles: 1,
          maxFileSize,
          allowedFileTypes,
        },
        autoProceed: false,
      }).use(AwsS3, {
        shouldUseMultipart: true,
        async createMultipartUpload(file: UppyFile<Meta, Body>) {
          const extension = file.extension;
          const key = `${keyWithoutExtension}.${extension}`;

          try {
            const result = await apiPost<{ key: string; uploadId: string }>(
              "/api/s3/multipart",
              {
                key,
                type: file.type,
                metadata: {
                  ...file.meta,
                  name: sanitizeFilename(file.meta?.name),
                },
                storageType,
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
            await apiDelete(
              `/api/s3/multipart/${uploadIdEnc}?key=${keyEnc}&storageType=${storageType}`
            );
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
            }>(
              `/api/s3/multipart/${uploadId}/${partNumber}?key=${keyEnc}&storageType=${storageType}`
            );

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
              `/api/s3/multipart/${uploadIdEnc}?key=${keyEnc}&storageType=${storageType}`
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
              `/api/s3/multipart/${uploadIdEnc}/complete?key=${keyEnc}&storageType=${storageType}`,
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
      setIsInitialized(true);
    }

    // Only cleanup on actual unmount, not on re-renders
    return () => {
      isUnmountingRef.current = true;
      // Only destroy if we're actually unmounting the component
      if (uppyRef.current && isUnmountingRef.current) {
        uppyRef.current.destroy();
        uppyRef.current = null;
        setIsInitialized(false);
      }
    };
  }, []); // Empty dependency array since we only want to initialize once

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
            dropPasteFiles: uploaderText + " or %{browseFiles}",
            browseFiles: "browse",
          },
        }}
      />
    </div>
  );
}
