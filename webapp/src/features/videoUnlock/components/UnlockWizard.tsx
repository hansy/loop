import { useReducer, useState, forwardRef, useImperativeHandle } from "react";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { truncateString } from "@/utils/truncateString";
import { formatMoney, USDCWeiToUSD } from "@/utils/currency";
import type {
  UnlockWizardProps,
  UnlockOption,
  PurchaseStatus as PurchaseStatusType,
} from "../types";
import { unlockReducer, extractUnlockOptions, initialState } from "../reducer";
import { deriveAccessControl } from "../utils/accessControl";
import PurchaseStatus from "./PurchaseStatus";

export interface UnlockWizardRef {
  resetState: () => void;
}

/**
 * UnlockWizard is a component that handles the multi-step unlock flow for videos.
 * It displays available unlock options and guides users through the unlock process.
 *
 * @component
 * @example
 * ```tsx
 * <UnlockWizard
 *   metadata={videoMetadata}
 *   handlers={{
 *     onUnlockInitiated: (option) => console.log('Unlock started:', option),
 *     onUnlockSuccess: (option) => console.log('Unlock successful:', option),
 *     onUnlockError: (option, error) => console.error('Unlock failed:', error),
 *   }}
 *   onStepChange={handleStepChange}
 *   currentStep={currentStep}
 * />
 * ```
 */
const UnlockWizard = forwardRef<UnlockWizardRef, UnlockWizardProps>(
  (
    { metadata, handlers, onStepChange, currentStep, hasEmbeddedWallet },
    ref
  ) => {
    const [state, dispatch] = useReducer(unlockReducer, initialState);
    const { selectedOption, isProcessing } = state;
    const [purchaseStatus, setPurchaseStatus] =
      useState<PurchaseStatusType>("idle");

    useImperativeHandle(ref, () => ({
      resetState: () => {
        dispatch({ type: "RESET_OPTION" });
        setPurchaseStatus("idle");
      },
    }));

    // Extract unlock options from access control and video metadata
    const accessControl = deriveAccessControl(metadata);
    const unlockOptions = extractUnlockOptions(accessControl, metadata);

    const handleOptionSelect = (option: UnlockOption) => {
      dispatch({ type: "SELECT_OPTION", payload: option });
      onStepChange("unlock");
    };

    const handleUnlock = async () => {
      if (!selectedOption) return;

      try {
        // Step 1: Validation
        setPurchaseStatus("validating");
        const confirmMessage = hasEmbeddedWallet
          ? "Are you sure you want to purchase this video?"
          : "Are you sure you want to purchase this video? You will be prompted to sign three transactions (signature, permit, purchase) to complete the order.";

        const confirmed = window.confirm(confirmMessage);

        if (!confirmed) {
          setPurchaseStatus("idle");
          return;
        }

        // Step 2: Purchase
        setPurchaseStatus("purchasing");
        dispatch({ type: "SET_PROCESSING", payload: true });
        handlers.onUnlockInitiated(selectedOption);

        // TODO: Implement actual purchase logic
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay

        setPurchaseStatus("success");
        handlers.onUnlockSuccess(selectedOption);
      } catch (error) {
        console.error("Unlock failed:", error);
        setPurchaseStatus("error");
        handlers.onUnlockError(selectedOption, error as Error);
      } finally {
        dispatch({ type: "SET_PROCESSING", payload: false });
      }
    };

    const renderOptionsStep = () => (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <LockClosedIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            Unlock this video
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose how you&apos;d like to unlock this video
          </p>
        </div>

        <div className="space-y-4">
          {unlockOptions.map((option) => (
            <button
              type="button"
              key={option.id}
              onClick={() => handleOptionSelect(option)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {option.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {option.description}
                    {option.contractAddress && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({truncateString(option.contractAddress, 6, 4)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-sm font-medium text-blue-600">→</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );

    const renderPurchaseStep = () => {
      if (!selectedOption || selectedOption.type !== "payment") return null;

      const getStatusSteps = () => {
        const steps = [
          {
            id: "validate",
            label: "Validating",
            status: "pending" as "pending" | "loading" | "complete",
          },
          {
            id: "purchase",
            label: "Purchasing",
            status: "pending" as "pending" | "loading" | "complete",
          },
        ];

        if (purchaseStatus === "validating") {
          steps[0].status = "loading";
        } else if (purchaseStatus === "purchasing") {
          steps[0].status = "complete";
          steps[1].status = "loading";
        } else if (purchaseStatus === "success") {
          steps[0].status = "complete";
          steps[1].status = "complete";
        }

        return steps;
      };

      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Purchase Video
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Complete the purchase to unlock this video
            </p>
          </div>

          <PurchaseStatus steps={getStatusSteps()} />

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isProcessing || purchaseStatus !== "idle"}
              className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? "Processing..."
                : `Purchase video for ${formatMoney(
                    USDCWeiToUSD(selectedOption.price!)
                  )}`}
            </button>
          </div>
        </div>
      );
    };

    const renderTokenStep = () => {
      if (!selectedOption || selectedOption.type !== "token") return null;

      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Token Access Requirements
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              To unlock this video, you need:
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-500">
                <p>
                  {selectedOption.tokenDetails?.amount || 1}{" "}
                  {selectedOption.tokenDetails?.type} token
                  {selectedOption.tokenDetails?.amount !== 1 ? "s" : ""}
                </p>
                {selectedOption.contractAddress && (
                  <p className="mt-2 text-xs text-gray-400">
                    Contract: {selectedOption.contractAddress}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };

    if (currentStep === "options") {
      return renderOptionsStep();
    }

    if (currentStep === "unlock") {
      return selectedOption
        ? selectedOption.type === "payment"
          ? renderPurchaseStep()
          : renderTokenStep()
        : null;
    }

    return null;
  }
);

UnlockWizard.displayName = "UnlockWizard";

export default UnlockWizard;
