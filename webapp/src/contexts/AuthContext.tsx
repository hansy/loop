"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  ReactElement,
  useEffect,
} from "react";
import { usePrivy, useLogin, useLogout, User } from "@privy-io/react-auth";
import { useChainId, useSwitchChain } from "wagmi";
import { DEFAULT_CHAIN } from "@/config/chainConfig";

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAuthenticating: boolean; // True if Privy is loading OR chain switch is in progress
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const { ready, authenticated, user } = usePrivy();
  const { login } = useLogin();
  const { logout } = useLogout();
  const currentChainId = useChainId();
  const {
    switchChain,
    status: chainSwitchStatus,
    error: switchChainError,
  } = useSwitchChain();
  const isCorrectChain = useMemo(
    () => currentChainId === DEFAULT_CHAIN.id,
    [currentChainId]
  );
  const isAuthenticated = useMemo(
    () => ready && authenticated && isCorrectChain,
    [ready, authenticated, isCorrectChain]
  );
  const isAuthenticating = useMemo(
    () => !ready || chainSwitchStatus === "pending",
    [ready, chainSwitchStatus]
  );

  useEffect(() => {
    // Attempt to switch chain if conditions are met
    if (
      ready &&
      authenticated &&
      switchChain &&
      typeof currentChainId === "number"
    ) {
      if (!isCorrectChain) {
        // Only attempt to switch if no switch operation is currently in progress ('idle').
        if (chainSwitchStatus === "idle") {
          console.log(
            `Wallet connected to chain ID ${currentChainId}, attempting to switch to ${DEFAULT_CHAIN.name} (ID: ${DEFAULT_CHAIN.id})`
          );
          switchChain({ chainId: DEFAULT_CHAIN.id });
        }
      }
    }
  }, [
    ready,
    authenticated,
    currentChainId,
    switchChain,
    chainSwitchStatus,
    isCorrectChain,
  ]);

  // Effect to handle the outcome of chain switching (success/error)
  useEffect(() => {
    if (chainSwitchStatus === "error" && switchChainError) {
      console.error(
        `Failed to switch to network ${DEFAULT_CHAIN.name}. Error: ${switchChainError.message}. Logging out user.`
      );
      logout(); // Logout user if chain switch fails
    } else if (chainSwitchStatus === "success") {
      console.log(`Successfully switched to network ${DEFAULT_CHAIN.name}.`);
    }
  }, [chainSwitchStatus, switchChainError, logout]);

  const contextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated,
      isAuthenticating,
    }),
    [user, login, logout, isAuthenticated, isAuthenticating]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
