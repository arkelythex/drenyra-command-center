/**
 * Engram Adapter Configuration.
 *
 * Reads the DRENYRA_ENGRAM_* environment variables that configure the
 * Drenyra Engram sidecar (arkelythex/drenyra-engram) connection.
 *
 * Fail closed: the adapter is DISABLED unless DRENYRA_ENGRAM_ENABLED is
 * explicitly "true" or "1". A disabled adapter never touches the sidecar;
 * consumers fall back to their existing persistence path.
 *
 * No monetary fields exist in this module; Drenyra money values are BigInt
 * cents (repo-wide rule) and nothing here touches them.
 *
 * @module @drenyra/memory/config
 */

/** Default sidecar base URL when DRENYRA_ENGRAM_URL is not set. */
export const DEFAULT_ENGRAM_URL = "http://localhost:8733";

/** Default per-request timeout in milliseconds. */
export const DEFAULT_ENGRAM_TIMEOUT_MS = 5_000;

/**
 * Resolved configuration for the Engram adapter.
 */
export interface EngramConfig {
	/** Base URL of the engram sidecar (trailing slashes trimmed). */
	baseUrl: string;
	/** Whether the engram adapter is active (fail closed: default false). */
	enabled: boolean;
	/** Optional bearer token sent as `Authorization: Bearer <token>`. */
	token?: string;
	/** Per-request timeout in milliseconds. */
	timeoutMs: number;
}

/**
 * Build the typed engram configuration from an environment object.
 *
 * @param env - Environment source (defaults to `process.env`); injectable for tests.
 */
export function engramConfig(
	env: NodeJS.ProcessEnv = process.env,
): EngramConfig {
	const baseUrl = (
		env.DRENYRA_ENGRAM_URL?.trim() || DEFAULT_ENGRAM_URL
	).replace(/\/+$/, "");
	const enabled = parseEnabled(env.DRENYRA_ENGRAM_ENABLED);
	const token = env.DRENYRA_ENGRAM_TOKEN?.trim();
	const timeoutMs = parseTimeoutMs(env.DRENYRA_ENGRAM_TIMEOUT_MS);

	const config: EngramConfig = { baseUrl, enabled, timeoutMs };
	if (token !== undefined && token.length > 0) config.token = token;
	return config;
}

/**
 * Whether the engram adapter is enabled for the current environment.
 *
 * Fail closed: any value other than "true"/"1" (or absence) disables the
 * adapter.
 */
export function isEngramEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
	return engramConfig(env).enabled;
}

function parseEnabled(raw: string | undefined): boolean {
	if (raw === undefined) return false;
	const value = raw.trim().toLowerCase();
	return value === "true" || value === "1";
}

function parseTimeoutMs(raw: string | undefined): number {
	if (raw === undefined) return DEFAULT_ENGRAM_TIMEOUT_MS;
	const parsed = parseInt(raw.trim(), 10);
	return Number.isNaN(parsed) || parsed <= 0
		? DEFAULT_ENGRAM_TIMEOUT_MS
		: parsed;
}
