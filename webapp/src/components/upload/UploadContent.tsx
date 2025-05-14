"use client";

import { AccessControlProvider } from "@/contexts/AccessControlContext";
import UploadForm from "@/components/upload/UploadForm";

/**
 * UploadContent component displays the upload page content
 * This is a client component that handles the interactive parts of the upload page
 */
export default function UploadContent() {
  return (
    <AccessControlProvider>
      <UploadForm />
    </AccessControlProvider>
  );
}
