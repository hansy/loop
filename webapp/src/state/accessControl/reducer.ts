import type {
  AccessControlNode,
  AccessControlState,
  RuleNode,
  GroupNode,
  OperatorNode,
  AccessControlAction,
  LitActionRule,
} from "./types";

/**
 * Initial state for the access control builder
 * Creates the fixed structure with litAction and owner rules
 */
export const initialState: AccessControlState = [
  {
    type: "litAction",
    id: "lit-action-rule",
  } as LitActionRule,
  {
    type: "operator",
    id: "outer-operator",
    operator: "and",
  } as OperatorNode,
  {
    type: "group",
    id: "inner-group",
    rules: [
      {
        type: "owner",
        id: "owner-rule",
        chain: "ethereum",
        contract: "",
        tokenNum: 0,
      },
      {
        type: "operator",
        id: "inner-operator",
        operator: "or",
      } as OperatorNode,
      {
        type: "group",
        id: "user-group",
        rules: [],
      } as GroupNode,
    ],
  } as GroupNode,
];

/**
 * Helper function to remove a node and its surrounding operators
 * Handles cases where the node is at the start, end, or middle of the array
 */
function removeNodeWithOperators(
  state: AccessControlState,
  nodeId: string
): AccessControlState {
  console.log("[Reducer] Removing node with operators:", { nodeId, state });
  const index = state.findIndex((node) => node.id === nodeId);
  if (index === -1) return state;

  const newState = [...state];
  const isFirst = index === 0;
  const isLast = index === state.length - 1;

  // Remove the node and its surrounding operators
  if (isFirst) {
    // If it's the first node, remove it and the operator after it (if it exists)
    newState.splice(0, state[1]?.type === "operator" ? 2 : 1);
  } else if (isLast) {
    // If it's the last node, remove it and the operator before it (if it exists)
    newState.splice(
      state[index - 1]?.type === "operator" ? index - 1 : index,
      state[index - 1]?.type === "operator" ? 2 : 1
    );
  } else {
    // If it's in the middle, remove the node and the operator after it
    // This keeps the operator before the node to maintain the connection
    const nextIsOperator = state[index + 1]?.type === "operator";
    newState.splice(index, nextIsOperator ? 2 : 1);
  }

  console.log("[Reducer] After removing node:", newState);
  return newState;
}

/**
 * Helper function to clean up operators in the state
 * Ensures operators are only between groups and removes any orphaned operators
 */
function cleanupOperators(state: AccessControlState): AccessControlState {
  console.log("[Reducer] Cleaning up operators:", state);
  const newState = [...state];

  // Remove operators from start and end
  while (newState.length > 0 && newState[0].type === "operator") {
    newState.shift();
  }
  while (
    newState.length > 0 &&
    newState[newState.length - 1].type === "operator"
  ) {
    newState.pop();
  }

  // Remove consecutive operators and ensure operators are only between groups
  for (let i = 0; i < newState.length - 1; i++) {
    if (
      newState[i].type === "operator" &&
      newState[i + 1].type === "operator"
    ) {
      newState.splice(i, 1);
      i--;
    }
  }

  console.log("[Reducer] After cleanup:", newState);
  return newState;
}

/**
 * Helper function to add a node with its operator
 * Handles cases where the node is being added at the start, end, or middle
 */
function addNodeWithOperator(
  state: AccessControlState,
  newNode: AccessControlNode,
  index?: number
): AccessControlState {
  console.log("[Reducer] Adding node with operator:", {
    newNode,
    index,
    state,
  });
  const newState = [...state];
  const isFirst = index === 0;
  const isLast = index === undefined || index === state.length;

  // If adding to the beginning
  if (isFirst) {
    newState.unshift(newNode);
    if (state.length > 0) {
      newState.splice(1, 0, {
        type: "operator",
        id: crypto.randomUUID(),
        operator: "and",
      } as OperatorNode);
    }
  }
  // If adding to the end
  else if (isLast) {
    if (state.length > 0) {
      newState.push({
        type: "operator",
        id: crypto.randomUUID(),
        operator: "and",
      } as OperatorNode);
    }
    newState.push(newNode);
  }
  // If adding to the middle
  else {
    const insertIndex = index!;
    // Add operator before the new node
    newState.splice(insertIndex, 0, {
      type: "operator",
      id: crypto.randomUUID(),
      operator: "and",
    } as OperatorNode);
    // Add the new node
    newState.splice(insertIndex + 1, 0, newNode);
  }

  console.log("[Reducer] After adding node:", newState);
  return newState;
}

/**
 * Reducer for managing access control state
 * Handles adding/removing groups and rules, updating operators, and cleaning up state
 */
