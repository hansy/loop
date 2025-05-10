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
  const { login } = useLogin({
    onComplete: async () => {
      await registerUserWithBackend();
    },
    onError: (error: PrivyErrorCode) => {
      console.error("Privy login error:", error);

      setIsBackendRegistered(false);
    },
  });
  const { logout: privyLogout } = useLogout();
  const logout = useCallback(async () => {
    if (privyLogout) {
      setIsBackendRegistered(false);

      await privyLogout();
    }
  }, [privyLogout]);
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
      await createUser();

      setIsBackendRegistered(true);
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
