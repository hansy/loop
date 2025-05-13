import React, { useState } from "react";
import type { RuleNode } from "@/features/accessControl/types";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

/**
 * RuleFormToken
 *
 * Form fields for configuring a token-based access control rule.
 * Props:
 *   value: RuleNode - the current rule value
 *   onChange: (rule: RuleNode) => void - callback when rule is updated
 *   error?: string - optional error message
 */
export function RuleFormToken({
  value,
  onChange,
  error,
}: {
  value: RuleNode;
  onChange: (rule: RuleNode) => void;
  error?: string;
}) {
  // Internal state for subtype selection
  const [subtype, setSubtype] = useState<"ERC20" | "ERC721" | "ERC1155">(
    "subtype" in value ? value.subtype : "ERC20"
  );

  // Available chains
  const CHAINS = [
    { label: "Ethereum", value: "ethereum" },
    { label: "Polygon", value: "polygon" },
    { label: "Arbitrum", value: "arbitrum" },
    { label: "Optimism", value: "optimism" },
    { label: "Base", value: "base" },
  ] as const;

  // Handle subtype change
  function handleSubtypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newSubtype = e.target.value as "ERC20" | "ERC721" | "ERC1155";
    setSubtype(newSubtype);

    // Create a new rule object with the correct shape for the selected subtype
    if (newSubtype === "ERC20") {
      // Omit tokenId for ERC20
      const rule = { ...value } as { tokenId?: string };
      delete rule.tokenId;
      onChange({
        ...rule,
        type: "token",
        subtype: "ERC20",
      } as RuleNode);
    } else if (newSubtype === "ERC721") {
      onChange({
        ...value,
        type: "token",
        subtype: "ERC721",
        tokenId:
          "tokenId" in value &&
          typeof (value as { tokenId?: string }).tokenId === "string"
            ? (value as { tokenId?: string }).tokenId!
            : "",
      } as RuleNode);
    } else if (newSubtype === "ERC1155") {
      onChange({
        ...value,
        type: "token",
        subtype: "ERC1155",
        tokenId:
          "tokenId" in value &&
          typeof (value as { tokenId?: string }).tokenId === "string"
            ? (value as { tokenId?: string }).tokenId!
            : "",
      } as RuleNode);
    }
  }

  return (
    <div className="space-y-6 py-4">
      {/* Description */}
      <div className="text-sm text-gray-500">
        <p>
          Configure a token-based access rule. This rule will check if the user
          owns the specified tokens on the selected blockchain.
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            <strong>ERC20:</strong> Check for a minimum amount of fungible
            tokens
          </li>
          <li>
            <strong>ERC721:</strong> Check for ownership of a specific NFT
          </li>
          <li>
            <strong>ERC1155:</strong> Check for a minimum amount of a specific
            token ID
          </li>
        </ul>
      </div>

      {/* Subtype Dropdown */}
      <div>
        <label
          htmlFor="subtype"
          className="block text-sm/6 font-medium text-gray-900"
        >
          Token Type
        </label>
        <div className="mt-2">
          <select
            id="subtype"
            name="subtype"
            value={subtype}
            onChange={handleSubtypeChange}
            className="w-full rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          >
            <option value="ERC20">ERC20</option>
            <option value="ERC721">ERC721</option>
            <option value="ERC1155">ERC1155</option>
          </select>
        </div>
      </div>

      {/* Chain Field */}
      <div>
        <label
          htmlFor="chain"
          className="block text-sm/6 font-medium text-gray-900"
        >
          Chain
        </label>
        <div className="mt-2 grid grid-cols-1">
          <select
            id="chain"
            name="chain"
            value={"chain" in value ? value.chain : ""}
            onChange={(e) =>
              onChange({
                ...value,
                type: "token",
                chain: e.target.value,
              } as RuleNode)
            }
            className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          >
            <option value="">Select a chain</option>
            {CHAINS.map((chain) => (
              <option key={chain.value} value={chain.value}>
                {chain.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
          />
        </div>
      </div>

      {/* Contract Field */}
      <div>
        <label
          htmlFor="contract"
          className="block text-sm/6 font-medium text-gray-900"
        >
          Contract Address
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="contract"
            name="contract"
            value={"contract" in value ? value.contract : ""}
            onChange={(e) =>
              onChange({
                ...value,
                type: "token",
                contract: e.target.value,
              } as RuleNode)
            }
            className="w-full rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      {/* Number of Tokens Field */}
      <div>
        <label
          htmlFor="numTokens"
          className="block text-sm/6 font-medium text-gray-900"
        >
          Number of Tokens
        </label>
        <div className="mt-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            id="numTokens"
            name="numTokens"
            value={"numTokens" in value ? value.numTokens : 1}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d+$/.test(val)) {
                onChange({
                  ...value,
                  type: "token",
                  numTokens: val === "" ? 0 : Number(val),
                } as RuleNode);
              }
            }}
            className="w-full rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
      </div>

      {/* Token ID Field (for ERC721 and ERC1155) */}
      {(subtype === "ERC721" || subtype === "ERC1155") && (
        <div>
          <label
            htmlFor="tokenId"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Token ID
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="tokenId"
              name="tokenId"
              value={
                "tokenId" in value && typeof value.tokenId === "string"
                  ? value.tokenId
                  : ""
              }
              onChange={(e) =>
                onChange({
                  ...value,
                  type: "token",
                  tokenId: e.target.value,
                } as RuleNode)
              }
              className="w-full rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
