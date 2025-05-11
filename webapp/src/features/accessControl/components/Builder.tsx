import React, { useCallback, useMemo } from "react";
import { useAccessControl } from "@/contexts/AccessControlContext";
import type {
  AccessControlNode,
  LogicalOperator,
} from "@/state/accessControl/types";
import { Group } from "./groups/Group";
import { Operator } from "./operators/Operator";

/**
 * Main component for building access control rules
 * Renders the top-level groups and operators
 */
export function Builder() {
  const { state, dispatch } = useAccessControl();

  const handleAddGroup = useCallback(() => {
    console.log("[Builder] Adding new group");
    dispatch({ type: "ADD_GROUP" });
  }, [dispatch]);

  const handleUpdateOperator = useCallback(
    (operatorId: string, operator: LogicalOperator) => {
      console.log("[Builder] Updating operator:", { operatorId, operator });
      dispatch({
        type: "UPDATE_OPERATOR",
        operatorId,
        operator,
      });
    },
    [dispatch]
  );

  const renderNode = useCallback(
    (node: AccessControlNode) => {
      console.log("[Builder] Rendering node:", {
        type: node.type,
        id: node.id,
      });
      if (node.type === "group") {
        return <Group key={node.id} group={node} />;
      } else if (node.type === "operator") {
        return (
          <Operator
            key={node.id}
            operator={node.operator}
            onChange={(operator) => handleUpdateOperator(node.id, operator)}
          />
        );
      }
      return null;
    },
    [handleUpdateOperator]
  );

  const renderedNodes = useMemo(() => {
    console.log("[Builder] Rendering nodes, state:", state);
    return state.map((node) => renderNode(node));
  }, [state, renderNode]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">
        Access Control Rules
      </h2>
      <div className="space-y-6">{renderedNodes}</div>
      <button
        onClick={handleAddGroup}
        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        Add Group
      </button>
    </div>
  );
}
