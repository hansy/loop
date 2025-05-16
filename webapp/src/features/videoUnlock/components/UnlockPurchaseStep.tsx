import { formatMoney, USDCWeiToUSD } from "@/utils/currency";
import type {
  UnlockOption,
  PurchaseStatus as PurchaseStatusType,
} from "../types";
import PurchaseStatusDisplay from "./PurchaseStatus"; // Renamed to avoid conflict

interface UnlockPurchaseStepProps {
  selectedOption: UnlockOption;
  purchaseStatus: PurchaseStatusType;
  isProcessing: boolean;
  onInitiatePurchase: () => void;
}

const UnlockPurchaseStep: React.FC<UnlockPurchaseStepProps> = ({
  selectedOption,
  purchaseStatus,
  isProcessing,
  onInitiatePurchase,
}) => {
  if (selectedOption.type !== "payment" || !selectedOption.price) return null;

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
    // TODO: Handle 'error' status in PurchaseStatusDisplay if needed

    return steps;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Purchase Video</h3>
        <p className="mt-1 text-sm text-gray-500">
          Complete the purchase to unlock this video
        </p>
      </div>

      <PurchaseStatusDisplay steps={getStatusSteps()} />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onInitiatePurchase}
          disabled={isProcessing || purchaseStatus !== "idle"}
          className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ||
          purchaseStatus === "purchasing" ||
          purchaseStatus === "validating"
            ? "Processing..."
            : `Purchase video for ${formatMoney(
                USDCWeiToUSD(selectedOption.price)
              )}`}
        </button>
      </div>
    </div>
  );
};

export default UnlockPurchaseStep;
