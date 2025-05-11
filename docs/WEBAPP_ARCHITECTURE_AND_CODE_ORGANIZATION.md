# Webapp Architecture and Code Organization

This document outlines the directory structure and the purpose of each key folder within the `webapp/` workspace. It's intended to guide development and ensure consistency in where different types of code reside.

## Root Level (`webapp/`)

- `public/`: Static assets served directly by Next.js (e.g., `favicon.ico`, `robots.txt`, images not processed by the build system).
- `pages/`: Next.js default directory for file-system based routing for UI pages.
  - `api/`: Subdirectory for Next.js API routes (server-side backend endpoints). Each subfolder typically corresponds to a resource (e.g., `users`, `videos`).
- `src/`: Contains all source code for the application. This is the primary working directory for developers.
- `tests/`: Houses all test files, including unit, integration, and end-to-end tests, mirroring the `src/` structure where applicable.
- `.env.local`: Local environment variables (not committed to git).
- `.eslintrc.js`: ESLint configuration for code linting.
- `next.config.js`: Configuration for the Next.js framework.
- `package.json`: Lists dependencies, scripts, and other metadata for the `webapp` workspace.
- `tsconfig.json`: TypeScript compiler configuration.
- `webapp-README.md`: High-level overview, setup instructions, and general architectural notes specifically for the `webapp` component. Linked from the main project README.
- `ARCHITECTURE_AND_CODE_ORGANIZATION.md`: This file – detailed guide to code structure.
- `env.example`: List of environment variables used in the app.

## `src/` Directory

- `app/`: (If using Next.js App Router) Contains layouts, pages, and components for the App Router paradigm.
- `assets/`: Static assets that are imported into components and processed by the build system (e.g., images, fonts, svgs).
- `components/`: Global, shared, and highly reusable UI components that are not specific to any single feature (e.g., `Button.tsx`, `Modal.tsx`, `Layout.tsx`).
- `contexts/`: Global React context providers and hooks (e.g., `AuthContext.tsx`, `ThemeContext.tsx`). For state shared across large parts of the application.
- `features/`: Contains modules for distinct application features or domains. Each feature directory is a vertical slice of the application.
  - `auth/`: Handles user authentication, sign-up, login flows, and Privy integration UI.
  - `creator/`: Functionality related to video creators (dashboard, video upload, video management).
  - `viewer/`: User experience for viewers (browsing content, accessing protected videos).
  - `player/`: The embeddable video player component, its controls, and playback logic.
  - _Each feature sub-directory typically contains:_
    - `components/`: UI components specific to this feature.
    - `hooks/`: React hooks containing logic specific to this feature.
    - `pages/` (optional): If a feature has distinct full pages not covered by top-level `pages/`, they can be here.
    - `index.ts`: Barrel file exporting the public interface of the feature.
- `hooks/`: Global or shared custom React hooks that are not tied to a specific feature but can be used across multiple features or components (e.g., `useLocalStorage.ts`, `useDebounce.ts`).
- `lib/`: Contains libraries, helper functions, and core logic, organized by whether it's common (client+server) or server-only.
  - `common/`: Code that is isomorphic/universal – safe and intended for use by **both** client-side and server-side code.
    - `validation/`: Shared validation schemas (e.g., using Zod) for data structures like user input, video metadata. (e.g., `userSchemas.ts`, `videoSchemas.ts`).
    - `utils/`: Common utility functions that can run in any environment (e.g., string formatters, date helpers).
  - `server/`: Code that runs **only** on the server-side (Node.js environment). Not bundled with the client.
    - `data/`: Server-side data access services. These modules encapsulate Drizzle ORM queries and database interactions for different entities (e.g., `userService.ts`, `videoService.ts`).
    - `validation/`: Server-only validation logic. Functions that perform checks requiring server resources (e.g., database lookups, external API calls with secret keys, complex business rules). (e.g., `customUserChecks.ts`).
    - `utils/`: Utility functions that are specific to the server environment.
- `services/`: **Client-side** modules responsible for:
  - Wrapping `fetch` calls to the application's own backend API routes (e.g., `userApiService.ts` calling `/api/users`).
  - Interacting with third-party client-side SDKs (e.g., `privyService.ts` for Privy, `livepeerService.ts` for Livepeer client interactions, `storjService.ts`, `litProtocolService.ts`).
- `styles/`: Global styles, theme definitions, CSS resets, and base SCSS/CSS module configurations.
- `types/`: Centralized TypeScript type definitions for shared and database-related types.
  - `db.ts`: Types inferred from Drizzle schema (e.g., `User`, `Video`) and types for data returned by `src/lib/server/data/` services.
  - `api.ts`: Types defining the request and response shapes for API routes in `pages/api/`.
  - `shared.ts`: Types that are shared across various parts of the application (frontend and backend) but don't strictly fit into `db.ts` or `api.ts`.
  - `index.ts`: Barrel file for exporting types.
- `state/`: State management logic and types.
  - `accessControl/`: Access control feature state management.
    - `types.ts`: Feature-specific types for access control.
    - `reducer.ts`: State reducer for access control.
    - `index.ts`: Exports for the feature.
  - `index.ts`: Root exports for state management.
- `db/`: Contains all database-related code, primarily for Drizzle ORM.
  - `schema.ts`: Drizzle schema definitions (tables, columns, relationships). This is the source of truth for database structure.
  - `client.ts`: Drizzle client instance initialization and database connection logic.
  - `migrations/`: Directory managed by Drizzle Kit, containing SQL migration files.
- `_app.tsx`: (For Next.js Pages Router) Custom App component to initialize pages.
- `_document.tsx`: (For Next.js Pages Router) Custom Document component to augment `<html>` and `<body>` tags.

This structure aims for a balance between feature-driven organization, clear separation of client and server concerns, and reusability.

## Type Organization Strategy

The application follows a hybrid approach to type organization:

### Centralized Types (`/types`)

Types that belong in the centralized `/types` directory:

- Database-related types (derived from Drizzle schema)
- API request/response types
- Shared types used across multiple features
- Types that represent core domain entities
- Types that need to be imported by both client and server code

Example:

```typescript
// /types/db.ts
export type User = InferSelectModel<typeof users>;
export type Video = InferSelectModel<typeof videos>;
```

### Co-located Types

Types that should be co-located with their feature:

- Feature-specific state types
- Component prop types
- Types tightly coupled to a specific feature
- Types that are implementation details of a feature

Example:

```typescript
// /state/accessControl/types.ts
export type Rule = {
  id: string;
  operator: Operator;
  // ... other rule-specific types
};
```

### Guidelines for Type Placement

1. **When to use centralized types:**

   - Types that represent core domain entities
   - Types shared across multiple features
   - Types derived from database schema
   - Types used in both client and server code

2. **When to use co-located types:**

   - Types specific to a feature's implementation
   - Types that are tightly coupled to a component or state
   - Types that are unlikely to be reused outside their feature
   - Types that might change frequently with feature development

3. **Best Practices:**
   - Keep types close to where they're used
   - Avoid circular dependencies
   - Use barrel files (index.ts) for clean exports
   - Document complex type relationships
   - Consider moving types to centralized location if they become widely used
