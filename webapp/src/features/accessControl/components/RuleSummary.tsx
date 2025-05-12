import React from "react";
import type { RuleNode } from "@/state/accessControl/types";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { truncateString } from "@/lib/common/utils/truncateString";

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

  return (
    <div
      className={`group flex items-center justify-between rounded-lg border px-3 py-2 ${getRuleColor()} ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex-1">
        {rule.type === "token" && (
          <span>
            Requires {rule.subtype === "ERC20" ? "at least " : ""}
            <b>{rule.numTokens}</b> of{" "}
            <b>{truncateString(rule.contract, 6, 4)}</b> on <b>{rule.chain}</b>
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
            Requires payment on <b>{rule.chain}</b>
          </span>
        )}
        {rule.type === "owner" && (
          <span>
            Requires ownership of <b>{truncateString(rule.contract, 6, 4)}</b>{" "}
            on <b>{rule.chain}</b>
            {getTokenId(rule) && <span> (Token ID: {getTokenId(rule)})</span>}
          </span>
        )}
        {rule.type === "litAction" && (
          <span>Requires Lit Action execution</span>
        )}
      </div>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-2 rounded-full p-1 hover:bg-white/20"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
