import { formatMoney, USDCWeiToUSD } from "@/utils/currency";
import type {
  UnlockOption,
  PurchaseStatus as PurchaseStatusType,
} from "../types";
import PurchaseStatusDisplay from "./PurchaseStatus";
import UserBalanceDisplay from "./UserBalanceDisplay";
import { useAccount, useBalance } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/config/contractsConfig";
import { IS_PRODUCTION } from "@/utils/env";
import { useFundWallet } from "@privy-io/react-auth";

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
  const { address: userAddress, isConnected } = useAccount();

  const { data: balanceData, isLoading: isBalanceQueryLoading } = useBalance({
    address: userAddress,
    token: CONTRACT_ADDRESSES.USDC,
  });

  const { fundWallet } = useFundWallet();

  if (selectedOption.type !== "payment" || !selectedOption.price) return null;

  const videoPriceWei = selectedOption.price;
  const userUSDCBalanceWei = balanceData?.value ?? null;

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

  const isBalanceLoading = isBalanceQueryLoading || !isConnected;
  const hasSufficientBalance =
    !isBalanceLoading &&
    userUSDCBalanceWei !== null &&
    userUSDCBalanceWei >= videoPriceWei;

  const purchaseButtonDisabled =
    isProcessing ||
    purchaseStatus !== "idle" ||
    isBalanceLoading ||
    !hasSufficientBalance;

  const handleGetUSDCButtonClick = () => {
    if (IS_PRODUCTION) {
      fundWallet(userAddress as string, {
        amount: "5",
        asset: "USDC",
      });
    } else {
      window.open(
        `https://faucet.circle.com/?address=${userAddress}`,
        "_blank"
      );
    }
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

      <div className="flex flex-col items-center space-y-4">
        <button
          type="button"
          onClick={onInitiatePurchase}
          disabled={purchaseButtonDisabled}
          className="inline-flex justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blackfocus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mb-5 border border-black"
        >
          {isProcessing ||
          purchaseStatus === "purchasing" ||
          purchaseStatus === "validating"
            ? "Processing..."
            : `Purchase video for ${formatMoney(USDCWeiToUSD(videoPriceWei))}`}
        </button>
        <UserBalanceDisplay
          userUSDCBalanceWei={userUSDCBalanceWei}
          isLoading={isBalanceLoading}
          hasSufficientBalance={hasSufficientBalance}
          onActionButtonClick={handleGetUSDCButtonClick}
        />
      </div>
    </div>
  );
};

export default UnlockPurchaseStep;
