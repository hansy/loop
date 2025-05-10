import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  pgEnum,
  bigint,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  did: text("did").notNull().unique(),
  emailAddress: text("email_address").unique(),
  walletAddress: text("wallet_address").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videoStatusEnum = pgEnum("video_status", [
  "ready",
  "transcoding",
  "minting",
  "failed",
]);

export const videoVisibilityEnum = pgEnum("video_visibility", [
  "public",
  "protected",
]);

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  metadata: jsonb("metadata").notNull(),
  status: videoStatusEnum("status").notNull().default("transcoding"),
  tokenId: bigint("token_id", { mode: "bigint" }).unique(),
  transcodeTaskId: text("transcode_task_id"),
  ipfsCid: text("ipfs_cid"),
  visibility: videoVisibilityEnum("visibility").notNull().default("public"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userRelations = relations(users, ({ many }) => ({
  videos: many(videos),
}));

export const videoRelations = relations(videos, ({ one }) => ({
  user: one(users, { fields: [videos.userId], references: [users.id] }),
}));
