"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AccessControlProvider } from "@/contexts/AccessControlContext";
import UploadForm from "@/components/upload/UploadForm";

export default function UploadPage() {
  const {
    isLoading: authLoading,
    isAuthenticated,
    LoadingComponent,
  } = useRequireAuth();

  if (authLoading && LoadingComponent) {
    return <LoadingComponent />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <AccessControlProvider>
      <UploadForm />
    </AccessControlProvider>
  );
}
