import React from "react";
import { Switch } from "@headlessui/react";

interface PaywallSettingsProps {
  isPaywalled: boolean;
  price: number;
  onPaywallChange: (isPaywalled: boolean) => void;
  onPriceChange: (price: number) => void;
}

/**
 * PaywallSettings component for configuring video paywall settings
 * @param isPaywalled - Whether the video is paywalled
 * @param price - The price of the video in USDC
 * @param onPaywallChange - Callback when paywall toggle changes
 * @param onPriceChange - Callback when price changes
 */
export default function PaywallSettings({
  isPaywalled,
  price,
  onPaywallChange,
  onPriceChange,
}: PaywallSettingsProps) {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty input for better UX
    if (value === "") {
      onPriceChange(0);
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onPriceChange(numValue);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label
          htmlFor="paywall-toggle"
          className="text-sm font-medium text-gray-900"
        >
          Enable Paywall
        </label>
        <Switch
          checked={isPaywalled}
          onChange={onPaywallChange}
          className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:outline-hidden data-checked:bg-indigo-600"
        >
          <span className="sr-only">Enable paywall</span>
          <span className="pointer-events-none relative inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out group-data-checked:translate-x-5">
            <span
              aria-hidden="true"
              className="absolute inset-0 flex size-full items-center justify-center transition-opacity duration-200 ease-in group-data-checked:opacity-0 group-data-checked:duration-100 group-data-checked:ease-out"
            >
              <svg
                fill="none"
                viewBox="0 0 12 12"
                className="size-3 text-gray-400"
              >
                <path
                  d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span
              aria-hidden="true"
              className="absolute inset-0 flex size-full items-center justify-center opacity-0 transition-opacity duration-100 ease-out group-data-checked:opacity-100 group-data-checked:duration-200 group-data-checked:ease-in"
            >
              <svg
                fill="currentColor"
                viewBox="0 0 12 12"
                className="size-3 text-indigo-600"
              >
                <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
              </svg>
            </span>
          </span>
        </Switch>
      </div>

      {isPaywalled && (
        <div className="mt-4">
          <label
            htmlFor="price"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Price to unlock video
          </label>
          <div className="mt-2">
            <div className="flex items-center rounded-md bg-white px-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
              <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
                $
              </div>
              <input
                id="price"
                name="price"
                type="text"
                defaultValue={price}
                onChange={handlePriceChange}
                placeholder="0.01"
                aria-describedby="price-currency"
                className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
              />
              <div
                id="price-currency"
                className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6"
              >
                USDC
              </div>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Minimum price is 0.01 USDC
          </p>
        </div>
      )}
    </div>
  );
}
