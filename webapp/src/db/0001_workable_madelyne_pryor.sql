CREATE TYPE "public"."video_status" AS ENUM('ready', 'transcoding', 'minting', 'failed');--> statement-breakpoint
CREATE TYPE "public"."video_visibility" AS ENUM('public', 'protected');--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"metadata" jsonb NOT NULL,
	"status" "video_status" DEFAULT 'transcoding' NOT NULL,
	"token_id" bigint,
	"transcode_task_id" text,
	"ipfs_cid" text,
	"is_downloadable" boolean DEFAULT false NOT NULL,
	"is_nsfw" boolean DEFAULT false NOT NULL,
	"visibility" "video_visibility" DEFAULT 'public' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "videos_token_id_unique" UNIQUE("token_id")
);
--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;