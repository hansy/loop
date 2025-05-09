"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  ReactElement,
} from "react";
import { usePrivy, useLogin, useLogout, User } from "@privy-io/react-auth";

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAuthenticating: boolean; // True if Privy is loading its initial state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const { ready, authenticated, user } = usePrivy();

  const { login } = useLogin();
  const { logout } = useLogout();

  const isAuthenticated = useMemo(
    () => ready && authenticated,
    [ready, authenticated]
  );
  const isAuthenticating = useMemo(() => !ready, [ready]);

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
