CREATE TABLE "system_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"context" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
