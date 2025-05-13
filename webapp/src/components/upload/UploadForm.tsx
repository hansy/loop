"use client";

import React, { useState, useCallback } from "react";
import Container from "@/components/layout/Container";
import { useRouter } from "next/navigation";
import { VideoUploader } from "@/components/upload/VideoUploader";
// import CoverImageUploader from "@/components/upload/CoverImageUploader";
import VideoDetails from "@/components/upload/VideoDetails";
import PrivacySettings, {
  PrivacySetting,
} from "@/components/upload/PrivacySettings";
import PaywallSettings from "@/components/upload/PaywallSettings";
import { AccessControlBuilder } from "@/features/accessControl/components";
import { useVideoMetadata } from "@/hooks/useVideoMetadata";
import { toast } from "react-toastify";
import { ZodError } from "zod";
import { uploadVideo } from "@/services/client/videoApi";

const privacySettings: PrivacySetting[] = [
  {
    id: "public",
    name: "Public",
    description: "Anyone can watch your video. No special access required.",
  },
  {
    id: "protected",
    name: "Protected",
    description:
      "Only people who meet certain requirements can view your video (e.g. people who have purchased the video, hold a specific token, etc.).",
  },
];

export default function UploadForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    metadata,
    errors,
    formCanSubmit,
    setTitle,
    setDescription,
    setPrice,
    setVideoKey,
    setVideoType,
    setErrors,
    validateAndFormatMetadata,
    setVisibility,
  } = useVideoMetadata();

  const handlePrivacyChange = (setting: PrivacySetting) => {
    setVisibility(setting.id);
  };

  const handleVideoUploadSuccess = useCallback(
    (key: string, type: string) => {
      setVideoKey(key);
      setVideoType(type);
    },
    [setVideoKey, setVideoType]
  );

  const handleVideoUploadError = useCallback((error: Error) => {
    toast.error("Failed to upload video: " + error.message);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const data = await validateAndFormatMetadata();

      await uploadVideo(data);

      toast.success("Video uploaded successfully");
      router.push("/library");
    } catch (error) {
      console.error("[UploadForm] Form submission error:", error);
      if (error instanceof Error) {
        // Handle validation errors
        if (error instanceof ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0]] = err.message;
            }
          });
          toast.error(error.message);
          console.log("[UploadForm] Validation errors:", fieldErrors);
          setErrors(fieldErrors);
        } else {
          // Handle other errors
          toast.error("Failed to upload video");
          console.error("Error submitting video:", error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="min-h-screen bg-gray-50" onSubmit={handleSubmit}>
      <Container>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">
            Upload Video
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
            {/* Left Column - Video Upload and Cover Image */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
              <VideoUploader
                videoId={metadata.id}
                onSuccess={handleVideoUploadSuccess}
                onError={handleVideoUploadError}
              />
              {/* <CoverImageUploader
                onFileSelect={(url) => {
                  setCoverImage(url);
                }}
                onFrameSelect={(url) => {
                  setCoverImage(url);
                }}
              /> */}
            </div>

            {/* Right Column - Metadata and Privacy Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
              <VideoDetails
                title={metadata.title}
                description={metadata.description}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                error={errors.title}
              />

              <div>
                <h2 className="text-base/7 font-semibold text-gray-900">
                  Privacy Settings
                </h2>
                <p className="mt-1 text-sm/6 text-gray-600">
                  Choose who can view your video.
                </p>
                <div className="mt-6">
                  <PrivacySettings
                    settings={privacySettings}
                    selectedSettingId={metadata.visibility}
                    onChange={handlePrivacyChange}
                  />
                </div>
              </div>

              {metadata.visibility === "protected" && (
                <div>
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Paywall
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Set a price for your video.
                  </p>
                  <div className="my-4">
                    <PaywallSettings
                      price={
                        metadata.price?.amount
                          ? Number(metadata.price.amount) / 1e6
                          : 0
                      }
                      onPriceChange={setPrice}
                    />
                  </div>
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Advanced Access Control
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Add additional access rules to your video.
                  </p>
                  <div className="mt-6">
                    <AccessControlBuilder />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <Container>
          <div className="max-w-7xl mx-auto py-4 flex items-center justify-end gap-x-6">
            <button
              type="button"
              className="text-sm/6 font-semibold text-gray-900"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!formCanSubmit || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Upload Video"}
            </button>
          </div>
        </Container>
      </div>
    </form>
  );
}
