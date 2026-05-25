/** Префікс env від Neon на Vercel (назва інтеграції / проєкту). */
const NEON_PREFIX = process.env.NEON_ENV_PREFIX ?? "Shark";

function prefixed(name: string): string | undefined {
  return process.env[`${NEON_PREFIX}_${name}`]?.trim();
}

function buildFromParts(): string | null {
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

  if (!user || !password || !host || !database) return null;

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${database}?sslmode=require`;
}

/**
 * Повертає connection string для Neon.
 * Підтримує стандартні імена та префікс Shark_ з Vercel Storage.
 */
export function getDatabaseUrl(): string {
  const direct = [
    process.env.DATABASE_URL,
    prefixed("POSTGRES_URL"),
    prefixed("DATABASE_URL"),
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
  ].find((v) => v?.trim());

  if (direct) return direct.trim();

  const built = buildFromParts();
  if (built) return built;

  throw new Error(
    `Database URL not found. Add Shark_POSTGRES_URL / Shark_DATABASE_URL on Vercel, ` +
      `or set DATABASE_URL locally. (prefix: ${NEON_PREFIX}_)`
  );
}
