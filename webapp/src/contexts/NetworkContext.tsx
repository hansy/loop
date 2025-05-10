"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  ReactElement,
  useEffect,
  useState,
  useCallback,
} from "react";
import { usePrivy } from "@privy-io/react-auth"; // Removed User import
import { useChainId, useSwitchChain } from "wagmi";
import { DEFAULT_CHAIN } from "@/config/chainConfig"; // Assuming this path is correct

interface NetworkContextType {
  isCorrectChain: boolean;
  chainSwitchAttemptFailed: boolean;
  retryChainSwitch: () => void;
  currentChainId: number | undefined;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({
  children,
}: NetworkProviderProps): ReactElement {
  const { ready, authenticated } = usePrivy();
  const currentChainIdWagmi = useChainId(); // Renamed to avoid conflict if we store it in state
  const {
    switchChain,
    status: chainSwitchStatus,
    error: switchChainError,
  } = useSwitchChain();

  const [chainSwitchAttemptFailed, setChainSwitchAttemptFailed] =
    useState(false);

  const isCorrectChain = useMemo(() => {
    return currentChainIdWagmi === DEFAULT_CHAIN.id;
  }, [currentChainIdWagmi]);

  // Effect to attempt switch if authenticated and not on correct chain
  useEffect(() => {
    if (
      ready &&
      authenticated &&
      switchChain && // Ensure switchChain is available
      typeof currentChainIdWagmi === "number" && // Ensure chain ID is known
      !isCorrectChain &&
      (chainSwitchStatus === "idle" || chainSwitchStatus === "success") // Only switch if not already pending/failed recently from this effect
    ) {
      console.log(
        `NetworkContext: Wallet connected to chain ID ${currentChainIdWagmi}, attempting to switch to ${DEFAULT_CHAIN.name} (ID: ${DEFAULT_CHAIN.id})`
      );
      setChainSwitchAttemptFailed(false); // Reset before attempting
      switchChain({ chainId: DEFAULT_CHAIN.id });
    }
  }, [
    ready,
    authenticated,
    currentChainIdWagmi,
    switchChain,
    isCorrectChain,
    chainSwitchStatus, // Added to re-evaluate if status changes
  ]);

  // Effect to handle chain switch errors
  useEffect(() => {
    if (chainSwitchStatus === "error" && switchChainError) {
      console.error(
        `NetworkContext: Failed to switch to network ${DEFAULT_CHAIN.name}. Error: ${switchChainError.message}`
      );
      setChainSwitchAttemptFailed(true);
    }
  }, [chainSwitchStatus, switchChainError]);

  // Effect to reset chainSwitchAttemptFailed if user logs out or becomes unready
  useEffect(() => {
    if (!ready || !authenticated) {
      if (chainSwitchAttemptFailed) {
        // Only reset if it was true
        console.log(
          "NetworkContext: User logged out or Privy not ready, resetting chainSwitchAttemptFailed."
        );
        setChainSwitchAttemptFailed(false);
      }
    }
  }, [ready, authenticated, chainSwitchAttemptFailed]);

  const retryChainSwitch = useCallback(() => {
    if (ready && authenticated && !isCorrectChain && switchChain) {
      console.log(
        `NetworkContext: Retrying chain switch to ${DEFAULT_CHAIN.name} (ID: ${DEFAULT_CHAIN.id})`
      );
      setChainSwitchAttemptFailed(false);
      switchChain({ chainId: DEFAULT_CHAIN.id });
    } else {
      console.log("NetworkContext: Conditions not met for retryChainSwitch", {
        ready,
        authenticated,
        isCorrectChain,
        switchChainExists: !!switchChain,
      });
    }
  }, [ready, authenticated, isCorrectChain, switchChain]);

  const contextValue = useMemo(
    () => ({
      isCorrectChain,
      chainSwitchAttemptFailed,
      retryChainSwitch,
      currentChainId: currentChainIdWagmi, // Expose current chain ID
    }),
    [
      isCorrectChain,
      chainSwitchAttemptFailed,
      retryChainSwitch,
      currentChainIdWagmi,
    ]
  );

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
