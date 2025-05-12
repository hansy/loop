# Access Control Feature

## Overview

This feature allows users to set up access control conditions for content using a modular, extensible UI. Rules are created and edited via a slideover dialog for a modern, intuitive experience.

## UI Flow

- Users click "Add Rule" to open a slideover.
- The slideover contains a dropdown for rule type (currently only "token").
- The form fields update based on the rule type.
- On save, the rule is validated. If valid, it is saved and a summary is shown. If invalid, an error is displayed.
- Users can click a rule summary to edit it in the slideover.

## Component Structure

- `AddRuleSlideover.tsx`: Slideover dialog for adding/editing rules.
- `RuleFormToken.tsx`: Form fields and validation for the "token" rule type.
- `RuleSummary.tsx`: Standardized summary display for a rule.
- `RuleList.tsx`: Renders a list of rules and handles click-to-edit.
- `Group.tsx`: Integrates the above components into the access control group UI.

## File Locations

- All components are in `src/features/accessControl/components/`.
- State and types are in `src/features/accessControl/` and `src/state/accessControl/`.

## Rule Options & Types

- The available rule types for the dropdown are defined in `src/components/AccessControl/ruleOptions.ts` as the `RULE_OPTIONS` constant.
- The valid rule type strings are defined in `webapp/src/state/accessControl/types.ts` as the `RuleType` alias. This ensures type safety and a single source of truth for rule types.
- To add a new rule type, update the `RuleType` alias and add the new type to `RULE_OPTIONS`.

## Extending

To add new rule types:

1. Add the new type string to the `RuleType` alias in `types.ts`.
2. Add the new type to the `RULE_OPTIONS` array in `ruleOptions.ts`.
3. Create a new form component for the rule type.
4. Update the dropdown and summary logic in `AddRuleSlideover` and `RuleSummary`.

---

_Last updated: [date]_
