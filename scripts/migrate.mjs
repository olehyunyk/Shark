import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PREFIX = process.env.NEON_ENV_PREFIX ?? "Shark";

function prefixed(name) {
  const v = process.env[`${PREFIX}_${name}`];
  return v?.trim() || undefined;
}

function getDatabaseUrl() {
  const direct = [
    process.env.DATABASE_URL,
    prefixed("POSTGRES_URL"),
    prefixed("DATABASE_URL"),
    process.env.POSTGRES_URL,
  ].find((v) => v?.trim());

  if (direct) return direct.trim();

  const user =
    prefixed("POSTGRES_USER") ?? prefixed("PGUSER") ?? process.env.POSTGRES_USER;
  const password =
    prefixed("POSTGRES_PASSWORD") ??
    prefixed("PGPASSWORD") ??
    process.env.POSTGRES_PASSWORD;
  const host =
    prefixed("POSTGRES_HOST") ??
    prefixed("PGHOST") ??
    process.env.POSTGRES_HOST;
  const database =
    prefixed("POSTGRES_DATABASE") ??
    prefixed("PGDATABASE") ??
    process.env.POSTGRES_DATABASE;

  if (user && password && host && database) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${database}?sslmode=require`;
  }

  throw new Error("Database URL not found for migration");
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlFiles = [
  join(__dirname, "../drizzle/0000_init.sql"),
  join(__dirname, "../drizzle/0001_issue_type_settings.sql"),
  join(__dirname, "../drizzle/0002_jira_created.sql"),
  join(__dirname, "../drizzle/0003_tracked_issues.sql"),
];

function shouldMigrate() {
  if (process.env.SKIP_DB_MIGRATE === "1") return false;
  try {
    getDatabaseUrl();
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!shouldMigrate()) {
    console.log("Skipping DB migration (no database URL in env)");
    return;
  }

  const url = getDatabaseUrl();
  const sql = neon(url);
  for (const sqlFile of sqlFiles) {
    const migration = readFileSync(sqlFile, "utf8");
    for (const statement of migration.split(";")) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      await sql.query(trimmed);
    }
  }

  const check = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('jira_issues', 'sync_runs', 'app_settings')
  `;
  const tables = check.map((r) => r.table_name);
  console.log("Migration OK. Tables:", tables.join(", "));
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
