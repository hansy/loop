import { useReducer } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import type { VideoUnlockModalProps } from "../types";
import UnlockWizard from "./UnlockWizard";

type ModalState = {
  currentStep: "options" | "unlock";
};

type ModalAction =
  | { type: "SET_STEP"; payload: "options" | "unlock" }
  | { type: "RESET" };

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload };
    case "RESET":
      return { currentStep: "options" };
    default:
      return state;
  }
}

/**
 * VideoUnlockModal is a modal component that handles the video unlock flow.
 * It provides a user interface for unlocking videos through various methods.
 *
 * @component
 * @example
 * ```tsx
 * <VideoUnlockModal
 *   isOpen={isModalOpen}
 *   onClose={handleClose}
 *   metadata={videoMetadata}
 *   onUnlock={handleUnlock}
 * />
 * ```
 */
export default function VideoUnlockModal({
  isOpen,
  onClose,
  metadata,
  onUnlock,
}: VideoUnlockModalProps) {
  const [state, dispatch] = useReducer(modalReducer, {
    currentStep: "options",
  });

  const handleClose = () => {
    dispatch({ type: "RESET" });
    onClose();
  };

  const handleStepChange = (step: "options" | "unlock") => {
    dispatch({ type: "SET_STEP", payload: step });
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            {state.currentStep === "unlock" && (
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "SET_STEP", payload: "options" })
                }
                className="mr-2 rounded-full p-1 hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
              </button>
            )}
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {state.currentStep === "options"
                ? "Unlock Video"
                : "Complete Unlock"}
            </Dialog.Title>
            <button
              type="button"
              onClick={handleClose}
              className="ml-auto rounded-full p-1 hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="mt-4">
            <UnlockWizard
              metadata={metadata}
              onUnlock={onUnlock}
              onStepChange={handleStepChange}
              currentStep={state.currentStep}
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
