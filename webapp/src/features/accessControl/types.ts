// ---------- Base ----------
export interface BaseNode {
  id: string;
}

// ---------- Token Rules ----------
type TokenSubtype = "ERC20" | "ERC721" | "ERC1155";

interface BaseTokenRule extends BaseNode {
  type: "token";
  chain: string;
  contract: string;
  numTokens: number;
}

// ERC20: no tokenId
export interface ERC20Rule extends BaseTokenRule {
  subtype: TokenSubtype & "ERC20";
}

// ERC721: tokenId optional
export interface ERC721Rule extends BaseTokenRule {
  subtype: TokenSubtype & "ERC721";
  tokenId?: string;
}

// ERC1155: tokenId required
export interface ERC1155Rule extends BaseTokenRule {
  subtype: TokenSubtype & "ERC1155";
  tokenId: string;
}

export type TokenRule = ERC20Rule | ERC721Rule | ERC1155Rule;

// ---------- Owner Rule ----------
export interface OwnerRule extends BaseNode {
  type: "owner";
  chain: string;
  contract: string; // The video NFT contract address
  subtype: "ERC1155"; // Specifically for video NFTs
  tokenId: string; // The specific video NFT token ID
  numTokens: 1; // Must own exactly 1 token
}

// ---------- Paywall Rule ----------
export interface PaywallRule extends BaseNode {
  type: "paywall";
  chain: string;
  tokenId: string; // Required to check if user has purchased this specific video
}

// ---------- Lit Action Rule ----------
export interface LitActionRule extends BaseNode {
  type: "litAction";
}

// ---------- Union of All Rules ----------
export type RuleNode = TokenRule | PaywallRule | LitActionRule | OwnerRule;

export type LogicalOperator = "and" | "or";

export interface OperatorNode extends BaseNode {
  type: "operator";
  operator: LogicalOperator;
}

export interface GroupNode extends BaseNode {
  type: "group";
  rules: AccessControlNode[];
}

export type AccessControlNode = RuleNode | OperatorNode | GroupNode;

export type AccessControlState = AccessControlNode[];

export type AccessControlAction =
  | {
      type: "ADD_GROUP";
      index?: number;
    }
  | {
      type: "REMOVE_GROUP";
      groupId: string;
    }
  | {
      type: "ADD_RULE";
      groupId: string;
      rule: Omit<RuleNode, "id">;
      index?: number;
    }
  | {
      type: "REMOVE_RULE";
      groupId: string;
      ruleId: string;
    }
  | {
      type: "UPDATE_RULE";
      groupId: string;
      ruleId: string;
      updates: Partial<RuleNode>;
    }
  | {
      type: "UPDATE_OPERATOR";
      groupId: string;
      operatorId: string;
      operator: LogicalOperator;
    };

export type AccessControlCondition = AccessControlState;

// Alias for all possible rule type strings, for use in UI and elsewhere
export type RuleType = "token";
