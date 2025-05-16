import { IS_PRODUCTION } from "@/utils/env";
import { LIT_NETWORK } from "@lit-protocol/constants";

/**
 * Lit Protocol configuration constants
 */
export const LIT_ACTION_IPFS_CID = IS_PRODUCTION
  ? "QmZ6gqoUscwGXm9rKbqwFSbECJtMMrsebbCDpkFGgvUScQ"
  : "QmUZfKDuZbzf3jotSKsxsyTxpPqibuUh5R82VzviS16Qmm";

export const ACC_TOKEN_PLACEHOLDER = "TOKEN_PLACEHOLDER";

export const LIT_CLIENT_OPTIONS = {
  alertWhenUnauthorized: false,
  litNetwork: LIT_NETWORK.DatilTest,
  debug: true,
};
