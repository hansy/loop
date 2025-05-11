import React, { createContext, useContext, useReducer } from "react";
import {
  accessControlReducer,
  initialState,
  AccessControlAction,
} from "@/state/accessControl/reducer";
import type { AccessControlGroup } from "@/state/accessControl/types";

type AccessControlContextType = {
  state: AccessControlGroup;
  dispatch: React.Dispatch<AccessControlAction>;
};

const AccessControlContext = createContext<
  AccessControlContextType | undefined
>(undefined);

export function AccessControlProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(accessControlReducer, initialState);

  return (
    <AccessControlContext.Provider value={{ state, dispatch }}>
      {children}
    </AccessControlContext.Provider>
  );
}

export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (context === undefined) {
    throw new Error(
      "useAccessControl must be used within an AccessControlProvider"
    );
  }
  return context;
}
