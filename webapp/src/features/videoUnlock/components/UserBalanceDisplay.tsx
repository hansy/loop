import { formatMoney, USDCWeiToUSD } from "@/utils/currency";

interface UserBalanceDisplayProps {
  userUSDCBalanceWei: bigint | null;
  isLoading: boolean;
  hasSufficientBalance: boolean;
}

const UserBalanceDisplay: React.FC<UserBalanceDisplayProps> = ({
  userUSDCBalanceWei,
  isLoading,
  hasSufficientBalance,
}) => {
  if (isLoading) {
    return (
      <div className="text-sm text-gray-600">
        <span>Loading balance...</span>
      </div>
    );
  }

  if (userUSDCBalanceWei === null) {
    // Should not happen if isLoading is false, but good for type safety
    return null;
  }

  return (
    <div className="text-sm text-gray-600 text-center">
      <span>
        Your balance:{" "}
        <span className="font-medium">
          {formatMoney(USDCWeiToUSD(userUSDCBalanceWei))} USDC
        </span>
      </span>
      {!hasSufficientBalance && (
        <p className="text-xs text-red-500 mt-1">
          Insufficient balance to purchase.
        </p>
      )}
    </div>
  );
};

export default UserBalanceDisplay;
