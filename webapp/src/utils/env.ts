/**
 * A boolean flag indicating whether the application is currently running in the production environment.
 * This is determined by the NEXT_PUBLIC_ENVIRONMENT environment variable.
 */
export const IS_PRODUCTION: boolean =
  process.env.NEXT_PUBLIC_ENV === "production";

/**
 * A boolean flag indicating whether the application is currently running in a development environment.
 */
export const IS_DEVELOPMENT: boolean =
  process.env.NEXT_PUBLIC_ENV === "development";

// You can add other environment-related checks or utilities here if needed.
