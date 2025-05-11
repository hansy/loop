// ---------- Base ----------
export interface BaseNode {
  id: string;
}

// ---------- Token Rules ----------
type TokenSubtype = "ERC20" | "ERC721" | "ERC1155";

interface BaseTokenRule extends BaseNode {
  type: "token" | "owner"; // 'owner' lives here only
  chain: string;
  contract: string;
  tokenNum: number;
}

// ERC20: no tokenId
export interface ERC20Rule extends BaseTokenRule {
  subtype: TokenSubtype & "ERC20";
  tokenId?: never;
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

// ---------- Paywall Rule ----------
export interface PaywallRule extends BaseNode {
  type: "paywall";
  chain: string;
  amount: bigint;
}

// ---------- Lit Action Rule ----------
export interface LitActionRule extends BaseNode {
  type: "litAction";
}

// ---------- Union of All Rules ----------
export type RuleNode = TokenRule | PaywallRule | LitActionRule;

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

export type AccessControlGroup = AccessControlNode[];

export type AccessControlCondition = AccessControlGroup;
