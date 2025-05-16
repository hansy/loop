import { LockClosedIcon } from "@heroicons/react/24/outline";
import { truncateString } from "@/utils/truncateString";
import type { UnlockOption } from "../types";

interface UnlockOptionsStepProps {
  unlockOptions: UnlockOption[];
  onOptionSelect: (option: UnlockOption) => void;
}

const UnlockOptionsStep: React.FC<UnlockOptionsStepProps> = ({
  unlockOptions,
  onOptionSelect,
}) => {
  return (
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
            onClick={() => onOptionSelect(option)}
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
};

export default UnlockOptionsStep;
