import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as ServerlessPool } from "@neondatabase/serverless";
import * as schema from "./schema";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import { IS_PRODUCTION } from "@/lib/common/utils/env";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

let db: NodePgDatabase<typeof schema>;

if (IS_PRODUCTION) {
  const pool = new ServerlessPool({
    connectionString: process.env.DATABASE_URL,
  });

  db = drizzleNeon(pool, { schema });
} else {
  const pool = new PgPool({
    connectionString: process.env.DATABASE_URL,
  });

  db = drizzleNode({ client: pool, schema });
}

export { db };
