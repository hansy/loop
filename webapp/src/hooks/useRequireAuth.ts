import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AuthLoading from "@/components/auth/AuthLoading";

interface AuthResult {
  isLoading: boolean;
  isAuthenticated: boolean;
  LoadingComponent?: typeof AuthLoading;
}

export function useRequireAuth(): AuthResult {
  const { isAuthenticated, isAuthenticating } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticating && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isAuthenticating, router]);

  if (isAuthenticating) {
    return {
      isLoading: true,
      isAuthenticated: false,
      LoadingComponent: AuthLoading,
    };
  }

  return {
    isLoading: false,
    isAuthenticated,
  };
}
