/**
 * This file defines the available rule options for the rule builder.
 * It references the RuleType alias defined in webapp/src/state/accessControl/types.ts.
 */

import { RuleType } from "webapp/src/state/accessControl/types";

// Define the available rule options for the dropdown.
// Currently, only 'token' is supported.
export const RULE_OPTIONS: RuleType[] = ["token"];
