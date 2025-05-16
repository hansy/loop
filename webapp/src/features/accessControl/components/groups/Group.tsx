import React, { useState } from "react";
import { useAccessControl } from "@/contexts/AccessControlContext";
import type {
  GroupNode,
  RuleNode,
  LogicalOperator,
} from "@/features/accessControl/types";
import { Operator } from "../operators/Operator";
import { RuleNode as RuleNodeComponent } from "../rules/RuleNode";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AddRuleSlideover } from "../AddRuleSlideover";
import { RuleSummary } from "../RuleSummary";

interface GroupProps {
  group: GroupNode;
}

/**
 * Component for rendering and managing a group of rules
 * All groups rendered by this component are editable since they are within the user-group
 */
export function Group({ group }: GroupProps) {
  const { dispatch } = useAccessControl();
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleNode | undefined>(
    undefined
  );
  const [editingGroupId, setEditingGroupId] = useState<string | undefined>(
    undefined
  );

  const handleRemoveGroup = (groupId: string) => {
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
    dispatch({
      type: "UPDATE_RULE",
      groupId,
      ruleId,
      updates,
    });
  };

  const handleRemoveRule = (groupId: string, ruleId: string) => {
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
    dispatch({
      type: "UPDATE_OPERATOR",
      groupId: targetGroupId,
      operatorId,
      operator,
    });
  };

  // Handler for saving a rule (add or update)
  const handleSaveRule = (rule: RuleNode) => {
    if (!editingGroupId) {
      console.error("[Group] No editing group ID found");
      return;
    }

    if (editingRule) {
      dispatch({
        type: "UPDATE_RULE",
        groupId: editingGroupId,
        ruleId: editingRule.id,
        updates: rule,
      });
    } else {
      // Don't include id when adding
      const ruleWithoutId = { ...rule, id: undefined };
      delete ruleWithoutId.id;
      dispatch({
        type: "ADD_RULE",
        groupId: editingGroupId,
        rule: ruleWithoutId,
      });
    }
    setEditingRule(undefined);
    setEditingGroupId(undefined);
    setSlideoverOpen(false);
  };

  // For user groups, render with container and add/edit functionality
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
                  handleUpdateOperator(node.id, operator, group.id)
                }
              />
            );
          } else if (node.type === "group") {
            return (
              <div
                key={node.id}
                className="relative rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex">
                  <div className="flex-1 p-4">
                    <div className="space-y-4">
                      {/* Render all nodes in the group */}
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
                        } else if (ruleNode.type !== "group") {
                          return (
                            <RuleSummary
                              key={ruleNode.id}
                              rule={ruleNode}
                              onClick={() => {
                                setEditingRule(ruleNode);
                                setEditingGroupId(node.id);
                                setSlideoverOpen(true);
                              }}
                              onRemove={() =>
                                handleRemoveRule(node.id, ruleNode.id)
                              }
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRule(undefined);
                          setEditingGroupId(node.id);
                          setSlideoverOpen(true);
                        }}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center border-l border-gray-200 bg-gray-100">
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(node.id)}
                      className="flex h-full w-full items-center justify-center rounded-r-lg text-gray-400 hover:bg-gray-200 hover:text-gray-500 px-4 "
                      aria-label="Remove group"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
        {/* Single shared slideover for all groups */}
        <AddRuleSlideover
          open={slideoverOpen}
          onClose={() => {
            setEditingRule(undefined);
            setEditingGroupId(undefined);
            setSlideoverOpen(false);
          }}
          onSave={handleSaveRule}
          initialRule={editingRule}
        />
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
            type="button"
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
