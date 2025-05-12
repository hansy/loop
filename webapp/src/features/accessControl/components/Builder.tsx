import React, { useCallback, useMemo } from "react";
import { useAccessControl } from "@/contexts/AccessControlContext";
import type { GroupNode } from "@/state/accessControl/types";
import { Group } from "./groups/Group";

/**
 * Main component for building access control rules
 * Only renders the user-editable group, hiding the fixed structure
 */
export function Builder() {
  const { state, dispatch } = useAccessControl();

  // Find the user-editable group
  const userGroup = useMemo(() => {
    // First find the inner group
    const innerGroup = state.find(
      (node): node is GroupNode =>
        node.type === "group" && node.id === "inner-group"
    );
    if (!innerGroup) return null;

    // Then find the user group inside it
    return innerGroup.rules.find(
      (node): node is GroupNode =>
        node.type === "group" && node.id === "user-group"
    );
  }, [state]);

  const handleAddGroup = useCallback(() => {
    console.log("[Builder] Adding new group");
    dispatch({ type: "ADD_GROUP" });
  }, [dispatch]);

  if (!userGroup) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">Loading access control rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <Group group={userGroup} />
      </div>
      <button
        onClick={handleAddGroup}
        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        Add Group
      </button>
    </div>
  );
}
