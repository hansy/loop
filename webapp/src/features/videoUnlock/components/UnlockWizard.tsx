import {
  useReducer,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import type { UnlockWizardProps, UnlockOption } from "../types";
import { unlockReducer, initialState } from "../reducer";
import { useUnlockOptions } from "../hooks/useUnlockOptions";
import { useVideoPurchase } from "../hooks/useVideoPurchase";
import UnlockOptionsStep from "./UnlockOptionsStep";
import UnlockPurchaseStep from "./UnlockPurchaseStep";
import UnlockTokenRequirementsStep from "./UnlockTokenRequirementsStep";

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

    const unlockOptions = useUnlockOptions(metadata);

    const handleProcessingChange = useCallback(
      (processing: boolean) => {
        dispatch({ type: "SET_PROCESSING", payload: processing });
      },
      [dispatch]
    );

    const { purchaseStatus, initiatePurchase, resetPurchaseState } =
      useVideoPurchase({
        selectedOption,
        metadata,
        hasEmbeddedWallet,
        handlers,
        onProcessingChange: handleProcessingChange,
      });

    useImperativeHandle(ref, () => ({
      resetState: () => {
        dispatch({ type: "RESET_OPTION" });
        resetPurchaseState();
      },
    }));

    const handleOptionSelect = (option: UnlockOption) => {
      dispatch({ type: "SELECT_OPTION", payload: option });
      // Reset purchase state when a new option is selected, or if going back to options
      resetPurchaseState();
      onStepChange("unlock");
    };

    if (currentStep === "options") {
      return (
        <UnlockOptionsStep
          unlockOptions={unlockOptions}
          onOptionSelect={handleOptionSelect}
        />
      );
    }

    if (currentStep === "unlock" && selectedOption) {
      if (selectedOption.type === "payment") {
        return (
          <UnlockPurchaseStep
            selectedOption={selectedOption}
            purchaseStatus={purchaseStatus}
            isProcessing={isProcessing}
            onInitiatePurchase={initiatePurchase}
          />
        );
      }
      if (selectedOption.type === "token") {
        return <UnlockTokenRequirementsStep selectedOption={selectedOption} />;
      }
    }

    return null;
  }
);

UnlockWizard.displayName = "UnlockWizard";

export default UnlockWizard;
