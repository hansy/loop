import React, { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import type { TokenRule } from "@/state/accessControl/types";
import { RuleFormToken } from "./RuleFormToken";

/**
 * AddRuleSlideover
 *
 * Slideover dialog for adding or editing an ERC20 token access control rule.
 * Props:
 *   open: boolean - whether the slideover is open
 *   onClose: () => void - callback to close the slideover
 *   onSave: (rule: ERC20Rule) => void - callback to save the rule
 *   initialRule?: ERC20Rule - rule to edit (if any, must be ERC20)
 */
export function AddRuleSlideover({
  open,
  onClose,
  onSave,
  initialRule,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (rule: TokenRule) => void;
  initialRule?: TokenRule;
}) {
  // --- Rule type dropdown logic ---
  const RULE_TYPES = [
    { label: "Token", value: "token" },
    // Future: { label: 'Paywall', value: 'paywall' }, etc.
  ] as const;
  type RuleType = (typeof RULE_TYPES)[number]["value"];

  const [selectedRuleType, setSelectedRuleType] = useState<RuleType>("token");
  const [rule, setRule] = useState<TokenRule>(
    initialRule ?? {
      id: "",
      type: "token",
      subtype: "ERC20",
      chain: "",
      contract: "",
      numTokens: 1,
    }
  );
  const [error, setError] = useState<string | undefined>(undefined);

  // Handle rule type change
  function handleRuleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newType = e.target.value as RuleType;
    setSelectedRuleType(newType);
    // Reset rule state for new type (for now, only token)
    setRule({
      id: "",
      type: "token",
      subtype: "ERC20",
      chain: "",
      contract: "",
      numTokens: 1,
    });
    setError(undefined);
  }

  // Handle form submission
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(rule);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-10">
      <div className="fixed inset-0" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
            >
              <form
                className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                onSubmit={handleSubmit}
              >
                <div className="h-0 flex-1 overflow-y-auto">
                  <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                    <div className="flex items-center justify-between">
                      <DialogTitle className="text-base font-semibold text-white">
                        {initialRule ? "Edit Rule" : "Add Rule"}
                      </DialogTitle>
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          onClick={onClose}
                          className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden"
                        >
                          <span className="absolute -inset-2.5" />
                          <span className="sr-only">Close panel</span>
                          <XMarkIcon aria-hidden="true" className="size-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="px-4 sm:px-6">
                      {/* Rule Type Dropdown at the top */}
                      <div className="mb-6">
                        <label
                          htmlFor="rule-type"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Rule Type
                        </label>
                        <div className="mt-2 grid grid-cols-1">
                          <select
                            id="rule-type"
                            name="rule-type"
                            value={selectedRuleType}
                            onChange={handleRuleTypeChange}
                            className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                          >
                            {RULE_TYPES.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDownIcon
                            aria-hidden="true"
                            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                          />
                        </div>
                      </div>
                      {/* Visual separator */}
                      <div className="mb-4 border-b border-gray-200" />
                      {/* Rule Fields: Only show if Token is selected */}
                      {selectedRuleType === "token" && (
                        <RuleFormToken
                          value={rule}
                          onChange={(updates) =>
                            setRule({ ...rule, ...updates })
                          }
                          error={error}
                          selectedType="ERC20"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 justify-end px-4 py-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Save
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
