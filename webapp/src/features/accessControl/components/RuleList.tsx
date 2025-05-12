import React from "react";
import type { ERC20Rule } from "@/state/accessControl/types";
import { RuleSummary } from "./RuleSummary";

/**
 * RuleList
 *
 * Renders a list of ERC20 access control rules as summaries.
 * Props:
 *   rules: ERC20Rule[] - array of rules to display
 *   onEdit: (rule: ERC20Rule) => void - called when a rule is clicked for editing
 */
export function RuleList({
  rules,
  onEdit,
}: {
  rules: ERC20Rule[];
  onEdit: (rule: ERC20Rule) => void;
}) {
  return (
    <div className="space-y-2">
      {rules.map((rule) => (
        <RuleSummary key={rule.id} rule={rule} onClick={() => onEdit(rule)} />
      ))}
    </div>
  );
}
