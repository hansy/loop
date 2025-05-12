import React from "react";
import type { RuleNode } from "@/state/accessControl/types";
import { RuleSummary } from "./RuleSummary";

/**
 * RuleList
 *
 * Renders a list of access control rules as summaries.
 * Props:
 *   rules: RuleNode[] - array of rules to display
 *   onEdit: (rule: RuleNode) => void - called when a rule is clicked for editing
 *   onRemove: (rule: RuleNode) => void - called when a rule's remove button is clicked
 */
export function RuleList({
  rules,
  onEdit,
  onRemove,
}: {
  rules: RuleNode[];
  onEdit: (rule: RuleNode) => void;
  onRemove: (rule: RuleNode) => void;
}) {
  return (
    <div className="space-y-2">
      {rules.map((rule) => (
        <RuleSummary
          key={rule.id}
          rule={rule}
          onClick={() => onEdit(rule)}
          onRemove={() => onRemove(rule)}
        />
      ))}
    </div>
  );
}
