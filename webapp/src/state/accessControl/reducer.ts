import type {
  AccessControlNode,
  AccessControlState,
  LogicalOperator,
  RuleNode,
  GroupNode,
  OperatorNode,
} from "./types";

/**
 * Initial state for the access control builder
 * Starts with one empty group
 */
export const initialState: AccessControlState = [];

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
    // If it's in the middle, remove it and both surrounding operators (if they exist)
    const prevIsOperator = state[index - 1]?.type === "operator";
    const nextIsOperator = state[index + 1]?.type === "operator";
    newState.splice(
      prevIsOperator ? index - 1 : index,
      prevIsOperator && nextIsOperator
        ? 3
        : prevIsOperator || nextIsOperator
        ? 2
        : 1
    );
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
      newState = [
        ...state,
        {
          type: "group",
          id: crypto.randomUUID(),
          rules: [],
        } as GroupNode,
      ];
      // Add operator if there are multiple groups
      if (state.length > 0) {
        newState.push({
          type: "operator",
          id: crypto.randomUUID(),
          operator: "and",
        } as OperatorNode);
      }
      console.log("[Reducer] State after adding group:", newState);
      break;

    case "REMOVE_GROUP":
      console.log("[Reducer] Removing group:", action.groupId);
      newState = removeNodeWithOperators(state, action.groupId);
      console.log("[Reducer] State after removing group:", newState);
      break;

    case "ADD_RULE":
      console.log("[Reducer] Adding rule:", action);
      newState = state.map((node: AccessControlNode) => {
        if (node.type === "group" && node.id === action.groupId) {
          const updatedGroup = {
            ...node,
            rules: [
              ...node.rules,
              {
                id: crypto.randomUUID(),
                ...action.rule,
              } as RuleNode,
            ],
          } as GroupNode;
          // Add operator if there are multiple rules
          if (node.rules.length > 0) {
            updatedGroup.rules.push({
              type: "operator",
              id: crypto.randomUUID(),
              operator: "and",
            } as OperatorNode);
          }
          return updatedGroup;
        }
        return node;
      });
      console.log("[Reducer] State after adding rule:", newState);
      break;

    case "REMOVE_RULE":
      console.log("[Reducer] Removing rule:", action);
      newState = state.map((node: AccessControlNode) => {
        if (node.type === "group" && node.id === action.groupId) {
          return {
            ...node,
            rules: removeNodeWithOperators(node.rules, action.ruleId),
          } as GroupNode;
        }
        return node;
      });
      console.log("[Reducer] State after removing rule:", newState);
      break;

    case "UPDATE_RULE":
      console.log("[Reducer] Updating rule:", action);
      newState = state.map((node: AccessControlNode) => {
        if (node.type === "group" && node.id === action.groupId) {
          return {
            ...node,
            rules: node.rules.map((rule) =>
              rule.type !== "operator" && rule.id === action.ruleId
                ? { ...rule, ...action.updates }
                : rule
            ),
          } as GroupNode;
        }
        return node;
      });
      console.log("[Reducer] State after updating rule:", newState);
      break;

    case "UPDATE_OPERATOR":
      console.log("[Reducer] Updating operator:", action);
      newState = state.map((node: AccessControlNode) =>
        node.type === "operator" && node.id === action.operatorId
          ? ({ ...node, operator: action.operator } as OperatorNode)
          : node
      );
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

/**
 * Action types for the access control reducer
 */
export type AccessControlAction =
  | { type: "ADD_GROUP" }
  | { type: "REMOVE_GROUP"; groupId: string }
  | { type: "ADD_RULE"; groupId: string; rule: Omit<RuleNode, "id"> }
  | { type: "REMOVE_RULE"; groupId: string; ruleId: string }
  | {
      type: "UPDATE_RULE";
      groupId: string;
      ruleId: string;
      updates: Partial<RuleNode>;
    }
  | {
      type: "UPDATE_OPERATOR";
      operatorId: string;
      operator: LogicalOperator;
    };
