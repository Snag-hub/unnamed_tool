CREATE TYPE "public"."task_recurrence" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "isRecurring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "recurrencePattern" "task_recurrence";--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "reminderTime" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "lastCompletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastDailyDigestAt" timestamp;