import { v4 as uuidv4 } from "uuid";
import type {
  AccessControlGroup,
  RuleNode,
  OperatorNode,
  LogicalOperator,
  PaywallRule,
  LitActionRule,
  ERC20Rule,
  ERC721Rule,
  ERC1155Rule,
  GroupNode,
  AccessControlNode,
} from "./types";

/**
 * Initial state for the access control builder
 * Starts with one empty group
 */
export const initialState: AccessControlGroup = [];

/**
 * Type guard to check if a node is a group
 */
const isGroup = (node: AccessControlNode): node is GroupNode => {
  return node.type === "group";
};

/**
 * Type guard to check if a node is an operator
 */
const isOperator = (node: AccessControlNode): node is OperatorNode => {
  return node.type === "operator";
};

/**
 * Creates a new empty group
 */
const createEmptyGroup = (): GroupNode => ({
  id: uuidv4(),
  type: "group",
  rules: [],
});

/**
 * Creates a new operator node
 */
const createOperator = (): OperatorNode => ({
  id: uuidv4(),
  type: "operator",
  operator: "and",
});

/**
 * Creates a new rule with the correct type
 */
const createRule = (rule: Omit<RuleNode, "id">): RuleNode => {
  const baseRule = { ...rule, id: uuidv4() };

  if (rule.type === "token" && "subtype" in rule) {
    if (rule.subtype === "ERC20") {
      return baseRule as ERC20Rule;
    } else if (rule.subtype === "ERC721") {
      return baseRule as ERC721Rule;
    } else {
      return baseRule as ERC1155Rule;
    }
  } else if (rule.type === "litAction") {
    return baseRule as LitActionRule;
  } else {
    return baseRule as PaywallRule;
  }
};

/**
 * Finds a group by ID in the state
 */
const findGroupById = (
  state: AccessControlGroup,
  groupId: string
): { group: GroupNode; index: number } | null => {
  for (let i = 0; i < state.length; i++) {
    const node = state[i];
    if (isGroup(node) && node.id === groupId) {
      return { group: node, index: i };
    }
  }
  return null;
};

/**
 * Finds a node by ID in the state
 */
const findNodeById = (
  state: AccessControlGroup,
  id: string
): { node: AccessControlNode; index: number; group?: GroupNode } | null => {
  for (let i = 0; i < state.length; i++) {
    const node = state[i];
    if (isGroup(node)) {
      // Search within the group
      const index = node.rules.findIndex(
        (rule: AccessControlNode) => rule.id === id
      );
      if (index !== -1) {
        return { node: node.rules[index], index, group: node };
      }
    } else if (node.id === id) {
      return { node, index: i };
    }
  }
  return null;
};

/**
 * Removes a node and its surrounding operators from an array
 * Handles cases where the node is at the beginning, middle, or end
 */
const removeNodeWithOperators = (
  array: AccessControlNode[],
  index: number
): void => {
  // If the node is at the beginning
  if (index === 0) {
    // If there's an operator after this node, remove it too
    if (array.length > 1 && isOperator(array[1])) {
      array.splice(0, 2);
    } else {
      array.splice(0, 1);
    }
    return;
  }

  // If the node is at the end
  if (index === array.length - 1) {
    // If there's an operator before this node, remove it too
    if (isOperator(array[index - 1])) {
      array.splice(index - 1, 2);
    } else {
      array.splice(index, 1);
    }
    return;
  }

  // If the node is in the middle
  const hasOperatorBefore = isOperator(array[index - 1]);
  const hasOperatorAfter = isOperator(array[index + 1]);

  if (hasOperatorBefore && hasOperatorAfter) {
    // If there are operators on both sides, remove the node and the operator after it
    array.splice(index, 2);
  } else if (hasOperatorBefore) {
    // If there's only an operator before, remove both
    array.splice(index - 1, 2);
  } else if (hasOperatorAfter) {
    // If there's only an operator after, remove both
    array.splice(index, 2);
  } else {
    // If there are no operators, just remove the node
    array.splice(index, 1);
  }
};

/**
 * Ensures the state has no orphaned operators
 * Removes any operators at the start or end of the array
 * and ensures operators are only between groups
 */
