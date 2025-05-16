import { CONTRACT_ADDRESSES } from "@/config/contractsConfig";
import { LIT_ACTION_IPFS_CID } from "@/config/litConfig";
import {
  AccessControlState,
  AccessControlNode,
  TokenRule,
  PaywallRule,
  OperatorNode,
  GroupNode,
  ERC20Rule,
  ERC721Rule,
  ERC1155Rule,
} from "@/features/accessControl/types";
import { UnifiedAccessControlConditions } from "@lit-protocol/types";
import { camelCaseString } from "@/utils/camelCaseString";
import { DEFAULT_CHAIN } from "@/config/chainConfig";

/**
 * Creates a balanceOf condition for checking token ownership
 * @param contract The contract address
 * @param chain The chain name
 * @param numTokens Number of tokens required
 * @param subtype The token subtype (ERC20, ERC721, ERC1155)
 * @param tokenId Optional token ID for ERC721/ERC1155
 * @returns Lit Protocol condition for checking token balance
 */
function createBalanceOfCondition(
  contract: string,
  chain: string,
  numTokens: number,
  subtype: "ERC20" | "ERC721" | "ERC1155",
  tokenId?: string
): UnifiedAccessControlConditions[number] {
  const isERC20 = subtype === "ERC20";

  return {
    conditionType: "evmBasic",
    contractAddress: contract,
    standardContractType: subtype,
    method: "balanceOf",
    parameters: isERC20 ? [":userAddress"] : [":userAddress", tokenId || "0"],
    chain,
    returnValueTest: {
      comparator: ">=",
      value: numTokens.toString(),
    },
  };
}

/**
 * Converts a single rule node to Lit Protocol format
 * @param node The rule node to convert
 * @returns Lit Protocol condition or undefined if not convertible
 */
function convertRuleToLitFormat(
  node: AccessControlNode
): UnifiedAccessControlConditions[number] | undefined {
  if (node.type === "litAction") {
    return {
      conditionType: "evmBasic",
      contractAddress: "",
      standardContractType: "",
      chain: camelCaseString(DEFAULT_CHAIN.name),
      method: "",
      parameters: [":currentActionIpfsId"],
      returnValueTest: {
        comparator: "=",
        value: LIT_ACTION_IPFS_CID,
      },
    };
  }

  if (node.type === "token" || node.type === "owner") {
    const tokenRule = node as TokenRule;
    const tokenId = (tokenRule as ERC721Rule | ERC1155Rule).tokenId;
    return createBalanceOfCondition(
      tokenRule.contract,
      tokenRule.chain,
      tokenRule.numTokens,
      tokenRule.subtype,
      tokenId
    );
  }

  if (node.type === "paywall") {
    const paywallRule = node as PaywallRule;

    return {
      conditionType: "evmContract",
      contractAddress: CONTRACT_ADDRESSES.PURCHASE_MANAGER,
      functionName: "hasPurchasedVideo",
      functionParams: [":userAddress", paywallRule.tokenId],
      functionAbi: {
        inputs: [
          { type: "address", name: "user" },
          { type: "uint256", name: "tokenId" },
        ],
        name: "hasPurchasedVideo",
        outputs: [{ type: "bool", name: "" }],
        stateMutability: "view",
        type: "function",
      },
      chain: paywallRule.chain,
      returnValueTest: {
        key: "",
        comparator: "=",
        value: "true",
      },
    };
  }

  if (node.type === "operator") {
    const operatorNode = node as OperatorNode;
    return { operator: operatorNode.operator };
  }

  return undefined;
}

/**
 * Converts our internal access control format to Lit Protocol format
 * @param state Our internal access control state
 * @returns Access control conditions in Lit Protocol format
 */
export function convertToLitFormat(
  state: AccessControlState
): UnifiedAccessControlConditions {
  function processNode(
    node: AccessControlNode
  ): UnifiedAccessControlConditions[number] {
    if (node.type === "group") {
      const groupNode = node as GroupNode;

      // Process all rules first
      const processedRules = groupNode.rules
        .map((rule) => {
          if (rule.type === "group") {
            return processNode(rule);
          } else {
            return convertRuleToLitFormat(rule);
          }
        })
        .filter(Boolean); // Remove any undefined/null results

      // If we have no valid conditions, return undefined
      if (processedRules.length === 0) {
        return undefined;
      }

      const groupConditions: UnifiedAccessControlConditions = [];

      // Add conditions and operators, ensuring operators have conditions on both sides
      for (let i = 0; i < processedRules.length; i++) {
        const condition = processedRules[i];

        // If it's an operator, only add it if there are conditions before and after
        if (condition && "operator" in condition) {
          if (
            i > 0 &&
            i < processedRules.length - 1 &&
            processedRules[i - 1] &&
            processedRules[i + 1]
          ) {
            groupConditions.push(condition);
          }
        } else if (condition) {
          groupConditions.push(condition);
        }
      }

      return groupConditions;
    } else {
      return convertRuleToLitFormat(node) || undefined;
    }
  }

  return state.map(processNode).filter(Boolean);
}

/**
 * Converts Lit Protocol format back to our internal format
 * @param litConditions Access control conditions in Lit Protocol format
 * @returns Our internal access control state
 */
export function convertFromLitFormat(
  litConditions: UnifiedAccessControlConditions
): AccessControlState {
  const state: AccessControlState = [];
  const currentGroup: GroupNode = {
    type: "group",
    id: crypto.randomUUID(),
    rules: [],
  };

  litConditions.forEach((condition) => {
    if ("operator" in condition) {
      // Handle operator
      currentGroup.rules.push({
        type: "operator",
        id: crypto.randomUUID(),
        operator: condition.operator,
      });
    } else {
      // Handle condition
      const rule: ERC20Rule = {
        type: "token",
        id: crypto.randomUUID(),
        subtype: "ERC20",
        chain: condition.chain,
        contract: condition.contractAddress || "",
        numTokens: parseInt(condition.returnValueTest?.value || "0"),
      };

      currentGroup.rules.push(rule);
    }
  });

  state.push(currentGroup);
  return state;
}

/**
 * Validates access control conditions in Lit Protocol format
 * @param conditions Access control conditions to validate
 * @returns true if conditions are valid, false otherwise
 */
export function validateLitConditions(
  conditions: UnifiedAccessControlConditions
): boolean {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return false;
  }

  function validateCondition(
    condition: UnifiedAccessControlConditions[number]
  ): boolean {
    // Handle arrays (groups)
    if (Array.isArray(condition)) {
      return condition.every(validateCondition);
    }

    // Handle operators
    if ("operator" in condition) {
      return condition.operator === "and" || condition.operator === "or";
    }

    // Handle lit action
    if (condition.conditionType === "litAction") {
      return true;
    }

    // Validate required fields for different condition types
    if (condition.conditionType === "evmBasic") {
      return (
        condition.chain &&
        condition.method &&
        condition.parameters &&
        condition.returnValueTest?.comparator &&
        condition.returnValueTest?.value
      );
    }

    if (condition.conditionType === "evmContract") {
      return (
        condition.chain &&
        condition.contractAddress &&
        condition.standardContractType &&
        condition.method &&
        condition.parameters &&
        condition.returnValueTest?.comparator &&
        condition.returnValueTest?.value
      );
    }

    return false;
  }

  return conditions.every(validateCondition);
}
