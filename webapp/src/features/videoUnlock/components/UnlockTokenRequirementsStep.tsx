import type { UnlockOption } from "../types";

interface UnlockTokenRequirementsStepProps {
  selectedOption: UnlockOption;
}

const UnlockTokenRequirementsStep: React.FC<
  UnlockTokenRequirementsStepProps
> = ({ selectedOption }) => {
  if (selectedOption.type !== "token") return null;

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

export default UnlockTokenRequirementsStep;
