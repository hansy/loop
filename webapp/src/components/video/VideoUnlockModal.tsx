import { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { XMarkIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { VideoMetadata } from "@/types";
import UnlockWizard from "./UnlockWizard";
import type { AccessControlState } from "@/features/accessControl/types";

interface VideoUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: VideoMetadata;
  accessControl: AccessControlState;
  onUnlock: (type: "token" | "payment") => Promise<void>;
}

/**
 * VideoUnlockModal is a modal component that handles the video unlock flow.
 * It provides a back button for navigation and contains the UnlockWizard for the actual flow.
 *
 * @component
 * @example
 * ```tsx
 * <VideoUnlockModal
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   video={videoMetadata}
 *   accessControl={accessControlState}
 *   onUnlock={handleUnlock}
 * />
 * ```
 */
export default function VideoUnlockModal({
  isOpen,
  onClose,
  metadata,
  accessControl,
  onUnlock,
}: VideoUnlockModalProps) {
  const [currentStep, setCurrentStep] = useState<"options" | "unlock">(
    "options"
  );

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Back Button */}
            {currentStep === "unlock" && (
              <button
                onClick={() => setCurrentStep("options")}
                className="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="mr-1 h-4 w-4" />
                Back
              </button>
            )}

            {/* Wizard */}
            <div className="mt-6">
              <UnlockWizard
                metadata={metadata}
                accessControl={accessControl}
                onUnlock={onUnlock}
                onStepChange={(step) => setCurrentStep(step)}
                currentStep={currentStep}
              />
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
