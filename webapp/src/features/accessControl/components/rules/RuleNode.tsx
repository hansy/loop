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
  const handleUpdate = (updates: Partial<RuleNode>) => {
    console.log("[RuleNode] Updating rule:", { ruleId: rule.id, updates });
    onUpdate(updates);
  };

  const handleRemove = () => {
    console.log("[RuleNode] Removing rule:", rule.id);
    onRemove();
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex-1 space-y-4">
        {rule.type === "token" && (
          <>
            <div>
              <label
                htmlFor={`chain-${rule.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                Chain
              </label>
              <input
                type="text"
                id={`chain-${rule.id}`}
                value={rule.chain}
                onChange={(e) => handleUpdate({ chain: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor={`contract-${rule.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                Contract
              </label>
              <input
                type="text"
                id={`contract-${rule.id}`}
                value={rule.contract}
                onChange={(e) => handleUpdate({ contract: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor={`tokenNum-${rule.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                Token Number
              </label>
              <input
                type="number"
                id={`tokenNum-${rule.id}`}
                value={rule.tokenNum}
                onChange={(e) =>
                  handleUpdate({ tokenNum: Number(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {rule.subtype === "ERC721" && (
              <div>
                <label
                  htmlFor={`tokenId-${rule.id}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Token ID
                </label>
                <input
                  type="text"
                  id={`tokenId-${rule.id}`}
                  value={rule.tokenId}
                  onChange={(e) => handleUpdate({ tokenId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}
            {rule.subtype === "ERC1155" && (
              <div>
                <label
                  htmlFor={`tokenId-${rule.id}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Token ID
                </label>
                <input
                  type="text"
                  id={`tokenId-${rule.id}`}
                  value={rule.tokenId}
                  onChange={(e) => handleUpdate({ tokenId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}
          </>
        )}

        {rule.type === "paywall" && (
          <>
            <div>
              <label
                htmlFor={`chain-${rule.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                Chain
              </label>
              <input
                type="text"
                id={`chain-${rule.id}`}
                value={rule.chain}
                onChange={(e) => handleUpdate({ chain: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor={`amount-${rule.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                Amount
              </label>
              <input
                type="number"
                id={`amount-${rule.id}`}
                value={Number(rule.amount)}
                onChange={(e) =>
                  handleUpdate({ amount: BigInt(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </>
        )}

        {rule.type === "litAction" && (
          <div>
            <p className="text-sm text-gray-500">Lit Action Rule</p>
          </div>
        )}

        {rule.type === "owner" && (
          <div>
            <p className="text-sm text-gray-500">Owner Rule</p>
          </div>
        )}
      </div>
      <button
        onClick={handleRemove}
        className="ml-4 rounded-md bg-white p-2 text-gray-400 hover:text-gray-500"
        aria-label="Remove rule"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
