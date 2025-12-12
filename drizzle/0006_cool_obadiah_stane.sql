CREATE TYPE "public"."item_type" AS ENUM('article', 'video', 'social', 'other');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('inbox', 'reading', 'archived', 'trash');--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "status" "status" DEFAULT 'inbox' NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "type" "item_type" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "isFavorite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "reminderAt" timestamp;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "siteName" text;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "favicon" text;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "author" text;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "duration" integer;