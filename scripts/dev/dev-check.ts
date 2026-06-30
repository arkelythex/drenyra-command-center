const includeWeb = process.env.INCLUDE_WEB === "1";
const checkApi = process.env.CHECK_API === "1";

const COMPOSE_SERVICES = ["postgres", "drenyra-engram"] as const;

const API_URL =
	process.env.API_URL ?? `http://127.0.0.1:${process.env.API_PORT ?? "3000"}`;
const WEB_URL =
	process.env.WEB_URL ?? `http://127.0.0.1:${process.env.WEB_PORT ?? "5174"}`;
const ENGRAM_URL = process.env.DRENYRA_ENGRAM_URL ?? "http://127.0.0.1:8733";

await assertComposeServicesRunning();
await assertJsonHealth(`${ENGRAM_URL}/health`, "engram", (json) => {
	if (!isRecord(json) || json.status !== "ok") {
		throw new Error(
			`Expected engram status=ok, got ${String((isRecord(json) ? json.status : undefined) ?? "undefined")}`,
		);
	}
});

if (checkApi) {
	await assertJsonHealth(`${API_URL}/health/live`, "api-live", (json) => {
		if (!isRecord(json) || json.status !== "ok") {
			throw new Error(
				`Expected api /health/live status=ok, got ${String((isRecord(json) ? json.status : undefined) ?? "undefined")}`,
			);
		}
	});

	await assertJsonHealth(`${API_URL}/health/doctor`, "api-doctor", (json) => {
		const dbStatus = getDatabaseStatus(json);
		if (dbStatus !== "ok") {
			throw new Error(
				`Expected api database status=ok, got ${String(dbStatus ?? "undefined")}`,
			);
		}
	});
}

if (includeWeb) {
	await assertHttpOk(WEB_URL, "web");
}

console.log("[dev:check] All checks passed");

async function assertComposeServicesRunning(): Promise<void> {
	const proc = Bun.spawnSync(
		["docker", "compose", "ps", "--services", "--filter", "status=running"],
		{
			stdout: "pipe",
			stderr: "pipe",
		},
	);

	if (proc.exitCode !== 0) {
		const stderr = new TextDecoder().decode(proc.stderr).trim();
		throw new Error(
			`[dev:check] Unable to read docker compose services: ${stderr}`,
		);
	}

	const running = new Set(
		new TextDecoder()
			.decode(proc.stdout)
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean),
	);

	const missing = COMPOSE_SERVICES.filter((service) => !running.has(service));
	if (missing.length > 0) {
		throw new Error(
			`[dev:check] Services not running: ${missing.join(", ")}. Run 'bun run dev:stack'.`,
		);
	}
}

async function assertJsonHealth(
	url: string,
	label: string,
	validate: (json: unknown) => void,
	retries = 25,
	sleepMs = 1500,
): Promise<void> {
	let lastError: unknown;
	for (let attempt = 1; attempt <= retries; attempt += 1) {
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
			if (!response.ok) {
				throw new Error(`HTTP ${response.status} from ${url}`);
			}

			const json = await response.json();
			validate(json);
			console.log(`[dev:check] ${label}: ok`);
			return;
		} catch (error) {
			lastError = error;
			await sleep(sleepMs);
		}
	}

	throw new Error(
		`[dev:check] ${label} failed after ${retries} retries: ${
			lastError instanceof Error ? lastError.message : String(lastError)
		}`,
	);
}

async function assertHttpOk(
	url: string,
	label: string,
	retries = 25,
	sleepMs = 1500,
): Promise<void> {
	let lastError: unknown;
	for (let attempt = 1; attempt <= retries; attempt += 1) {
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
			if (!response.ok) {
				throw new Error(`HTTP ${response.status} from ${url}`);
			}
			console.log(`[dev:check] ${label}: ok`);
			return;
		} catch (error) {
			lastError = error;
			await sleep(sleepMs);
		}
	}

	throw new Error(
		`[dev:check] ${label} failed after ${retries} retries: ${
			lastError instanceof Error ? lastError.message : String(lastError)
		}`,
	);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function getDatabaseStatus(json: unknown): string | undefined {
	if (!isRecord(json)) return undefined;
	const checks = json.checks;
	if (!isRecord(checks)) return undefined;
	const database = checks.database;
	if (!isRecord(database)) return undefined;
	const status = database.status;
	return typeof status === "string" ? status : undefined;
}
