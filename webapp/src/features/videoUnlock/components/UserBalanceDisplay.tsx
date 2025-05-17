import { formatMoney, USDCWeiToUSD } from "@/utils/currency";
import { PlusIcon } from "@heroicons/react/24/outline";

interface UserBalanceDisplayProps {
  userUSDCBalanceWei: bigint | null;
  isLoading: boolean;
  hasSufficientBalance: boolean;
  onActionButtonClick: () => void;
}

const UserBalanceDisplay: React.FC<UserBalanceDisplayProps> = ({
  userUSDCBalanceWei,
  isLoading,
  hasSufficientBalance,
  onActionButtonClick,
}) => {
  const renderBalanceValue = () => {
    if (userUSDCBalanceWei === null) return "-"; // Display a dash if balance is null but not loading
    return (
      <span className="font-semibold">
        {formatMoney(USDCWeiToUSD(userUSDCBalanceWei))} USDC
      </span>
    );
  };

  return (
    <div className="w-full rounded-md bg-white px-3 pt-2.5 pb-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor="user-balance"
            className="block text-xs font-medium text-gray-900"
          >
            {isLoading ? "Loading balance..." : "Your balance:"}
          </label>
          {!isLoading && (
            <div
              id="user-balance"
              className="block w-full text-gray-900 focus:outline-none sm:text-sm leading-6"
            >
              {renderBalanceValue()}
            </div>
          )}
          {!isLoading &&
            !hasSufficientBalance &&
            userUSDCBalanceWei !== null && (
              <p className="text-xs text-red-500 mt-0.5">
                Insufficient balance to purchase.
              </p>
            )}
        </div>
        {!isLoading && (
          <button
            type="button"
            onClick={onActionButtonClick}
            className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 text-white bg-black"
            disabled={isLoading}
            aria-label="Add funds"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default UserBalanceDisplay;
