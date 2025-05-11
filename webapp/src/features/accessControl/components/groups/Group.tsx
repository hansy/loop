import React, { useState } from "react";
import { useAccessControl } from "@/contexts/AccessControlContext";
import type {
  GroupNode,
  RuleNode,
  LogicalOperator,
  PaywallRule,
  LitActionRule,
  TokenRule,
} from "@/state/accessControl/types";
import { Operator } from "../operators/Operator";
import { RuleNode as RuleNodeComponent } from "../rules/RuleNode";

interface GroupProps {
  group: GroupNode;
}

/**
 * Component for rendering and managing a group of rules
 */
export function Group({ group }: GroupProps) {
  const { dispatch } = useAccessControl();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAddRule = (rule: Omit<RuleNode, "id">) => {
    console.log("[Group] Adding rule:", { groupId: group.id, rule });
    dispatch({
      type: "ADD_RULE",
      groupId: group.id,
      rule,
    });
    setIsDropdownOpen(false);
  };

  const handleRemoveGroup = () => {
    console.log("[Group] Removing group:", group.id);
    dispatch({
      type: "REMOVE_GROUP",
      groupId: group.id,
    });
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<RuleNode>) => {
    console.log("[Group] Updating rule:", {
      groupId: group.id,
      ruleId,
      updates,
    });
    dispatch({
      type: "UPDATE_RULE",
      groupId: group.id,
      ruleId,
      updates,
    });
  };

  const handleRemoveRule = (ruleId: string) => {
    console.log("[Group] Removing rule:", { groupId: group.id, ruleId });
    dispatch({
      type: "REMOVE_RULE",
      groupId: group.id,
      ruleId,
    });
  };

  const handleUpdateOperator = (
    operatorId: string,
    operator: LogicalOperator
  ) => {
    console.log("[Group] Updating operator:", { operatorId, operator });
    dispatch({
      type: "UPDATE_OPERATOR",
      operatorId,
      operator,
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-end">
        <button
          onClick={handleRemoveGroup}
          className="rounded-md bg-white p-2 text-gray-400 hover:text-gray-500"
          aria-label="Remove group"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {group.rules.map((node) => {
          if (node.type === "operator") {
            return (
              <Operator
                key={node.id}
                operator={node.operator}
                onChange={(operator) => handleUpdateOperator(node.id, operator)}
              />
            );
          } else {
            return (
              <RuleNodeComponent
                key={node.id}
                rule={node as RuleNode}
                onUpdate={(updates) => handleUpdateRule(node.id, updates)}
                onRemove={() => handleRemoveRule(node.id)}
              />
            );
          }
        })}
      </div>

      <div className="relative mt-4">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Add Rule
        </button>

        {isDropdownOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
            <button
              onClick={() =>
                handleAddRule({
                  type: "paywall",
                  chain: "ethereum",
                  amount: BigInt(0),
                } as PaywallRule)
              }
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Add Paywall Rule
            </button>
            <button
              onClick={() =>
                handleAddRule({
                  type: "litAction",
                } as LitActionRule)
              }
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Add Lit Action Rule
            </button>
            <button
              onClick={() =>
                handleAddRule({
                  type: "token",
                  subtype: "ERC20",
                  chain: "ethereum",
                  contract: "",
                  tokenNum: 0,
                } as TokenRule)
              }
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Add Token Rule
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
