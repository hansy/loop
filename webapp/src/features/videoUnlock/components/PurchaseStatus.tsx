import { CheckIcon } from "@heroicons/react/24/solid";

interface StatusStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "complete";
}

interface PurchaseStatusProps {
  steps: StatusStep[];
}

/**
 * PurchaseStatus displays a series of steps in a purchase process,
 * showing the current status with loading indicators and checkmarks.
 *
 * @component
 * @example
 * ```tsx
 * <PurchaseStatus
 *   steps={[
 *     { id: "validate", label: "Validating", status: "complete" },
 *     { id: "purchase", label: "Purchasing", status: "loading" }
 *   ]}
 * />
 * ```
 */
export default function PurchaseStatus({ steps }: PurchaseStatusProps) {
  return (
    <div className="flex items-center justify-center space-x-8">
      {steps.map((step) => (
        <div
          key={step.id}
          className={`flex items-center space-x-2 ${
            step.status === "pending" ? "opacity-50" : ""
          }`}
        >
          {step.status === "complete" ? (
            <CheckIcon className="h-5 w-5 text-green-500" />
          ) : step.status === "loading" ? (
            <div className="h-5 w-5">
              <svg
                className="animate-spin text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : (
            <div className="h-5 w-5" />
          )}
          <span
            className={`text-sm font-medium ${
              step.status === "loading"
                ? "text-blue-600"
                : step.status === "complete"
                ? "text-green-500"
                : "text-gray-500"
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
