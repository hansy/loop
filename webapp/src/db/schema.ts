import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), // Using defaultRandom for uuid v4, will discuss uuidv7 separately
  did: text("did").notNull().unique(),
  emailAddress: text("email_address").unique(),
  walletAddress: text("wallet_address").notNull().unique(),
});
