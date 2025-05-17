import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import { IS_PRODUCTION } from "@/utils/env";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import ws from "ws";

let db: NodePgDatabase<typeof schema>;

if (IS_PRODUCTION) {
  db = drizzleNeon({
    connection: process.env.DATABASE_URL!,
    ws,
    schema,
  });
} else {
  const pool = new PgPool({
    connectionString: process.env.DATABASE_URL,
  });

  db = drizzleNode({ client: pool, schema });
}

export { db };
