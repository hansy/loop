"use client";

import React, { useState } from "react";
import Container from "@/components/layout/Container";
import { useRouter } from "next/navigation";
import { VideoUploader } from "@/components/upload/VideoUploader";
import CoverImageUploader from "@/components/upload/CoverImageUploader";
import VideoDetails from "@/components/upload/VideoDetails";
import PrivacySettings, {
  PrivacySetting,
} from "@/components/upload/PrivacySettings";
import PaywallSettings from "@/components/upload/PaywallSettings";
import { AccessControlBuilder } from "@/features/accessControl/components";
import { useAccessControl } from "@/contexts/AccessControlContext";
import {
  createVideoFormSchema,
  validateAndFormatVideoMetadata,
} from "@/lib/validation/videoSchema";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { ZodError } from "zod";
import { v7 as uuidv7 } from "uuid";

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
  const { address } = useAccount();
  const { state: accessControlState } = useAccessControl();
  const [videoId] = useState(() => uuidv7()); // Generate ID once when component mounts
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPrivacy, setSelectedPrivacy] = useState("public");
  const [isPaywalled, setIsPaywalled] = useState(false);
  const [price, setPrice] = useState(0.01);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePrivacyChange = (setting: PrivacySetting) => {
    setSelectedPrivacy(setting.id);
    // Reset paywall if switching to public
    if (setting.id === "public") {
      setIsPaywalled(false);
      setPrice(0);
    }
  };

  const handleVideoUploadSuccess = (key: string, type: string) => {
    setVideoKey(key);
    setVideoType(type);
    toast.success("Video uploaded successfully");
  };

  const handleVideoUploadError = (error: Error) => {
    toast.error("Failed to upload video: " + error.message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      if (!videoKey || !videoType) {
        throw new Error("Please upload a video first");
      }

      // Validate form data
      const formData = {
        title,
        description,
        visibility: selectedPrivacy as "public" | "protected",
        isPaywalled,
        price,
        accessControlConditions:
          selectedPrivacy === "protected" ? accessControlState : undefined,
      };

      // Validate using our schema
      const validatedData = createVideoFormSchema.parse(formData);

      // Format the data for the API
      const videoMetadata = validateAndFormatVideoMetadata(
        validatedData,
        address!
      );

      // Add the video source
      const metadataWithSource = {
        ...videoMetadata,
        sources: [
          {
            id: videoId,
            src: videoKey,
            type: videoType,
          },
        ],
      };

      // TODO: Send to API
      console.log("Submitting video metadata:", metadataWithSource);

      // Show success message
      toast.success("Video metadata submitted successfully");

      // Redirect to video page or library
      // router.push("/library");
    } catch (error) {
      if (error instanceof Error) {
        // Handle validation errors
        if (error instanceof ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            fieldErrors[err.path[0]] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          // Handle other errors
          toast.error("Failed to submit video metadata");
          console.error("Error submitting video:", error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = videoKey && videoType && title;

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
                videoId={videoId}
                onSuccess={handleVideoUploadSuccess}
                onError={handleVideoUploadError}
              />
              <CoverImageUploader
                onFileSelect={() => {}} // TODO: Implement cover image upload
                onFrameSelect={() => {}} // TODO: Implement frame selection
              />
            </div>

            {/* Right Column - Metadata and Privacy Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
              <VideoDetails
                title={title}
                description={description}
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
                    selectedSettingId={selectedPrivacy}
                    onChange={handlePrivacyChange}
                  />
                </div>
              </div>

              {selectedPrivacy === "protected" && (
                <div>
                  <h2 className="text-base/7 font-semibold text-gray-900">
                    Access Control
                  </h2>
                  <p className="mt-1 text-sm/6 text-gray-600">
                    Define who can access your video.
                  </p>
                  <div className="mt-6">
                    <AccessControlBuilder />
                  </div>
                </div>
              )}

              <PaywallSettings
                isPaywalled={isPaywalled}
                price={price}
                onPaywallChange={setIsPaywalled}
                onPriceChange={setPrice}
                disabled={selectedPrivacy === "public"}
              />
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
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Upload Video"}
            </button>
          </div>
        </Container>
      </div>
    </form>
  );
}
