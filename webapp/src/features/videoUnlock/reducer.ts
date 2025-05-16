import type {
  GroupNode,
  AccessControlState,
} from "@/features/accessControl/types";
import type { VideoMetadata } from "@/types";
import { formatMoney, USDCWeiToUSD } from "@/utils/currency";
import type { UnlockOption } from "./types";

export type UnlockState = {
  selectedOption: UnlockOption | null;
  isProcessing: boolean;
};

export type UnlockAction =
  | { type: "SELECT_OPTION"; payload: UnlockOption }
  | { type: "RESET_OPTION" }
  | { type: "SET_PROCESSING"; payload: boolean };

export const initialState: UnlockState = {
  selectedOption: null,
  isProcessing: false,
};

export function unlockReducer(
  state: UnlockState,
  action: UnlockAction
): UnlockState {
  switch (action.type) {
    case "SELECT_OPTION":
      return {
        ...state,
        selectedOption: action.payload,
      };
    case "RESET_OPTION":
      return {
        ...state,
        selectedOption: null,
      };
    case "SET_PROCESSING":
      return {
        ...state,
        isProcessing: action.payload,
      };
    default:
      return state;
  }
}

/**
 * Extracts unlock options from access control and video metadata
 * @param accessControl - The access control state
 * @param metadata - The video metadata
 * @returns Array of unlock options
 */
export function extractUnlockOptions(
  accessControl: AccessControlState,
  metadata: VideoMetadata
): UnlockOption[] {
  const options: UnlockOption[] = [
    // Add token-based options from access control
    ...(accessControl
      .filter((node): node is GroupNode => node.type === "group")
      .find((node) => node.id === "inner-group")
      ?.rules.filter((rule): rule is GroupNode => rule.type === "group")
      .find((rule) => rule.id === "user-group")
      ?.rules.filter((group): group is GroupNode => group.type === "group")
      .map((group) => {
        const tokenRule = group.rules.find((rule) => rule.type === "token");
        return {
          id: group.id,
          type: "token" as const,
          title: "Token Access",
          description: `Access with ${tokenRule?.subtype || "token"}`,
          contractAddress: tokenRule?.contract,
          tokenDetails: {
            type: tokenRule?.subtype || "token",
            amount: tokenRule?.numTokens,
          },
        };
      }) || []),
  ];

  // Add payment option if video has a price
  if (BigInt(metadata.price.amount) > 0n) {
    options.push({
      id: "payment",
      type: "payment" as const,
      title: "Purchase Video",
      description: `Buy this video for ${formatMoney(
        USDCWeiToUSD(BigInt(metadata.price.amount))
      )} USDC`,
      price: BigInt(metadata.price.amount),
    });
  }

  return options;
}
