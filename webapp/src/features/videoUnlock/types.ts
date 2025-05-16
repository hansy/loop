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

export interface UnlockWizardProps {
  metadata: VideoMetadata;
  onUnlock: (type: "token" | "payment") => Promise<void>;
  onStepChange: (step: "options" | "unlock") => void;
  currentStep: "options" | "unlock";
}

export interface VideoUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: VideoMetadata;
  onUnlock: (type: "token" | "payment") => Promise<void>;
}
