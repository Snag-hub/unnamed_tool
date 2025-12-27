CREATE TABLE "items_to_tags" (
	"itemId" text NOT NULL,
	"tagId" text NOT NULL,
	CONSTRAINT "items_to_tags_itemId_tagId_pk" PRIMARY KEY("itemId","tagId")
);
--> statement-breakpoint
CREATE TABLE "notes_to_tags" (
	"noteId" text NOT NULL,
	"tagId" text NOT NULL,
	CONSTRAINT "notes_to_tags_noteId_tagId_pk" PRIMARY KEY("noteId","tagId")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3B82F6',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks_to_tags" (
	"taskId" text NOT NULL,
	"tagId" text NOT NULL,
	CONSTRAINT "tasks_to_tags_taskId_tagId_pk" PRIMARY KEY("taskId","tagId")
);
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "content" text;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "textContent" text;--> statement-breakpoint
ALTER TABLE "items_to_tags" ADD CONSTRAINT "items_to_tags_itemId_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items_to_tags" ADD CONSTRAINT "items_to_tags_tagId_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes_to_tags" ADD CONSTRAINT "notes_to_tags_noteId_notes_id_fk" FOREIGN KEY ("noteId") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes_to_tags" ADD CONSTRAINT "notes_to_tags_tagId_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks_to_tags" ADD CONSTRAINT "tasks_to_tags_taskId_tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks_to_tags" ADD CONSTRAINT "tasks_to_tags_tagId_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;