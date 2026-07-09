import { spawnSync } from "node:child_process";
import postgres from "postgres";

const DEFAULT_DB_URLS = [
	"postgresql://user:password@localhost:5436/arkalythix",
	"postgresql://postgres:postgres@localhost:5436/arkalythix_dev",
];

const DEFAULT_TEST_TARGETS = [
	"src/features/auth/__tests__/integration",
	"src/features/banking/__tests__/integration",
	"src/features/sire/__tests__/integration",
	"src/features/electronic-invoicing/__tests__/integration",
	"src/features/reconciliations/__tests__/integration",
	"src/features/inter-company/__tests__/integration",
	"src/features/ai-swarm/__tests__/integration",
	"src/services/__tests__/integration",
];

const DEFAULT_CONNECT_TIMEOUT_SECONDS = 2;
const DEFAULT_END_TIMEOUT_SECONDS = 1;

function parsePositiveInteger(raw, fallback) {
	if (!raw) return fallback;
	const value = Number.parseInt(raw, 10);
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseDbTestUrls(raw) {
	if (!raw) return [];
	return raw
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);
}

function redactDatabaseUrl(raw) {
	try {
		const parsed = new URL(raw);
		const user = parsed.username || "<unknown>";
		const host = parsed.host || "<unknown>";
		const database = parsed.pathname.replace(/^\//, "") || "<unknown>";
		return `${user}@${host}/${database}`;
	} catch {
		return "<invalid-url>";
	}
}

function unique(values) {
	return [...new Set(values.filter(Boolean))];
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
	const configuredUrls = parseDbTestUrls(process.env.DB_TEST_URLS);
	const candidates = requestedUrl
		? unique([requestedUrl, ...configuredUrls, ...DEFAULT_DB_URLS])
		: unique([...configuredUrls, ...DEFAULT_DB_URLS]);

	for (const candidate of candidates) {
		const ok = await canConnect(candidate);
		if (ok) return candidate;
	}

	return null;
}

const vitestTargets = process.argv.slice(2);
const testTargets =
	vitestTargets.length > 0 ? vitestTargets : DEFAULT_TEST_TARGETS;

const resolvedDatabaseUrl = await resolveDatabaseUrl();
if (!resolvedDatabaseUrl) {
	const configuredUrls = parseDbTestUrls(process.env.DB_TEST_URLS);
	console.error("No reachable PostgreSQL endpoint for DB tests.");
	console.error(
		`Tried: ${unique([
			process.env.DATABASE_URL,
			...configuredUrls,
			...DEFAULT_DB_URLS,
		])
			.map(redactDatabaseUrl)
			.join(", ")}`,
	);
	process.exit(1);
}

console.log(
	`Using DATABASE_URL=${redactDatabaseUrl(resolvedDatabaseUrl)} for DB tests.`,
);

const result = spawnSync("bun", ["run", "test:run", ...testTargets], {
	stdio: "inherit",
	env: {
		...process.env,
		RUN_DB_TESTS: "1",
		DATABASE_URL: resolvedDatabaseUrl,
	},
});

if (result.error) {
	console.error(result.error);
	process.exit(1);
}

process.exit(result.status ?? 1);
