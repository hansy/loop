import { VideoMetadata } from "@/types";

export interface UnlockOption {
  id: string;
  type: "token" | "payment";
  title: string;
  description: string;
  price?: bigint;
  contractAddress?: string;
  tokenDetails?: {
    type: string;
    amount?: number;
  };
}

export type PurchaseStatus =
  | "idle"
  | "validating"
  | "purchasing"
  | "success"
  | "error";

export interface UnlockHandlers {
  onUnlockSuccess: (option: UnlockOption) => void;
  onUnlockError: (error: string) => void;
}

export interface UnlockWizardProps {
  metadata: VideoMetadata;
  handlers: UnlockHandlers;
  onStepChange: (step: "options" | "unlock") => void;
  currentStep: "options" | "unlock";
  hasEmbeddedWallet: boolean;
}

export interface VideoUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: VideoMetadata;
  handlers: UnlockHandlers;
  hasEmbeddedWallet: boolean;
}
