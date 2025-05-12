import React, { useState } from "react";
import { useAccessControl } from "@/contexts/AccessControlContext";
import type {
  GroupNode,
  RuleNode,
  LogicalOperator,
  PaywallRule,
  TokenRule,
} from "@/state/accessControl/types";
import { Operator } from "../operators/Operator";
import { RuleNode as RuleNodeComponent } from "../rules/RuleNode";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface GroupProps {
  group: GroupNode;
}

/**
 * Component for rendering and managing a group of rules
 * All groups rendered by this component are editable since they are within the user-group
 */
export function Group({ group }: GroupProps) {
  const { dispatch } = useAccessControl();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAddRule = (rule: Omit<RuleNode, "id">, targetGroupId: string) => {
    console.log("[Group] Adding rule:", { groupId: targetGroupId, rule });
    dispatch({
      type: "ADD_RULE",
      groupId: targetGroupId,
      rule,
    });
    setIsDropdownOpen(false);
  };

  const handleRemoveGroup = (groupId: string) => {
    console.log("[Group] Removing group:", groupId);
    dispatch({
      type: "REMOVE_GROUP",
      groupId,
    });
  };

  const handleUpdateRule = (
    groupId: string,
    ruleId: string,
    updates: Partial<RuleNode>
  ) => {
    console.log("[Group] Updating rule:", {
      groupId,
      ruleId,
      updates,
    });
    dispatch({
      type: "UPDATE_RULE",
      groupId,
      ruleId,
      updates,
    });
  };

  const handleRemoveRule = (groupId: string, ruleId: string) => {
    console.log("[Group] Removing rule:", { groupId, ruleId });
    dispatch({
      type: "REMOVE_RULE",
      groupId,
      ruleId,
    });
  };

  const handleUpdateOperator = (
    operatorId: string,
    operator: LogicalOperator,
    targetGroupId: string
  ) => {
    console.log("[Group] Updating operator:", {
      operatorId,
      operator,
      targetGroupId,
    });
    dispatch({
      type: "UPDATE_OPERATOR",
      groupId: targetGroupId,
      operatorId,
      operator,
    });
  };

  // If this is the user-group, just render its contents
  if (group.id === "user-group") {
    return (
      <div className="space-y-4">
        {group.rules.map((node) => {
          if (node.type === "operator") {
            return (
              <Operator
                key={node.id}
                operator={node.operator}
                onChange={(operator) =>
                  handleUpdateOperator(node.id, operator, "user-group")
                }
              />
            );
          } else if (node.type === "group") {
            return (
              <div
                key={node.id}
                className="relative rounded-lg border border-gray-200 bg-gray-50"
              >
                <div className="flex">
                  <div className="flex-1 p-4">
                    <div className="space-y-4">
                      {node.rules.map((ruleNode) => {
                        if (ruleNode.type === "operator") {
                          return (
                            <Operator
                              key={ruleNode.id}
                              operator={ruleNode.operator}
                              onChange={(operator) =>
                                handleUpdateOperator(
                                  ruleNode.id,
                                  operator,
                                  node.id
                                )
                              }
                            />
                          );
                        } else {
                          return (
                            <RuleNodeComponent
                              key={ruleNode.id}
                              rule={ruleNode as RuleNode}
                              onUpdate={(updates) =>
                                handleUpdateRule(node.id, ruleNode.id, updates)
                              }
                              onRemove={() =>
                                handleRemoveRule(node.id, ruleNode.id)
                              }
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
                              handleAddRule(
                                {
                                  type: "paywall",
                                  chain: "ethereum",
                                } as PaywallRule,
                                node.id
                              )
                            }
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Add Paywall Rule
                          </button>
                          <button
                            onClick={() =>
                              handleAddRule(
                                {
                                  type: "token",
                                  subtype: "ERC20",
                                  chain: "ethereum",
                                  contract: "",
                                  numTokens: 0,
                                } as TokenRule,
                                node.id
                              )
                            }
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Add Token Rule
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center border-l border-gray-200 bg-gray-100">
                    <button
                      onClick={() => handleRemoveGroup(node.id)}
                      className="flex h-full w-full items-center justify-center rounded-r-lg text-gray-400 hover:bg-gray-200 hover:text-gray-500"
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
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  // For regular groups, render with container
  return (
    <div className="relative rounded-lg border border-gray-200 bg-white">
      <div className="flex">
        <div className="flex-1 p-4">
          <div className="space-y-4">
            {group.rules.map((node) => {
              if (node.type === "operator") {
                return (
                  <Operator
                    key={node.id}
                    operator={node.operator}
                    onChange={(operator) =>
                      handleUpdateOperator(node.id, operator, group.id)
                    }
                  />
                );
              } else {
                return (
                  <RuleNodeComponent
                    key={node.id}
                    rule={node as RuleNode}
                    onUpdate={(updates) =>
                      handleUpdateRule(group.id, node.id, updates)
                    }
                    onRemove={() => handleRemoveRule(group.id, node.id)}
                  />
                );
              }
            })}
          </div>
        </div>
        <div className="flex items-center border-l border-gray-200 bg-gray-100 px-2">
          <button
            onClick={() => handleRemoveGroup(group.id)}
            className="flex h-full w-full items-center justify-center rounded-r-lg text-gray-400 hover:bg-gray-200 hover:text-gray-500 px-4"
            aria-label="Remove group"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
