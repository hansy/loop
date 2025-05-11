import React from "react";
import type { RuleNode } from "@/state/accessControl/types";

interface RuleNodeProps {
  rule: RuleNode;
  onUpdate: (updates: Partial<RuleNode>) => void;
  onRemove: () => void;
}

/**
 * Component for rendering and managing individual rules
 */
export function RuleNode({ rule, onUpdate, onRemove }: RuleNodeProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex">
        <div className="flex-1 space-y-4">
          <select
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={rule.type}
            onChange={(e) =>
              onUpdate({ type: e.target.value as RuleNode["type"] })
            }
          >
            <option value="token">Token</option>
            <option value="paywall">Paywall</option>
            <option value="litAction">Lit Action</option>
          </select>

          {(rule.type === "token" || rule.type === "owner") && (
            <>
              <select
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={rule.chain}
                onChange={(e) => onUpdate({ chain: e.target.value })}
              >
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="arbitrum">Arbitrum</option>
              </select>

              <input
                type="text"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Contract Address"
                value={rule.contract}
                onChange={(e) => onUpdate({ contract: e.target.value })}
              />

              <input
                type="number"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Amount"
                value={rule.tokenNum}
                onChange={(e) => onUpdate({ tokenNum: Number(e.target.value) })}
              />

              {rule.subtype === "ERC721" && (
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Token ID (optional)"
                  value={rule.tokenId || ""}
                  onChange={(e) => onUpdate({ tokenId: e.target.value })}
                />
              )}

              {rule.subtype === "ERC1155" && (
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Token ID (required)"
                  value={rule.tokenId}
                  onChange={(e) => onUpdate({ tokenId: e.target.value })}
                  required
                />
              )}
            </>
          )}

          {rule.type === "paywall" && (
            <input
              type="text"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Amount (in wei)"
              value={rule.amount.toString()}
              onChange={(e) => onUpdate({ amount: BigInt(e.target.value) })}
            />
          )}
        </div>
        <div className="ml-4 flex items-center bg-gray-100 rounded-r-lg -mr-4 -my-4 px-4">
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Remove rule"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
