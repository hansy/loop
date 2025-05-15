import { AccessControlState } from "./types";
import { DEFAULT_CHAIN } from "@/config/chainConfig";
import { CONTRACT_ADDRESSES } from "@/config/contractsConfig";
import { ACC_TOKEN_PLACEHOLDER } from "@/config/litConfig";
import { camelCaseString } from "@/utils/camelCaseString";

/**
 * Default access control template with example rules
 * This template includes:
 * - A token-based access rule (ERC20)
 * - A token-based access rule (ERC721)
 * - A token-based access rule (ERC1155)
 */
export const defaultAccessControlTemplate: AccessControlState = [
  {
    type: "litAction",
    id: "lit-action-rule",
  },
  {
    type: "operator",
    id: "outer-operator",
    operator: "and",
  },
  {
    type: "group",
    id: "inner-group",
    rules: [
      {
        type: "owner",
        id: "owner-rule",
        chain: camelCaseString(DEFAULT_CHAIN.name),
        contract: CONTRACT_ADDRESSES.VIDEO_NFT,
        subtype: "ERC1155",
        tokenId: ACC_TOKEN_PLACEHOLDER,
        numTokens: 1,
      },
      {
        type: "operator",
        id: "inner-operator",
        operator: "or",
      },
      {
        type: "paywall",
        id: "paywall-rule",
        chain: camelCaseString(DEFAULT_CHAIN.name),
        tokenId: ACC_TOKEN_PLACEHOLDER,
      },
      {
        type: "operator",
        id: "inner-operator",
        operator: "or",
      },
      {
        type: "group",
        id: "user-group",
        rules: [
          {
            type: "group",
            id: "erc20-group",
            rules: [
              {
                type: "token",
                id: "erc20-rule",
                chain: camelCaseString(DEFAULT_CHAIN.name),
                contract: CONTRACT_ADDRESSES.USDC,
                subtype: "ERC20",
                numTokens: 1000000, // 1 USDC
              },
            ],
          },
          {
            type: "operator",
            id: "group-operator",
            operator: "or",
          },
          {
            type: "group",
            id: "erc721-group",
            rules: [
              {
                type: "token",
                id: "erc721-rule",
                chain: camelCaseString(DEFAULT_CHAIN.name),
                contract: CONTRACT_ADDRESSES.VIDEO_NFT,
                subtype: "ERC721",
                tokenId: "1",
                numTokens: 1,
              },
            ],
          },
          {
            type: "operator",
            id: "group-operator",
            operator: "or",
          },
          {
            type: "group",
            id: "erc1155-group",
            rules: [
              {
                type: "token",
                id: "erc1155-rule",
                chain: camelCaseString(DEFAULT_CHAIN.name),
                contract: CONTRACT_ADDRESSES.VIDEO_NFT,
                subtype: "ERC1155",
                tokenId: "2",
                numTokens: 1,
              },
            ],
          },
        ],
      },
    ],
  },
];
