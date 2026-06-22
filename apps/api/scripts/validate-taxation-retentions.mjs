import { spawnSync } from 'node:child_process';
import postgres from 'postgres';

const DEFAULT_DB_URLS = [
  'postgresql://user:password@localhost:5436/arkalythix',
  'postgresql://postgres:postgres@localhost:5436/arkalythix_dev',
];

const DEFAULT_CONNECT_TIMEOUT_SECONDS = 2;
const DEFAULT_END_TIMEOUT_SECONDS = 1;

function parsePositiveInteger(raw, fallback) {
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseDbUrls(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function redactDatabaseUrl(raw) {
  try {
    const parsed = new URL(raw);
    const user = parsed.username || '<unknown>';
    const host = parsed.host || '<unknown>';
    const database = parsed.pathname.replace(/^\//, '') || '<unknown>';
    return `${user}@${host}/${database}`;
  } catch {
    return '<invalid-url>';
  }
}

async function canConnect(databaseUrl) {
  const connectTimeoutSeconds = parsePositiveInteger(
    process.env.DB_TEST_CONNECT_TIMEOUT_SECONDS,
    DEFAULT_CONNECT_TIMEOUT_SECONDS,
  );
  const endTimeoutSeconds = parsePositiveInteger(
    process.env.DB_TEST_END_TIMEOUT_SECONDS,
    DEFAULT_END_TIMEOUT_SECONDS,
  );

  const sql = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    connect_timeout: connectTimeoutSeconds,
    idle_timeout: connectTimeoutSeconds,
  });

  try {
    await sql`select 1`;
    return true;
  } catch {
    return false;
  } finally {
    await sql.end({ timeout: endTimeoutSeconds });
  }
}

async function resolveDatabaseUrl() {
  const requestedUrl = process.env.DATABASE_URL?.trim();
  const configuredUrls = parseDbUrls(process.env.DB_TEST_URLS);
  const candidates = requestedUrl
    ? unique([requestedUrl, ...configuredUrls, ...DEFAULT_DB_URLS])
    : unique([...configuredUrls, ...DEFAULT_DB_URLS]);

  for (const candidate of candidates) {
    if (await canConnect(candidate)) {
      return candidate;
    }
  }

  return null;
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

const databaseUrl = await resolveDatabaseUrl();

if (!databaseUrl) {
  const configuredUrls = parseDbUrls(process.env.DB_TEST_URLS);
  console.error('No reachable PostgreSQL endpoint for Retenciones validation.');
  console.error(
    `Tried: ${unique([process.env.DATABASE_URL, ...configuredUrls, ...DEFAULT_DB_URLS])
      .map(redactDatabaseUrl)
      .join(', ')}`,
  );
  process.exit(1);
}

console.log(`Using DATABASE_URL=${redactDatabaseUrl(databaseUrl)} for Retenciones validation.`);

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  RUN_DB_TESTS: '1',
};

run('bun', ['run', 'db:push'], env);
run('bun', ['run', 'test:db:taxation'], env);
