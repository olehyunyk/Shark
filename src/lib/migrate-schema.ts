import { neon } from "@neondatabase/serverless";

import { getDatabaseUrl } from "@/lib/database-url";

const MIGRATION_SQL = `
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
`;

export async function runSchemaMigration(): Promise<string[]> {
  const sql = neon(getDatabaseUrl());
  const applied: string[] = [];

  for (const statement of MIGRATION_SQL.split(";")) {
    const trimmed = statement.trim();
    if (!trimmed) continue;
    await sql.query(trimmed);
    applied.push(trimmed.split("\n")[0].slice(0, 60));
  }

  return applied;
}

export async function verifySchema(): Promise<{
  ok: boolean;
  tables: string[];
}> {
  const sql = neon(getDatabaseUrl());
  const rows = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('jira_issues', 'sync_runs')
  `;
  const tables = (rows as { table_name: string }[]).map((r) => r.table_name);
  return {
    ok: tables.includes("jira_issues") && tables.includes("sync_runs"),
    tables,
  };
}
