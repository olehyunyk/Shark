import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const jiraIssues = pgTable("jira_issues", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 32 }).notNull().unique(),
  summary: text("summary").notNull(),
  status: varchar("status", { length: 128 }).notNull(),
  issueType: varchar("issue_type", { length: 128 }),
  assignee: varchar("assignee", { length: 256 }),
  priority: varchar("priority", { length: 64 }),
  dueDate: date("due_date"),
  jiraUpdated: timestamp("jira_updated", { withTimezone: true }),
  url: text("url").notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});

export const syncRuns = pgTable("sync_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  issueCount: integer("issue_count").notNull().default(0),
  status: varchar("status", { length: 32 }).notNull(),
  errorMessage: text("error_message"),
  jql: text("jql"),
});

export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type JiraIssueRow = typeof jiraIssues.$inferSelect;
export type SyncRunRow = typeof syncRuns.$inferSelect;
