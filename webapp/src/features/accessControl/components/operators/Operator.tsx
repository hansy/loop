import React from "react";
import type { LogicalOperator } from "@/state/accessControl/types";

interface OperatorProps {
  operator: LogicalOperator;
  onChange: (operator: LogicalOperator) => void;
}

/**
 * Component for rendering and managing logical operators (AND/OR)
 * Uses button groups for a more intuitive interface
 */
export function Operator({ operator, onChange }: OperatorProps) {
  const handleUpdate = (newOperator: LogicalOperator) => {
    console.log("[Operator] Updating operator:", newOperator);
    onChange(newOperator);
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <button
        onClick={() => handleUpdate("and")}
        className={`rounded-md px-3 py-2 text-sm font-semibold ${
          operator === "and"
            ? "bg-indigo-600 text-white"
            : "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        }`}
      >
        AND
      </button>
      <button
        onClick={() => handleUpdate("or")}
        className={`rounded-md px-3 py-2 text-sm font-semibold ${
          operator === "or"
            ? "bg-indigo-600 text-white"
            : "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        }`}
      >
        OR
      </button>
    </div>
  );
}
