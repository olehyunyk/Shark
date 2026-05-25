ALTER TABLE "jira_issues" ADD COLUMN IF NOT EXISTS "issue_type" varchar(128);

CREATE TABLE IF NOT EXISTS "app_settings" (
  "key" varchar(64) PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
