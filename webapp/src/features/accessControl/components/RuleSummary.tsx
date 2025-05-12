import React from "react";
import type { ERC20Rule } from "@/state/accessControl/types";

/**
 * RuleSummary
 *
 * Renders a standardized summary for a given ERC20 access control rule.
 * Props:
 *   rule: ERC20Rule - the rule to summarize
 *   onClick?: () => void - optional click handler (for editing)
 */
export function RuleSummary({
  rule,
  onClick,
}: {
  rule: ERC20Rule;
  onClick?: () => void;
}) {
  return (
    <div className={onClick ? "cursor-pointer" : undefined} onClick={onClick}>
      <span>
        Requires at least <b>{rule.numTokens}</b> of <b>{rule.contract}</b> on{" "}
        <b>{rule.chain}</b>
      </span>
    </div>
  );
}
