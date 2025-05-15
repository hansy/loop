import { useState } from "react";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { VideoMetadata } from "@/types";
import type {
  AccessControlState,
  GroupNode,
} from "@/features/accessControl/types";
import { truncateString } from "@/utils/truncateString";
import { formatMoney, USDCWeiToUSD } from "@/utils/currency";

interface UnlockWizardProps {
  metadata: VideoMetadata;
  accessControl: AccessControlState;
  onUnlock: (type: "token" | "payment") => Promise<void>;
  onStepChange: (step: "options" | "unlock") => void;
  currentStep: "options" | "unlock";
}

interface UnlockOption {
  id: string;
  type: "token" | "payment";
  title: string;
  description: string;
  price?: bigint;
  contractAddress?: string;
  tokenDetails?: {
    type: string;
    amount?: number;
  };
}

/**
 * UnlockWizard is a component that handles the multi-step unlock flow for videos.
 * It displays available unlock options and guides users through the unlock process.
 *
 * @component
 * @example
 * ```tsx
 * <UnlockWizard
 *   video={videoMetadata}
 *   accessControl={accessControlState}
 *   onUnlock={handleUnlock}
 *   onStepChange={handleStepChange}
 * />
 * ```
 */
export default function UnlockWizard({
  metadata,
  accessControl,
  onUnlock,
  onStepChange,
  currentStep,
}: UnlockWizardProps) {
  const [selectedOption, setSelectedOption] = useState<UnlockOption | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Extract unlock options from access control and video metadata
  const unlockOptions: UnlockOption[] = [
    // Add token-based options from access control
    ...(accessControl
      .find(
        (node): node is GroupNode =>
          node.type === "group" && node.id === "inner-group"
      )
      ?.rules.find(
        (rule): rule is GroupNode =>
          rule.type === "group" && rule.id === "user-group"
      )
      ?.rules.filter((group): group is GroupNode => group.type === "group")
      .map((group) => {
        const tokenRule = group.rules.find((rule) => rule.type === "token");
        return {
          id: group.id,
          type: "token" as const,
          title: "Token Access",
          description: `Access with ${tokenRule?.subtype || "token"}`,
          contractAddress: tokenRule?.contract,
          tokenDetails: {
            type: tokenRule?.subtype || "token",
            amount: tokenRule?.numTokens,
          },
        };
      }) || []),
  ];

  if (BigInt(metadata.price.amount) > 0n) {
    unlockOptions.push({
      id: "payment",
      type: "payment" as const,
      title: "Purchase Video",
      description: `Buy this video for ${formatMoney(
        USDCWeiToUSD(BigInt(metadata.price.amount))
      )} USDC`,
      price: BigInt(metadata.price.amount),
    });
  }

  const handleOptionSelect = (option: UnlockOption) => {
    setSelectedOption(option);
    onStepChange("unlock");
  };

  const handleUnlock = async () => {
    if (!selectedOption) return;

    try {
      setIsProcessing(true);
      await onUnlock(selectedOption.type);
    } catch (error) {
      console.error("Unlock failed:", error);
    } finally {
      setIsProcessing(false);
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

        <div className="flex justify-center">
          <button
            onClick={handleUnlock}
            disabled={isProcessing}
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
