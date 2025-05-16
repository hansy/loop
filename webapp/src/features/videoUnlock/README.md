# Video Unlock Feature

This feature provides components and utilities for handling video unlock functionality, including both token-based access control and direct video purchases.

## Components

### VideoUnlockModal

A modal component that displays the video unlock interface. It manages the unlock flow and provides a user-friendly interface for purchasing or accessing videos through token-based access control.

```tsx
import { VideoUnlockModal } from "@/features/videoUnlock";

<VideoUnlockModal
  isOpen={isModalOpen}
  onClose={handleClose}
  metadata={videoMetadata}
  accessControl={accessControlState}
  onUnlock={handleUnlock}
/>;
```

### UnlockWizard

A component that handles the multi-step unlock flow for videos. It displays available unlock options and guides users through the unlock process.

```tsx
import { UnlockWizard } from "@/features/videoUnlock";

<UnlockWizard
  metadata={videoMetadata}
  accessControl={accessControlState}
  onUnlock={handleUnlock}
  onStepChange={handleStepChange}
  currentStep={currentStep}
/>;
```

## State Management

The feature uses a reducer pattern for state management, making it easier to handle complex state transitions and side effects.

### UnlockReducer

The `unlockReducer` manages the state for the unlock flow, including:

- Selected unlock option
- Processing state
- Option selection and reset

```tsx
import { unlockReducer, extractUnlockOptions } from "@/features/videoUnlock";

// Use the reducer in your component
const [state, dispatch] = useReducer(unlockReducer, initialState);

// Extract unlock options
const options = extractUnlockOptions(accessControl, metadata);

// Dispatch actions
dispatch({ type: "SELECT_OPTION", payload: option });
dispatch({ type: "SET_PROCESSING", payload: true });
```

### Available Actions

- `SELECT_OPTION`: Set the currently selected unlock option
- `RESET_OPTION`: Clear the selected option
- `SET_PROCESSING`: Update the processing state

## Types

The feature exports several TypeScript interfaces:

- `UnlockOption`: Defines the structure for unlock options
- `UnlockWizardProps`: Props for the UnlockWizard component
- `VideoUnlockModalProps`: Props for the VideoUnlockModal component
- `UnlockState`: State shape for the unlock reducer
- `UnlockAction`: Action types for the unlock reducer

## Usage

The video unlock feature supports two main types of unlocks:

1. Token-based access: Users can unlock videos by holding specific tokens
2. Direct purchase: Users can purchase videos using USDC

The feature integrates with the access control system to determine available unlock options and handles the unlock flow through a multi-step wizard interface.

## Integration

To use this feature in your application:

1. Import the components from the feature:

   ```tsx
   import { VideoUnlockModal } from "@/features/videoUnlock";
   ```

2. Provide the required props:

   - `metadata`: Video metadata including price information
   - `accessControl`: Access control rules for token-based unlocks
   - `onUnlock`: Callback function to handle the unlock action
   - `onClose`: Callback function to handle modal closing

3. The modal will handle the rest of the flow, including:
   - Displaying available unlock options
   - Managing the unlock process
   - Handling user interactions
   - Providing feedback during the unlock process
