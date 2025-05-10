"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  ReactElement,
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
import { createUser } from "@/services/userApiService";
import { useRouter } from "next/navigation";
import {
  showErrorToast,
  showLoadingToast,
  updateToast,
} from "@/lib/common/utils/toast";

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const { ready, authenticated, user } = usePrivy();
  const [isBackendRegistered, setIsBackendRegistered] = useState(false);
  const router = useRouter();
  const { login } = useLogin({
    onComplete: async () => {
      const toastId = showLoadingToast("Setting up your account...");
      try {
        await registerUserWithBackend();
        updateToast(toastId, "Successfully logged in!", "success");
      } catch (err) {
        console.error("Failed to set up account:", err);
        updateToast(
          toastId,
          "Failed to set up account. Please try again.",
          "error"
        );
      }
    },
    onError: (error: PrivyErrorCode) => {
      console.error("Privy login error:", error);
      setIsBackendRegistered(false);
      showErrorToast("Failed to log in. Please try again.");
    },
  });
  const { logout: privyLogout } = useLogout();
  const logout = useCallback(async () => {
    if (privyLogout) {
      const toastId = showLoadingToast("Logging out...");
      try {
        setIsBackendRegistered(false);
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
    }),
    [user, login, logout, isAuthenticated, isAuthenticating]
  );

  const registerUserWithBackend = async () => {
    try {
      const data = await createUser();
      setIsBackendRegistered(true);

      if (data.newUser) {
        router.refresh();
      } else {
        router.push("/library");
      }
    } catch (error) {
      console.error(
        "AuthContext: Failed to register user with backend. Logging out.",
        error
      );
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
