/**
 * Engram sidecar harness — automated spin-up of the drenyra-engram engine for
 * the cross-repo integration suite.
 *
 * Replaces the manual "start the sidecar yourself" step:
 *
 *   drenyra-engram serve --db <temp> --addr 127.0.0.1:8799
 *
 * with an automated lifecycle. Resolution order:
 *
 *   1. $DRENYRA_ENGRAM_BIN — explicit path to a built binary.
 *   2. `drenyra-engram` on PATH.
 *   3. $DRENYRA_ENGRAM_REPO — path to the drenyra-engram source checkout; the
 *      harness runs `go build -o <temp>` there (needs Go on PATH).
 *   4. `../drenyra-engram` relative to this repo root (standard sibling layout:
 *      ~/Documents/PROYECTOS/drenyra-engram).
 *
 * When no binary can be resolved the harness returns null and the integration
 * suite skips (same contract as before, but the skip reason is now explicit).
 *
 * No monetary fields exist in this module; Drenyra money values are BigInt
 * cents (repo-wide rule) and nothing here touches them.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

/** A running engine instance, ready for the suite and torn down by stop(). */
export interface EngramSidecar {
	baseUrl: string;
	stop: () => Promise<void>;
}

const HEALTH_TIMEOUT_MS = 20_000;
const HEALTH_POLL_MS = 250;

/** Reserve a free TCP port on loopback, then release it. */
function freePort(): Promise<number> {
	return new Promise((resolvePort, rejectPort) => {
		const server = createServer();
		server.unref();
		server.on("error", rejectPort);
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (address && typeof address === "object") {
				const port = address.port;
				server.close(() => resolvePort(port));
			} else {
				rejectPort(new Error("no TCP address"));
			}
		});
	});
}

/** The engine's health surface is GET /v1/doctor (schemaVersion 1+). */
async function isHealthy(baseUrl: string): Promise<boolean> {
	try {
		const res = await fetch(`${baseUrl}/v1/doctor`);
		if (!res.ok) return false;
		const body = (await res.json()) as { schemaVersion?: number };
		return typeof body.schemaVersion === "number" && body.schemaVersion >= 1;
	} catch {
		return false;
	}
}

/**
 * Resolve the engine binary, building it from a source checkout when no
 * prebuilt binary is available.
 */
async function resolveBinary(): Promise<string | null> {
	const explicit = process.env.DRENYRA_ENGRAM_BIN;
	if (explicit && existsSync(explicit)) return explicit;

	const fromPath = resolve("drenyra-engram");
	if (existsSync(fromPath)) return fromPath;

	const repoEnv = process.env.DRENYRA_ENGRAM_REPO;
	const repoCandidates = repoEnv
		? [repoEnv]
		: [resolve(import.meta.dirname, "../../../../../drenyra-engram")];
	for (const repo of repoCandidates) {
		if (!existsSync(join(repo, "go.mod"))) continue;
		const out = join(
			mkdtempSync(join(tmpdir(), "engram-bin-")),
			"drenyra-engram",
		);
		await new Promise<void>((resolveBuild, rejectBuild) => {
			const child = spawn("go", ["build", "-o", out, "./cmd/drenyra-engram"], {
				cwd: repo,
				stdio: "ignore",
			});
			child.on("close", (code) =>
				code === 0
					? resolveBuild()
					: rejectBuild(new Error(`go build exited ${code}`)),
			);
			child.on("error", rejectBuild);
		});
		return out;
	}
	return null;
}

/**
 * Start the sidecar on a fresh temp DB/keyring and a free local port, wait for
 * the health endpoint, and return the harness. Call stop() in afterAll.
 *
 * Returns null when no binary could be resolved (suite skips).
 *
 * When $DRENYRA_ENGRAM_URL is set the harness skips the spin-up and polls that
 * URL instead — the external-instance escape hatch for CI environments that
 * run the sidecar as a service.
 */
export async function startEngramSidecar(): Promise<EngramSidecar | null> {
	const urlEnv = process.env.DRENYRA_ENGRAM_URL;
	if (urlEnv) {
		return (await isHealthy(urlEnv))
			? { baseUrl: urlEnv, stop: async () => undefined }
			: null;
	}

	const binary = await resolveBinary();
	if (!binary) return null;

	const dbPath = join(mkdtempSync(join(tmpdir(), "engram-db-")), "engram.db");
	const keyringPath = join(
		mkdtempSync(join(tmpdir(), "engram-keyring-")),
		"signing-keys.json",
	);
	const port = await freePort();
	const baseUrl = `http://127.0.0.1:${port}`;

	const child = spawn(
		binary,
		["serve", "--db", dbPath, "--addr", `127.0.0.1:${port}`],
		{
			stdio: ["ignore", "pipe", "pipe"],
			env: {
				...process.env,
				// The engine requires a signing keyring; point it at a fresh temp
				// file so the sidecar never touches the operator's real keyring.
				DRENYRA_ENGRAM_SIGNING_KEY: keyringPath,
			},
		},
	);

	const deadline = Date.now() + HEALTH_TIMEOUT_MS;
	while (Date.now() < deadline) {
		if (await isHealthy(baseUrl)) {
			return {
				baseUrl,
				stop: async () => {
					child.kill("SIGTERM");
					await sleep(100);
					rmSync(dbPath, { force: true });
					rmSync(keyringPath, { force: true });
				},
			};
		}
		await sleep(HEALTH_POLL_MS);
	}

	child.kill("SIGTERM");
	throw new Error(
		`engram sidecar did not become healthy at ${baseUrl} within ${HEALTH_TIMEOUT_MS}ms ` +
			`(binary ${binary})`,
	);
}
