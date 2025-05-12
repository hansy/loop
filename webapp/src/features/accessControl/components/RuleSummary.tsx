import React from "react";
import type { RuleNode } from "@/state/accessControl/types";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { truncateString } from "@/lib/common/utils/truncateString";

/**
 * Maps chain values to their display names
 */
const CHAIN_DISPLAY_NAMES: Record<string, string> = {
  ethereum: "Ethereum",
  polygon: "Polygon",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  base: "Base",
};

/**
 * Gets the display name for a chain value
 */
function getChainDisplayName(chainValue: string): string {
  return CHAIN_DISPLAY_NAMES[chainValue] || chainValue;
}

/**
 * RuleSummary
 *
 * Renders a standardized summary for a given access control rule.
 * Props:
 *   rule: RuleNode - the rule to summarize
 *   onClick?: () => void - optional click handler (for editing)
 *   onRemove?: () => void - optional remove handler
 */
export function RuleSummary({
  rule,
  onClick,
  onRemove,
}: {
  rule: RuleNode;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  // Get color based on rule type
  const getRuleColor = () => {
    switch (rule.type) {
      case "token":
        return "bg-green-50 border-green-200 text-green-700";
      case "paywall":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "owner":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "litAction":
        return "bg-orange-50 border-orange-200 text-orange-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  // Helper to safely get tokenId
  const getTokenId = (rule: RuleNode): string | undefined => {
    if ("tokenId" in rule && typeof rule.tokenId === "string") {
      return rule.tokenId;
    }
    return undefined;
  };

  // Pick a green shade for the remove section if the rule is a token, else fallback to gray
  const getRemoveSectionColor = () => {
    switch (rule.type) {
      case "token":
        return "bg-green-100 border-green-200 hover:bg-green-200";
      case "paywall":
        return "bg-blue-100 border-blue-200 hover:bg-blue-200";
      case "owner":
        return "bg-purple-100 border-purple-200 hover:bg-purple-200";
      case "litAction":
        return "bg-orange-100 border-orange-200 hover:bg-orange-200";
      default:
        return "bg-gray-100 border-gray-200 hover:bg-gray-200";
    }
  };

  // Pick a green for the X icon if token, else fallback
  const getRemoveIconColor = () => {
    switch (rule.type) {
      case "token":
        return "text-green-600 group-hover:text-green-800";
      case "paywall":
        return "text-blue-600 group-hover:text-blue-800";
      case "owner":
        return "text-purple-600 group-hover:text-purple-800";
      case "litAction":
        return "text-orange-600 group-hover:text-orange-800";
      default:
        return "text-gray-400 group-hover:text-gray-600";
    }
  };

  return (
    <div className="flex w-full mb-4">
      <div
        className={`flex-1 rounded-l-lg border ${getRuleColor()} ${
          onClick ? "cursor-pointer hover:opacity-80" : ""
        } px-3 py-2 flex items-center`}
        onClick={onClick}
      >
        {rule.type === "token" && (
          <span>
            Requires {rule.subtype === "ERC20" ? "at least " : ""}
            <b>{rule.numTokens}</b> of{" "}
            <b>{truncateString(rule.contract, 6, 4)}</b> on{" "}
            <b>{getChainDisplayName(rule.chain)}</b>
            {rule.subtype === "ERC721" && getTokenId(rule) && (
              <span> (Token ID: {getTokenId(rule)})</span>
            )}
            {rule.subtype === "ERC1155" && getTokenId(rule) && (
              <span> (Token ID: {getTokenId(rule)})</span>
            )}
          </span>
        )}
        {rule.type === "paywall" && (
          <span>
            Requires payment on <b>{getChainDisplayName(rule.chain)}</b>
          </span>
        )}
        {rule.type === "owner" && (
          <span>
            Requires ownership of <b>{truncateString(rule.contract, 6, 4)}</b>{" "}
            on <b>{getChainDisplayName(rule.chain)}</b>
            {getTokenId(rule) && <span> (Token ID: {getTokenId(rule)})</span>}
          </span>
        )}
        {rule.type === "litAction" && (
          <span>Requires Lit Action execution</span>
        )}
      </div>
      {onRemove && (
        <div
          className={`flex items-center border-l ${getRemoveSectionColor()} rounded-r-lg`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors group"
            aria-label="Remove rule"
          >
            <XMarkIcon className={`h-5 w-5 ${getRemoveIconColor()}`} />
          </button>
        </div>
      )}
    </div>
  );
}
