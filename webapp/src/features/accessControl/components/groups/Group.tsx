import React, { useState } from "react";
import { useAccessControl } from "@/contexts/AccessControlContext";
import type {
  GroupNode,
  RuleNode,
  LogicalOperator,
  ERC20Rule,
} from "@/state/accessControl/types";
import { Operator } from "../operators/Operator";
import { RuleNode as RuleNodeComponent } from "../rules/RuleNode";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AddRuleSlideover } from "../AddRuleSlideover";
import { RuleList } from "../RuleList";

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
  const [editingRule, setEditingRule] = useState<ERC20Rule | undefined>(
    undefined
  );

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

  // Handler for saving a rule (add or update)
  const handleSaveRule = (rule: ERC20Rule, groupId: string) => {
    if (editingRule) {
      dispatch({
        type: "UPDATE_RULE",
        groupId,
        ruleId: rule.id,
        updates: rule,
      });
    } else {
      // Don't include id when adding
      const ruleWithoutId = { ...rule, id: undefined };
      delete ruleWithoutId.id;
      dispatch({
        type: "ADD_RULE",
        groupId,
        rule: ruleWithoutId,
      });
    }
    setEditingRule(undefined);
    setSlideoverOpen(false);
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
            // Filter ERC20 rules
            const erc20Rules = node.rules.filter(
              (r): r is ERC20Rule => r.type === "token" && r.subtype === "ERC20"
            );
            return (
              <div
                key={node.id}
                className="relative rounded-lg border border-gray-200 bg-gray-50"
              >
                <div className="flex">
                  <div className="flex-1 p-4">
                    <div className="space-y-4">
                      {/* Rule List */}
                      <RuleList
                        rules={erc20Rules}
                        onEdit={(rule) => {
                          setEditingRule(rule);
                          setSlideoverOpen(true);
                        }}
                      />
                    </div>
                    <div className="relative mt-4">
                      <button
                        onClick={() => {
                          setEditingRule(undefined);
                          setSlideoverOpen(true);
                        }}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        Add Rule
                      </button>
                      {/* Slideover for add/edit rule */}
                      <AddRuleSlideover
                        open={slideoverOpen}
                        onClose={() => {
                          setEditingRule(undefined);
                          setSlideoverOpen(false);
                        }}
                        onSave={(rule) => handleSaveRule(rule, node.id)}
                        initialRule={editingRule}
                      />
                    </div>
                  </div>
                  <div className="flex items-center border-l border-gray-200 bg-gray-100">
                    <button
                      onClick={() => handleRemoveGroup(node.id)}
                      className="flex h-full w-full items-center justify-center rounded-r-lg text-gray-400 hover:bg-gray-200 hover:text-gray-500"
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
