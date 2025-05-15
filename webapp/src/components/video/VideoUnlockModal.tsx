import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LockClosedIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { VideoMetadata } from "@/types";

interface VideoUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoMetadata;
  onPurchase: () => Promise<void>;
}

type UnlockStep = "overview" | "purchase";

/**
 * VideoUnlockModal is a multi-step modal component that handles the video unlock flow.
 * It shows different unlock options and guides users through the purchase process.
 *
 * Features:
 * - Multi-step flow with smooth animations
 * - Overview of all available unlock options
 * - Purchase flow for protected videos
 * - Responsive design with backdrop blur
 *
 * @component
 * @example
 * ```tsx
 * <VideoUnlockModal
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   video={videoMetadata}
 *   onPurchase={handlePurchase}
 * />
 * ```
 */
export default function VideoUnlockModal({
  isOpen,
  onClose,
  video,
  onPurchase,
}: VideoUnlockModalProps) {
  const [currentStep, setCurrentStep] = useState<UnlockStep>("overview");
  const [isPurchasing, setIsPurchasing] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);
      await onPurchase();
      onClose();
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "overview":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <LockClosedIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                Unlock this video
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose how you'd like to unlock this video
              </p>
            </div>

            <div className="space-y-4">
              {video.visibility === "protected" &&
                Number(video.price.amount) > 0 && (
                  <button
                    onClick={() => setCurrentStep("purchase")}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Purchase Video
                        </p>
                        <p className="text-sm text-gray-500">
                          Buy this video for {Number(video.price.amount) / 1e6}{" "}
                          USDC
                        </p>
                      </div>
                      <div className="text-sm font-medium text-blue-600">→</div>
                    </div>
                  </button>
                )}

              {/* Add more unlock options here as they become available */}
            </div>
          </motion.div>
        );

      case "purchase":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Purchase Video
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Complete the purchase to unlock this video
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {video.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    Price: {Number(video.price.amount) / 1e6} USDC
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("overview")}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPurchasing ? "Processing..." : "Purchase"}
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}
