import { useState, useCallback } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
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
import { getSmartAccountClient } from "../utils/paymaster";

interface UseVideoPurchaseProps {
  selectedOption: UnlockOption | null;
  metadata: VideoMetadata | undefined;
  hasEmbeddedWallet: boolean | undefined;
  handlers: UnlockHandlers;
  onProcessingChange: (isProcessing: boolean) => void;
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

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

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

      // const pc = createPublicClient({
      //   chain: DEFAULT_CHAIN,
      //   transport: http(transport("client", DEFAULT_CHAIN.name)),
      // });

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);
      const nonce = await generateNonce(
        publicClient,
        walletClient.account.address
      );

      const signature = await signPermit(
        walletClient,
        selectedOption.price,
        CONTRACT_ADDRESSES.PURCHASE_MANAGER,
        deadline,
        nonce
      );

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

      const sc = await getSmartAccountClient(publicClient, walletClient);

      const tx = await sc.sendTransaction({
        to: CONTRACT_ADDRESSES.PURCHASE_MANAGER,
        data: callData,
      });

      // const tx = await walletClient.sendTransaction({
      //   to: CONTRACT_ADDRESSES.PURCHASE_MANAGER,
      //   data: callData,
      // });

      console.log("tx", tx);

      // Set args to trigger the useEffect for sendTransaction
      // setTransactionArgs({
      //   to: CONTRACT_ADDRESSES.PURCHASE_MANAGER,
      //   data: callData,
      // });
      // The purchaseStatus will be updated by the useEffect hooks watching sendTransaction and useWaitForTransactionReceipt
    } catch (error) {
      // This catch block handles errors from synchronous parts or from nonce/permit generation
      console.error("Error during purchase initiation (permit/nonce):", error);
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
    onProcessingChange(false); // Ensure processing is reset
  }, [onProcessingChange]);

  return {
    purchaseStatus,
    initiatePurchase,
    resetPurchaseState,
  };
};