export function accessControlReducer(
  state: AccessControlState,
  action: AccessControlAction
): AccessControlState {
  console.log("[Reducer] Processing action:", action);
  let newState: AccessControlState;

  switch (action.type) {
    case "ADD_GROUP":
      console.log("[Reducer] Adding group");
      // Only allow adding groups to the user-editable group
      newState = state.map((node) => {
        if (node.type === "group" && node.id === "inner-group") {
          return {
            ...node,
            rules: node.rules.map((rule) => {
              if (rule.type === "group" && rule.id === "user-group") {
                const newGroup = {
                  type: "group",
                  id: crypto.randomUUID(),
                  rules: [],
                } as GroupNode;
                return {
                  ...rule,
                  rules: addNodeWithOperator(
                    rule.rules,
                    newGroup,
                    action.index
                  ),
                };
              }
              return rule;
            }),
          };
        }
        return node;
      });
      console.log("[Reducer] State after adding group:", newState);
      break;

    case "REMOVE_GROUP":
      console.log("[Reducer] Removing group:", action.groupId);
      // Only allow removing groups from the user-editable group
      newState = state.map((node) => {
        if (node.type === "group" && node.id === "inner-group") {
          return {
            ...node,
            rules: node.rules.map((rule) => {
              if (rule.type === "group" && rule.id === "user-group") {
                return {
                  ...rule,
                  rules: removeNodeWithOperators(rule.rules, action.groupId),
                };
              }
              return rule;
            }),
          };
        }
        return node;
      });
      console.log("[Reducer] State after removing group:", newState);
      break;

    case "ADD_RULE":
      console.log("[Reducer] Adding rule:", action);
      // Add rules to the specified group within user-group
      newState = state.map((node) => {
        if (node.type === "group" && node.id === "inner-group") {
          return {
            ...node,
            rules: node.rules.map((rule) => {
              if (rule.type === "group" && rule.id === "user-group") {
                return {
                  ...rule,
                  rules: rule.rules.map((group) => {
                    if (group.type === "group" && group.id === action.groupId) {
                      const newRule = {
                        id: crypto.randomUUID(),
                        ...action.rule,
                      } as RuleNode;
                      return {
                        ...group,
                        rules: addNodeWithOperator(
                          group.rules,
                          newRule,
                          action.index
                        ),
                      };
                    }
                    return group;
                  }),
                };
              }
              return rule;
            }),
          };
        }
        return node;
      });
      console.log("[Reducer] State after adding rule:", newState);
      break;

    case "REMOVE_RULE":
      console.log("[Reducer] Removing rule:", action);
      // Remove rules from the specified group within user-group
      newState = state.map((node) => {
        if (node.type === "group" && node.id === "inner-group") {
          return {
            ...node,
            rules: node.rules.map((rule) => {
              if (rule.type === "group" && rule.id === "user-group") {
                return {
                  ...rule,
                  rules: rule.rules.map((group) => {
                    if (group.type === "group" && group.id === action.groupId) {
                      return {
                        ...group,
                        rules: removeNodeWithOperators(
                          group.rules,
                          action.ruleId
                        ),
                      };
                    }
                    return group;
                  }),
                };
              }
              return rule;
            }),
          };
        }
        return node;
      });
      console.log("[Reducer] State after removing rule:", newState);
      break;

    case "UPDATE_RULE":
      console.log("[Reducer] Updating rule:", action);
      // Only allow updating rules in the user-editable group
      newState = state.map((node) => {
        if (node.type === "group" && node.id === "inner-group") {
          return {
            ...node,
            rules: node.rules.map((rule) => {
              if (rule.type === "group" && rule.id === "user-group") {
                return {
                  ...rule,
                  rules: rule.rules.map((r) => {
                    if (r.type !== "operator" && r.id === action.ruleId) {
                      // Ensure we maintain the rule type when updating
                      return {
                        ...r,
                        ...action.updates,
                        type: r.type, // Preserve the original rule type
                        id: r.id, // Preserve the original rule id
                      } as RuleNode;
                    }
                    return r;
                  }),
                };
              }
              return rule;
            }),
          };
        }
        return node;
      });
      console.log("[Reducer] State after updating rule:", newState);
      break;

    case "UPDATE_OPERATOR":
      console.log("[Reducer] Updating operator:", action);
      // Update operators in the specified group within user-group
      newState = state.map((node) => {
        if (node.type === "group" && node.id === "inner-group") {
          return {
            ...node,
            rules: node.rules.map((rule) => {
              if (rule.type === "group" && rule.id === "user-group") {
                // If updating an operator in the user-group itself
                if (action.groupId === "user-group") {
                  return {
                    ...rule,
                    rules: rule.rules.map((r) =>
                      r.type === "operator" && r.id === action.operatorId
                        ? { ...r, operator: action.operator }
                        : r
                    ),
                  };
                }
                // If updating an operator in a nested group
                return {
                  ...rule,
                  rules: rule.rules.map((group) => {
                    if (group.type === "group" && group.id === action.groupId) {
                      return {
                        ...group,
                        rules: group.rules.map((r) =>
                          r.type === "operator" && r.id === action.operatorId
                            ? { ...r, operator: action.operator }
                            : r
                        ),
                      };
                    }
                    return group;
                  }),
                };
              }
              return rule;
            }),
          };
        }
        return node;
      });
      console.log("[Reducer] State after updating operator:", newState);
      break;

    default:
      console.log("[Reducer] Unknown action type:", action);
      return state;
  }

  // Clean up operators after any action
  newState = cleanupOperators(newState);
  console.log("[Reducer] Final state after cleanup:", newState);
  return newState;
}
