import React, { useState } from "react";
import { useAccessControl } from "@/contexts/AccessControlContext";
import type {
  GroupNode,
  RuleNode,
  LogicalOperator,
  AccessControlNode,
  OperatorNode,
  TokenRule,
  PaywallRule,
  LitActionRule,
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
    dispatch({
      type: "ADD_RULE",
      groupId: group.id,
      rule,
    });
    setIsDropdownOpen(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex">
        <div className="flex-1 space-y-4">
          {group.rules.map((node: AccessControlNode, nodeIndex: number) => (
            <div key={nodeIndex}>
              {node.type === "token" ||
              node.type === "paywall" ||
              node.type === "litAction" ? (
                <RuleNodeComponent
                  rule={node}
                  onUpdate={(updates: Partial<RuleNode>) =>
                    dispatch({
                      type: "UPDATE_RULE",
                      ruleId: node.id,
                      updates,
                    })
                  }
                  onRemove={() =>
                    dispatch({
                      type: "REMOVE_RULE",
                      ruleId: node.id,
                    })
                  }
                />
              ) : node.type === "operator" ? (
                <Operator
                  operator={(node as OperatorNode).operator}
                  onChange={(operator: LogicalOperator) =>
                    dispatch({
                      type: "UPDATE_OPERATOR",
                      operatorId: node.id,
                      operator,
                    })
                  }
                />
              ) : null}
            </div>
          ))}

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Add Rule
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div
                  className="py-1"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="options-menu"
                >
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
                    role="menuitem"
                  >
                    Add Token Rule
                  </button>
                  <button
                    onClick={() =>
                      handleAddRule({
                        type: "paywall",
                        chain: "ethereum",
                        amount: BigInt(0),
                      } as PaywallRule)
                    }
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
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
                    role="menuitem"
                  >
                    Add Lit Action Rule
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-center bg-gray-100 rounded-r-lg -mr-4 -my-4 px-4">
          <button
            onClick={() =>
              dispatch({
                type: "REMOVE_GROUP",
                groupId: group.id,
              })
            }
            className="text-gray-400 hover:text-gray-500"
            aria-label="Remove group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
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
