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
import {
  usePrivy,
  useLogin,
  useLogout,
  User,
  PrivyErrorCode,
} from "@privy-io/react-auth";
import { useChainId, useSwitchChain } from "wagmi";
import { DEFAULT_CHAIN } from "@/config/chainConfig";
import { apiGet, apiPost } from "@/lib/client/apiClient";
import type { ClientApiError } from "@/lib/client/apiClient";

// Define interface for /api/auth/check-user response
interface CheckUserResponse {
  message: string;
  privyDid: string;
  customMetadata: Record<string, string | number | boolean | undefined>;
  retrievedInternalUserId: string | null;
}

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isCorrectChain: boolean;
  chainSwitchAttemptFailed: boolean;
  retryChainSwitch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const { ready, authenticated, user } = usePrivy();
  const [isBackendRegistered, setIsBackendRegistered] = useState(false);
  const [chainSwitchAttemptFailed, setChainSwitchAttemptFailed] =
    useState(false);

  const { login } = useLogin({
    onError: (error: PrivyErrorCode) => {
      console.error("Privy login error:", error);
      setIsBackendRegistered(false);
      setChainSwitchAttemptFailed(false);
    },
  });

  const { logout: privyLogout } = useLogout();
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

  const logout = useCallback(async () => {
    await privyLogout();
    setIsBackendRegistered(false);
    setChainSwitchAttemptFailed(false);
  }, [privyLogout]);

  useEffect(() => {
    const registerUserWithBackend = async () => {
      if (ready && authenticated && !isBackendRegistered) {
        console.log(
          "Privy authenticated. Attempting backend user registration/sync."
        );
        try {
          interface ApiUsersResponse {
            userId: string;
            did: string;
            existingUser?: boolean;
          }
          const registrationData = await apiPost<ApiUsersResponse>(
            "/api/users"
          );
          console.log(
            "Backend user registration/sync successful:",
            registrationData
          );
          setIsBackendRegistered(true);
        } catch (error) {
          console.error(
            "Backend user registration/sync failed:",
            error instanceof Error ? (error as ClientApiError).message : error
          );
          if (error instanceof Error) {
            const clientError = error as ClientApiError;
            console.error(
              "Details:",
              clientError.statusCode,
              clientError.serverError
            );
          }
          await logout();
        }
      }
    };

    registerUserWithBackend();
  }, [ready, authenticated, isBackendRegistered, logout]);

  const retryChainSwitch = useCallback(() => {
    if (ready && authenticated && !isCorrectChain) {
      console.log(
        `Retrying chain switch to ${DEFAULT_CHAIN.name} (ID: ${DEFAULT_CHAIN.id})`
      );
      setChainSwitchAttemptFailed(false);
      switchChain({ chainId: DEFAULT_CHAIN.id });
    }
  }, [ready, authenticated, isCorrectChain, switchChain]);

  useEffect(() => {
    if (
      ready &&
      authenticated &&
      switchChain &&
      typeof currentChainId === "number" &&
      !isCorrectChain
    ) {
      if (chainSwitchStatus === "idle" || chainSwitchStatus === "success") {
        console.log(
          `Wallet connected to chain ID ${currentChainId}, attempting to switch to ${DEFAULT_CHAIN.name} (ID: ${DEFAULT_CHAIN.id})`
        );
        setChainSwitchAttemptFailed(false);
        switchChain({ chainId: DEFAULT_CHAIN.id });
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
        `Failed to switch to network ${DEFAULT_CHAIN.name}. Error: ${switchChainError.message}`
      );
      setChainSwitchAttemptFailed(true);
    }
  }, [chainSwitchStatus, switchChainError]);

  useEffect(() => {
    if (!ready || !authenticated) {
      setChainSwitchAttemptFailed(false);
    }
  }, [ready, authenticated]);

  const isAuthenticated = useMemo(
    () => ready && authenticated && isBackendRegistered,
    [ready, authenticated, isBackendRegistered]
  );

  const isAuthenticating = useMemo(() => {
    if (!ready) return true;
    if (ready && authenticated && !isBackendRegistered) return true;
    return false;
  }, [ready, authenticated, isBackendRegistered]);

  const contextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated,
      isAuthenticating,
      isCorrectChain,
      chainSwitchAttemptFailed,
      retryChainSwitch,
    }),
    [
      user,
      login,
      logout,
      isAuthenticated,
      isAuthenticating,
      isCorrectChain,
      chainSwitchAttemptFailed,
      retryChainSwitch,
    ]
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
