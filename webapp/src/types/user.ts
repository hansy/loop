import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { usersTable } from "../db/schema";

/**
 * Represents a user record selected from the database.
 */
export type User = InferSelectModel<typeof usersTable>;

/**
 * Represents the shape of data required to insert a new user.
 */
export type NewUser = InferInsertModel<typeof usersTable>;
