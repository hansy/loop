import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import {
  accessControlReducer,
  initialState,
} from "@/features/accessControl/reducer";
import type {
  AccessControlState,
  AccessControlAction,
} from "@/features/accessControl/types";

type AccessControlContextType = {
  state: AccessControlState;
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

  const wrappedDispatch = useCallback((action: AccessControlAction) => {
    console.log("[Context] Dispatching action:", action);
    dispatch(action);
  }, []);

  return (
    <AccessControlContext.Provider value={{ state, dispatch: wrappedDispatch }}>
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
