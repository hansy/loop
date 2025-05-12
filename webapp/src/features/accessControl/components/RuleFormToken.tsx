import React, { useState } from "react";
import type { TokenRule } from "@/state/accessControl/types";

/**
 * RuleFormToken
 *
 * Form fields and validation for a 'token' (ERC20, ERC721, ERC1155) access control rule.
 * Props:
 *   value: TokenRule - current rule values
 *   onChange: (rule: TokenRule) => void - called when form values change
 *   error?: string - validation error message
 */
export function RuleFormToken({
  value,
  onChange,
  error,
}: {
  value: TokenRule;
  onChange: (rule: TokenRule) => void;
  error?: string;
}) {
  // Internal state for subtype selection
  const [subtype, setSubtype] = useState<"ERC20" | "ERC721" | "ERC1155">(
    value.subtype || "ERC20"
  );

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
        subtype: "ERC20",
      } as TokenRule);
    } else if (newSubtype === "ERC721") {
      onChange({
        ...value,
        subtype: "ERC721",
        tokenId:
          "tokenId" in value &&
          typeof (value as { tokenId?: string }).tokenId === "string"
            ? (value as { tokenId?: string }).tokenId!
            : "",
      } as TokenRule);
    } else if (newSubtype === "ERC1155") {
      onChange({
        ...value,
        subtype: "ERC1155",
        tokenId:
          "tokenId" in value &&
          typeof (value as { tokenId?: string }).tokenId === "string"
            ? (value as { tokenId?: string }).tokenId!
            : "",
      } as TokenRule);
    }
  }

  return (
    <div className="space-y-6 py-4">
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
        <div className="mt-2 flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
          <input
            id="chain"
            type="text"
            placeholder="e.g. ethereum"
            className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
            value={value.chain}
            onChange={(e) => onChange({ ...value, chain: e.target.value })}
            required
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
        <div className="mt-2 flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
          <input
            id="contract"
            type="text"
            placeholder="0x..."
            className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
            value={value.contract}
            onChange={(e) => onChange({ ...value, contract: e.target.value })}
            required
          />
        </div>
      </div>
      {/* Number of Tokens Field (ERC20, ERC1155) */}
      {(subtype === "ERC20" || subtype === "ERC1155") && (
        <div>
          <label
            htmlFor="numTokens"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Number of Tokens
          </label>
          <div className="mt-2 flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
            <input
              id="numTokens"
              type="number"
              min={1}
              className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
              value={value.numTokens}
              onChange={(e) =>
                onChange({ ...value, numTokens: Number(e.target.value) })
              }
              required
            />
          </div>
        </div>
      )}
      {/* Token ID Field (ERC721, ERC1155) */}
      {(subtype === "ERC721" || subtype === "ERC1155") && (
        <div>
          <label
            htmlFor="tokenId"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Token ID
          </label>
          <div className="mt-2 flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
            <input
              id="tokenId"
              type="text"
              className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
              value={
                (subtype === "ERC721" || subtype === "ERC1155") &&
                "tokenId" in value &&
                typeof (value as { tokenId?: string }).tokenId === "string"
                  ? (value as { tokenId?: string }).tokenId!
                  : ""
              }
              onChange={(e) =>
                onChange({ ...value, tokenId: e.target.value } as TokenRule)
              }
              required={subtype === "ERC1155"}
            />
          </div>
        </div>
      )}
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );
}
