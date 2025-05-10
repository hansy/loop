"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  ReactElement,
  useEffect,
} from "react";
import {
  usePrivy,
  useLogin,
  useLogout,
  User,
  PrivyErrorCode,
} from "@privy-io/react-auth";
import { useChainId, useSwitchChain } from "wagmi";
import { DEFAULT_CHAIN } from "@/config/chainConfig";
import { apiPost } from "@/lib/client/apiClient";
import type { ClientApiError } from "@/lib/client/apiClient";

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

  const { login } = useLogin({
    onComplete: async (loginData: { user: User; isNewUser: boolean }) => {
      const { user: privyUser, isNewUser } = loginData;
      console.log(
        `Privy login complete. User DID: ${privyUser.id}, Is new Privy user: ${isNewUser}. Attempting to sync with DB.`
      );

      await createUser();
    },
    onError: (error: PrivyErrorCode) => {
      console.error("Privy login error:", error);
    },
  });

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

  const createUser = async () => {
    try {
      interface ApiUsersResponse {
        userId: string;
        did: string;
      }

      const data = await apiPost<ApiUsersResponse>("/api/users");
      console.log("Successfully called /api/users:", data);
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          "Error calling /api/users endpoint:",
          (error as ClientApiError).message,
          (error as ClientApiError).statusCode,
          (error as ClientApiError).serverError
        );
      } else {
        console.error(
          "An unexpected error occurred while calling /api/users:",
          error
        );
      }
    }
  };

  useEffect(() => {
    if (
      ready &&
      authenticated &&
      switchChain &&
      typeof currentChainId === "number"
    ) {
      if (!isCorrectChain) {
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

  useEffect(() => {
    if (chainSwitchStatus === "error" && switchChainError) {
      console.error(
        `Failed to switch to network ${DEFAULT_CHAIN.name}. Error: ${switchChainError.message}. Logging out user.`
      );
      logout();
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
