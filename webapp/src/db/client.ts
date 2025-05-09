import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool as ServerlessPool } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Database connection configuration
 *
 * Uses Neon serverless Postgres for both development and production.
 * The connection string is read from the DATABASE_URL environment variable.
 *
 * Note: This file should only be imported in server-side code.
 */
const pool = new ServerlessPool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Drizzle ORM instance with our schema
 *
 * This is the main entry point for database operations.
 * Example usage:
 * ```
 * import { db } from "@/db";
 * const users = await db.select().from(schema.users);
 * ```
 *
 * Note: This should only be used in server-side code.
 */
const db = drizzle(pool, { schema });

export { db };