const cleanupOperators = (state: AccessControlGroup): AccessControlGroup => {
  const newState = [...state];

  // Remove operators from start and end
  while (newState.length > 0 && isOperator(newState[0])) {
    newState.shift();
  }
  while (newState.length > 0 && isOperator(newState[newState.length - 1])) {
    newState.pop();
  }

  // Ensure operators are only between groups
  for (let i = 0; i < newState.length - 1; i++) {
    if (isGroup(newState[i]) && isGroup(newState[i + 1])) {
      // If there's no operator between these groups, add one
      if (!isOperator(newState[i + 1])) {
        newState.splice(i + 1, 0, createOperator());
      }
    } else if (isOperator(newState[i]) && isOperator(newState[i + 1])) {
      // If there are consecutive operators, remove one
      newState.splice(i, 1);
      i--;
    }
  }

  return newState;
};

/**
 * Reducer for managing access control state
 * Handles all state transitions for the access control builder
 */
export function accessControlReducer(
  state: AccessControlGroup,
  action: AccessControlAction
): AccessControlGroup {
  let newState: AccessControlGroup;

  switch (action.type) {
    case "ADD_GROUP": {
      // Add the new group first
      newState = [...state, createEmptyGroup()];

      // Then add an operator if there are now multiple groups
      if (newState.length > 1) {
        newState.push(createOperator());
      }
      break;
    }

    case "REMOVE_GROUP": {
      const { groupId } = action;
      newState = [...state];
      const result = findGroupById(newState, groupId);

      if (result) {
        removeNodeWithOperators(newState, result.index);
      }
      break;
    }

    case "ADD_RULE": {
      const { groupId, rule } = action;
      newState = [...state];
      const result = findGroupById(newState, groupId);

      if (result) {
        const group = result.group;

        // Add an operator if there are existing rules
        if (group.rules.length > 0) {
          // Check if the last element is already an operator
          const lastElement = group.rules[group.rules.length - 1];
          if (!isOperator(lastElement)) {
            group.rules.push(createOperator());
          }
        }

        // Add the new rule
        group.rules.push(createRule(rule));
      }
      break;
    }

    case "REMOVE_RULE": {
      const { ruleId } = action;
      newState = [...state];

      // Search through all groups for the rule
      for (let i = 0; i < newState.length; i++) {
        const node = newState[i];
        if (isGroup(node)) {
          const ruleIndex = node.rules.findIndex(
            (rule: AccessControlNode) => rule.id === ruleId
          );

          if (ruleIndex !== -1) {
            removeNodeWithOperators(node.rules, ruleIndex);
            break;
          }
        }
      }
      break;
    }

    case "UPDATE_RULE": {
      const { ruleId, updates } = action;
      newState = [...state];

      // Search through all groups for the rule
      for (let i = 0; i < newState.length; i++) {
        const node = newState[i];
        if (isGroup(node)) {
          const ruleIndex = node.rules.findIndex(
            (rule: AccessControlNode) => rule.id === ruleId
          );

          if (ruleIndex !== -1) {
            // Update the rule while preserving its type
            node.rules[ruleIndex] = createRule({
              ...(node.rules[ruleIndex] as RuleNode),
              ...updates,
            });
            break;
          }
        }
      }
      break;
    }

    case "UPDATE_OPERATOR": {
      const { operatorId, operator } = action;
      newState = [...state];
      const result = findNodeById(newState, operatorId);

      if (result && isOperator(result.node)) {
        // Update the operator
        if (result.group) {
          // Update operator within a group
          result.group.rules[result.index] = { ...result.node, operator };
        } else {
          // Update top-level operator
          newState[result.index] = { ...result.node, operator };
        }
      }
      break;
    }

    default:
      newState = state;
  }

  // Clean up any orphaned operators after each action
  return cleanupOperators(newState);
}

/**
 * Action types for the access control reducer
 */
export type AccessControlAction =
  | { type: "ADD_GROUP" }
  | { type: "REMOVE_GROUP"; groupId: string }
  | { type: "ADD_RULE"; groupId: string; rule: Omit<RuleNode, "id"> }
  | { type: "REMOVE_RULE"; ruleId: string }
  | {
      type: "UPDATE_RULE";
      ruleId: string;
      updates: Partial<RuleNode>;
    }
  | {
      type: "UPDATE_OPERATOR";
      operatorId: string;
      operator: LogicalOperator;
    };
