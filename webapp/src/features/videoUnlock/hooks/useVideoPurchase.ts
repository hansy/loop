import { useState, useCallback, useEffect } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "@permissionless/wagmi";
import { encodeFunctionData } from "viem";
import type { VideoMetadata } from "@/types/video";
import type {
  UnlockOption,
  PurchaseStatus as PurchaseStatusType,
  UnlockHandlers,
} from "../types";
import { signPermit, generateNonce } from "../utils/erc20";
import { CONTRACT_ADDRESSES } from "@/config/contractsConfig";
import { PurchaseManagerABI } from "@/abis/purchaseManager";

interface UseVideoPurchaseProps {
  selectedOption: UnlockOption | null;
  metadata: VideoMetadata | undefined;
  hasEmbeddedWallet: boolean | undefined;
  handlers: UnlockHandlers;
  onProcessingChange: (isProcessing: boolean) => void;
}

interface TransactionArgs {
  to: `0x${string}`;
  data: `0x${string}`;
}

export const useVideoPurchase = ({
  selectedOption,
  metadata,
  hasEmbeddedWallet,
  handlers,
  onProcessingChange,
}: UseVideoPurchaseProps) => {
  const [purchaseStatus, setPurchaseStatus] =
    useState<PurchaseStatusType>("idle");
  const [transactionArgs, setTransactionArgs] =
    useState<TransactionArgs | null>(null);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const {
    sendTransaction,
    data: transactionReference, // This will be the transaction hash upon submission
    isPending: isSendingTransaction, // True while the transaction is being sent to the wallet/node
    isError: isSendTransactionError,
    error: sendTransactionError,
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isConfirmingError,
    error: confirmingError,
  } = useWaitForTransactionReceipt({
    id: transactionReference,
    // pollingInterval: 1_000, // Optional: customize polling interval
  });

  // Effect to call sendTransaction when transactionArgs are set
  useEffect(() => {
    if (transactionArgs && !isSendingTransaction) {
      sendTransaction(transactionArgs);
      // Reset args so this doesn't re-trigger unless explicitly set again
      setTransactionArgs(null);
    }
  }, [transactionArgs, sendTransaction, isSendingTransaction]);

  // Effect to handle the outcome of sendTransaction (submission to mempool)
  useEffect(() => {
    if (isSendingTransaction) {
      onProcessingChange(true); // Keep overall processing true
      setPurchaseStatus("purchasing"); // Or a more specific "submitting" status
    } else if (transactionReference) {
      setPurchaseStatus("purchasing"); // Now waiting for confirmation
      // onProcessingChange(true) still, as we are waiting for receipt
    } else if (isSendTransactionError && selectedOption) {
      console.error("Send transaction error:", sendTransactionError);
      setPurchaseStatus("error");
      handlers.onUnlockError(selectedOption, sendTransactionError as Error);
      onProcessingChange(false);
    }
    // Do not set onProcessingChange(false) here yet if hash is received, wait for confirmation
  }, [
    isSendingTransaction,
    transactionReference,
    isSendTransactionError,
    sendTransactionError,
    handlers,
    selectedOption,
    onProcessingChange,
  ]);

  // Effect to handle transaction confirmation (mining)
  useEffect(() => {
    if (isConfirming) {
      onProcessingChange(true); // Still processing
      setPurchaseStatus("purchasing"); // Technically, "confirming"
    } else if (isConfirmed && selectedOption) {
      setPurchaseStatus("success");
      console.log("purchase success");
      handlers.onUnlockSuccess(selectedOption);
      onProcessingChange(false);
    } else if (isConfirmingError && selectedOption) {
      console.error("Transaction confirmation error:", confirmingError);
      setPurchaseStatus("error");
      handlers.onUnlockError(selectedOption, confirmingError as Error);
      onProcessingChange(false);
    }
  }, [
    isConfirming,
    isConfirmed,
    isConfirmingError,
    confirmingError,
    handlers,
    selectedOption,
    onProcessingChange,
  ]);

  const initiatePurchase = useCallback(async () => {
    if (!selectedOption || !walletClient || !publicClient || !metadata) {
      console.error("Missing required dependencies for initiating purchase");
      return;
    }
    if (selectedOption.type !== "payment" || !selectedOption.price) {
      console.error(
        "Selected option is not a payment option or price is missing."
      );
      return;
    }

    // Reset previous transaction states
    setPurchaseStatus("validating"); // Initial status before any async ops
    onProcessingChange(true); // Start processing early for user feedback

    try {
      const confirmMessage = hasEmbeddedWallet
        ? "Are you sure you want to purchase this video?"
        : "Are you sure you want to purchase this video? You will be prompted to sign three transactions (signature, permit, purchase) to complete the order.";

      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        setPurchaseStatus("idle");
        onProcessingChange(false);
        return;
      }

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);
      const nonce = await generateNonce(
        publicClient,
        walletClient.account.address
      );

      console.log("walletClient address", walletClient.account.address);
      const signature = await signPermit(
        walletClient,
        selectedOption.price,
        CONTRACT_ADDRESSES.PURCHASE_MANAGER,
        deadline,
        nonce
      );

      console.log("signature", signature);
      const callData = encodeFunctionData({
        abi: PurchaseManagerABI,
        functionName: "purchaseVideoWithPermit",
        args: [
          BigInt(metadata.tokenId),
          walletClient.account.address,
          deadline,
          Number(signature.v),
          signature.r,
          signature.s,
        ],
      });

      // Set args to trigger the useEffect for sendTransaction
      setTransactionArgs({
        to: CONTRACT_ADDRESSES.PURCHASE_MANAGER,
        data: callData,
      });
      // The purchaseStatus will be updated by the useEffect hooks watching sendTransaction and useWaitForTransactionReceipt
    } catch (error) {
      // This catch block handles errors from synchronous parts or from nonce/permit generation
      console.error("Error during purchase initiation (permit/nonce):");
      setPurchaseStatus("error");
      if (selectedOption) {
        // Ensure selectedOption is available
        handlers.onUnlockError(selectedOption, error as Error);
      }
      onProcessingChange(false);
    }
    // Note: onProcessingChange(false) is handled by useEffects or the catch block above
    // to ensure it's only set when the entire flow (including async parts) is truly done or failed.
  }, [
    selectedOption,
    walletClient,
    publicClient,
    metadata,
    hasEmbeddedWallet,
    handlers,
    onProcessingChange, // Removed sendTransaction from here as it's called in useEffect
    // Keep other dependencies that influence the logic before setting transactionArgs
  ]);

  const resetPurchaseState = useCallback(() => {
    setPurchaseStatus("idle");
    setTransactionArgs(null);
    onProcessingChange(false); // Ensure processing is reset
  }, [onProcessingChange]);

  return {
    purchaseStatus,
    initiatePurchase,
    resetPurchaseState,
    isSendingTransaction,
    isConfirming,
  };
};
