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
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button
          type="button"
          onClick={() => onChange("and")}
          className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
            operator === "and"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          } border border-gray-200`}
        >
          AND
        </button>
        <button
          type="button"
          onClick={() => onChange("or")}
          className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
            operator === "or"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          } border border-gray-200 border-l-0`}
        >
          OR
        </button>
      </div>
    </div>
  );
}
