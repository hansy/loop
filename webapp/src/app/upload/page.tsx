"use client";

import React, { useState } from "react";
import Container from "@/components/layout/Container";
import { useRouter } from "next/navigation";
import VideoUploader from "@/components/upload/VideoUploader";
import CoverImageUploader from "@/components/upload/CoverImageUploader";
import VideoDetails from "@/components/upload/VideoDetails";
import PrivacySettings, {
  PrivacySetting,
} from "@/components/upload/PrivacySettings";
import PaywallSettings from "@/components/upload/PaywallSettings";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AccessControlBuilder } from "@/features/accessControl/components";
import { AccessControlProvider } from "@/contexts/AccessControlContext";
import { useAccessControl } from "@/contexts/AccessControlContext";
import {
  createVideoFormSchema,
  validateAndFormatVideoMetadata,
} from "@/lib/validation/videoSchema";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { ZodError } from "zod";

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
      "Only people who meet certain requirements can view your video, e.g. on allowlist, has purchased video, etc.",
  },
];

export default function UploadPage() {
  const router = useRouter();
  const {
    isLoading: authLoading,
    isAuthenticated,
    LoadingComponent,
  } = useRequireAuth();
  const { address } = useAccount();
  const { state: accessControlState } = useAccessControl();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPrivacy, setSelectedPrivacy] = useState("public");
  const [isPaywalled, setIsPaywalled] = useState(false);
  const [price, setPrice] = useState(0.01);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (authLoading && LoadingComponent) {
    return <LoadingComponent />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
  };

  const handleCoverImageSelect = (file: File) => {
    setCoverImage(file);
  };

  const handleFrameSelect = () => {
    // TODO: Implement frame selection from video
    console.log("Frame selection not implemented yet");
  };

  const handlePrivacyChange = (setting: PrivacySetting) => {
    setSelectedPrivacy(setting.id);
    // Reset paywall if switching to public
    if (setting.id === "public") {
      setIsPaywalled(false);
      setPrice(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
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

      // TODO: Send to API
      console.log("Submitting video metadata:", videoMetadata);

      // Show success message
      toast.success("Video metadata submitted successfully");

      // Redirect to video page or dashboard
      router.push("/dashboard");
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

  const isFormValid = videoFile && title.trim() !== "";

  return (
    <AccessControlProvider>
      <form className="min-h-screen bg-gray-50" onSubmit={handleSubmit}>
        <Container>
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-8">
              Upload Video
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
              {/* Left Column - Video Upload and Cover Image */}
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
                <VideoUploader onFileSelect={handleVideoSelect} />
                <CoverImageUploader
                  onFileSelect={handleCoverImageSelect}
                  onFrameSelect={handleFrameSelect}
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

                  {selectedPrivacy === "protected" && (
                    <>
                      <div className="mt-8">
                        <h3 className="text-base/7 font-semibold text-gray-900">
                          Paywall
                        </h3>
                        <p className="mt-1 text-sm/6 text-gray-600">
                          Set up a paywall for your video.
                        </p>
                        <div className="mt-6">
                          <PaywallSettings
                            isPaywalled={isPaywalled}
                            price={price}
                            onPaywallChange={setIsPaywalled}
                            onPriceChange={setPrice}
                          />
                        </div>
                      </div>

                      <div className="mt-8">
                        <h3 className="text-base/7 font-semibold text-gray-900">
                          Additional Access Controls
                        </h3>
                        <p className="mt-1 text-sm/6 text-gray-600">
                          Set up additional access controls for your video
                        </p>
                        <div className="mt-6">
                          <AccessControlBuilder />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>

        {/* Persistent bottom bar */}
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
    </AccessControlProvider>
  );
}
