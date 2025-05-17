"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  ReactElement,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  usePrivy,
  useLogin,
  useLogout,
  User,
  PrivyErrorCode,
  useWallets,
} from "@privy-io/react-auth";
import { createUser } from "@/services/client/userApi";
import { useRouter } from "next/navigation";
import { showErrorToast, showLoadingToast, updateToast } from "@/utils/toast";
import { getLatestWallet } from "@/utils/privyUtils";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useSignMessage } from "wagmi";
import { LitService } from "@/services/client/encrpytion/litService.client";
import { SessionSigsMap } from "@lit-protocol/types";
import { fetchDelegatedAuthSig } from "@/services/client/litApi";

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  sessionSigs: SessionSigsMap | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const { ready, authenticated, user } = usePrivy();
  const [isBackendRegistered, setIsBackendRegistered] = useState(false);
  const [sessionSigs, setSessionSigs] = useState<SessionSigsMap | null>(null);
  const router = useRouter();
  const { setActiveWallet } = useSetActiveWallet();
  const { wallets, ready: walletsReady } = useWallets();
  const { signMessageAsync } = useSignMessage();

  const { login } = useLogin({
    onComplete: async () => {
      await registerUserWithBackend();
    },
    onError: (error: PrivyErrorCode) => {
      console.error("Privy login error:", error);
      setIsBackendRegistered(false);
      setSessionSigs(null);
      showErrorToast("Failed to log in. Please try again.");
    },
  });

  const { logout: privyLogout } = useLogout();
  const logout = useCallback(async () => {
    if (privyLogout) {
      const toastId = showLoadingToast("Logging out...");

      try {
        setIsBackendRegistered(false);
        setSessionSigs(null);

        await privyLogout();

        updateToast(toastId, "Successfully logged out!", "success");
        router.push("/");
      } catch (err) {
        console.error("Failed to log out:", err);

        updateToast(toastId, "Failed to log out. Please try again.", "error");
      }
    }
  }, [privyLogout, router]);

  const isAuthenticated = useMemo(
    () => ready && authenticated && isBackendRegistered && sessionSigs !== null,
    [ready, authenticated, isBackendRegistered, sessionSigs]
  );

  const isAuthenticating = useMemo(() => {
    if (!ready) return true;
    if (ready && authenticated && !isBackendRegistered) return true;
    if (ready && authenticated && isBackendRegistered && !sessionSigs)
      return true;
    return false;
  }, [ready, authenticated, isBackendRegistered, sessionSigs]);

  const contextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated,
      isAuthenticating,
      sessionSigs,
    }),
    [user, login, logout, isAuthenticated, isAuthenticating, sessionSigs]
  );

  useEffect(() => {
    if (authenticated && isBackendRegistered && user && walletsReady) {
      const linkedAccounts = user.linkedAccounts;
      const latestWallet = getLatestWallet(linkedAccounts);

      if (latestWallet) {
        const wallet = wallets.find((w) => w.address === latestWallet.address);

        if (wallet) {
          setActiveWallet(wallet);
        }
      }
    }
  }, [
    wallets,
    setActiveWallet,
    authenticated,
    isBackendRegistered,
    walletsReady,
    user,
  ]);

  const registerUserWithBackend = async () => {
    try {
      const data = await createUser();

      setIsBackendRegistered(true);

      // After backend registration, fetch delegated auth sig and create session sigs
      await setupSessionSigs(data.walletAddress);

      if (data.newUser) {
        router.refresh();
      }
    } catch (error) {
      console.error(
        "AuthContext: Failed to register user with backend. Logging out.",
        error
      );
      await logout();
    }
  };

  const setupSessionSigs = async (walletAddress: string) => {
    try {
      // Fetch delegated auth sig from backend
      const delegatedAuthSig = await fetchDelegatedAuthSig(walletAddress);

      // Generate session sigs using the delegated auth sig
      const litService = new LitService();
      const sigs = await litService.generateSessionSigs(
        walletAddress,
        signMessageAsync,
        delegatedAuthSig
      );

      setSessionSigs(sigs);
    } catch (error) {
      console.error("Failed to setup session sigs:", error);
      await logout();
    }
  };

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
