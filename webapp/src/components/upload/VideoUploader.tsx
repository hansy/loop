import { useEffect, useCallback, useRef } from "react";
import Uppy, { UppyFile, Meta, Body } from "@uppy/core";
import type { UploadResultWithSignal } from "@uppy/aws-s3/lib/utils";
import { Dashboard } from "@uppy/react";
import AwsS3, { type AwsS3Part } from "@uppy/aws-s3";
import { apiPost, apiGet, apiDelete } from "@/services/client";

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
  console.log("[VideoUploader] Rendering with videoId:", videoId);

  // Use a ref to maintain the Uppy instance across renders
  const uppyRef = useRef<Uppy | null>(null);

  // Initialize Uppy instance only once
  useEffect(() => {
    if (!uppyRef.current) {
      console.log(
        "[VideoUploader] Creating new Uppy instance for videoId:",
        videoId
      );
      const instance = new Uppy({
        restrictions: {
          maxNumberOfFiles: 1,
          maxFileSize: 30 * 1024 * 1024 * 1024, // 30GB
          allowedFileTypes: ["video/*"],
        },
        autoProceed: false,
        debug: true, // Enable Uppy debug mode
      }).use(AwsS3, {
        shouldUseMultipart: true,
        async createMultipartUpload(file: UppyFile<Meta, Body>) {
          console.log(
            "[VideoUploader] Creating multipart upload for file:",
            file.name
          );
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
            console.log("[VideoUploader] Multipart upload created:", result);
            return result;
          } catch (error) {
            console.error(
              "[VideoUploader] Error creating multipart upload:",
              error
            );
            return Promise.reject("Error creating multipart upload");
          }
        },

        async abortMultipartUpload(
          _file: UppyFile<Meta, Body>,
          options: UploadResultWithSignal
        ) {
          console.log("[VideoUploader] Aborting multipart upload:", options);
          const keyEnc = encodeURIComponent(options.key);
          const uploadIdEnc = encodeURIComponent(options.uploadId ?? "");

          try {
            await apiDelete(`/api/s3/multipart/${uploadIdEnc}?key=${keyEnc}`);
          } catch (error) {
            console.error(
              "[VideoUploader] Error aborting multipart upload:",
              error
            );
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
          console.log("[VideoUploader] Signing part:", {
            uploadId,
            key,
            partNumber,
          });
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
            console.log("[VideoUploader] Part signed successfully:", result);
            return result;
          } catch (error) {
            console.error("[VideoUploader] Error signing part:", error);
            return Promise.reject("Error signing part");
          }
        },

        async listParts(
          _file: UppyFile<Meta, Body>,
          options: UploadResultWithSignal
        ) {
          console.log("[VideoUploader] Listing parts:", options);
          const keyEnc = encodeURIComponent(options.key);
          const uploadIdEnc = encodeURIComponent(options.uploadId ?? "");

          try {
            const result = await apiGet<AwsS3Part[]>(
              `/api/s3/multipart/${uploadIdEnc}?key=${keyEnc}`
            );
            console.log("[VideoUploader] Parts listed:", result);
            return result;
          } catch (error) {
            console.error("[VideoUploader] Error listing parts:", error);
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
          console.log("[VideoUploader] Completing multipart upload:", {
            key,
            uploadId,
            parts,
          });
          const keyEnc = encodeURIComponent(key);
          const uploadIdEnc = encodeURIComponent(uploadId);

          try {
            const result = await apiPost<{ location?: string }>(
              `/api/s3/multipart/${uploadIdEnc}/complete?key=${keyEnc}`,
              { parts }
            );
            console.log("[VideoUploader] Multipart upload completed:", result);
            return result;
          } catch (error) {
            console.error(
              "[VideoUploader] Error completing multipart upload:",
              error
            );
            return Promise.reject("Error completing multipart upload");
          }
        },
      });

      // Add event listeners for debugging
      instance.on("upload", (data) => {
        console.log("[VideoUploader] Upload started:", data);
      });

      instance.on("upload-success", (file, response) => {
        console.log("[VideoUploader] Upload success:", { file, response });
      });

      instance.on("upload-error", (file, error) => {
        console.error("[VideoUploader] Upload error:", { file, error });
      });

      instance.on("complete", (result) => {
        console.log("[VideoUploader] Upload complete:", result);
      });

      uppyRef.current = instance;
    }

    // Cleanup function
    return () => {
      if (uppyRef.current) {
        console.log("[VideoUploader] Cleaning up Uppy instance");
        uppyRef.current.destroy();
        uppyRef.current = null;
      }
    };
  }, [videoId]); // Only recreate when videoId changes

  // Handle file added event with useCallback to prevent recreation
  const handleFileAdded = useCallback(async () => {
    if (!uppyRef.current) return;

    console.log("[VideoUploader] File added, starting upload");
    try {
      const uploadResult = await uppyRef.current.upload();
      console.log("[VideoUploader] Upload result:", uploadResult);

      if (uploadResult?.successful?.[0]) {
        const uploadedFile = uploadResult.successful[0];
        // @ts-expect-error - Uppy file is not typed correctly
        const key = uploadedFile.s3Multipart?.key;
        const type = uploadedFile.type;

        console.log(
          "[VideoUploader] Upload successful, calling onSuccess with:",
          { key, type }
        );
        if (key && type) {
          onSuccess(key, type);
        }
      }
    } catch (e) {
      console.error("[VideoUploader] Upload error:", e);
      onError?.(e instanceof Error ? e : new Error(String(e)));
    }
  }, [onSuccess, onError]);

  // Set up event listeners
  useEffect(() => {
    if (!uppyRef.current) return;

    console.log("[VideoUploader] Setting up event listeners");
    uppyRef.current.on("file-added", handleFileAdded);

    // Cleanup function
    return () => {
      if (uppyRef.current) {
        console.log("[VideoUploader] Cleaning up event listeners");
        uppyRef.current.off("file-added", handleFileAdded);
      }
    };
  }, [handleFileAdded]);

  if (!uppyRef.current) {
    return null; // Don't render until Uppy is initialized
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Dashboard
        uppy={uppyRef.current}
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
