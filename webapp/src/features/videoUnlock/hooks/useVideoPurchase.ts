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
      return;
    }

    if (selectedOption.type !== "payment" || !selectedOption.price) {
      console.error(
        "Selected option is not a payment option or price is missing."
      );
      setPurchaseStatus("error");
      handlers.onUnlockError("Invalid option type or price");
      onProcessingChange(false);
      return;
    }

    setPurchaseStatus("validating");
    onProcessingChange(true);

    try {
      const confirmMessage = hasEmbeddedWallet
        ? "Are you sure you want to purchase this video?"
        : "Are you sure you want to purchase this video? You will be prompted to sign the permit and the purchase transaction.";

      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        setPurchaseStatus("idle");
        onProcessingChange(false);
        return;
      }

      setPurchaseStatus("purchasing");

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

      const smartAccountClient = await getSmartAccountClient(
        publicClient,
        walletClient
      );

      console.log("Sending transaction with Smart Account Client...");
      const hash = await smartAccountClient.sendTransaction({
        to: CONTRACT_ADDRESSES.PURCHASE_MANAGER,
        data: callData,
      });
      console.log("Transaction sent, hash:", hash);

      console.log("Waiting for transaction receipt...");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });
      console.log("Transaction receipt received:", receipt);

      if (receipt.status === "success") {
        setPurchaseStatus("success");
        handlers.onUnlockSuccess(selectedOption);
      } else {
        console.error("Transaction reverted:", receipt);
        setPurchaseStatus("error");
        handlers.onUnlockError("Transaction failed or reverted");
      }
    } catch (error) {
      console.error("Error during purchase initiation or execution:", error);
      setPurchaseStatus("error");
      handlers.onUnlockError("Unknown error");
    } finally {
      onProcessingChange(false);
    }
  }, [
    selectedOption,
    walletClient,
    publicClient,
    metadata,
    hasEmbeddedWallet,
    handlers,
    onProcessingChange,
  ]);

  const resetPurchaseState = useCallback(() => {
    setPurchaseStatus("idle");
    onProcessingChange(false);
  }, [onProcessingChange]);

  return {
    purchaseStatus,
    initiatePurchase,
    resetPurchaseState,
  };
};
