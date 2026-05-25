CREATE TABLE IF NOT EXISTS "jira_issues" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" varchar(32) NOT NULL,
  "summary" text NOT NULL,
  "status" varchar(128) NOT NULL,
  "assignee" varchar(256),
  "priority" varchar(64),
  "due_date" date,
  "jira_updated" timestamp with time zone,
  "url" text NOT NULL,
  "synced_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jira_issues_key_unique" UNIQUE("key")
);

CREATE TABLE IF NOT EXISTS "sync_runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finished_at" timestamp with time zone,
  "issue_count" integer DEFAULT 0 NOT NULL,
  "status" varchar(32) NOT NULL,
  "error_message" text,
  "jql" text
);
