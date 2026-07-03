/**
 * CORS origin resolution.
 *
 * Reads origins from (in priority order):
 * 1. `CORS_ALLOWED_ORIGINS` env var (comma-separated)
 * 2. `FRONTEND_URL` + `LANDING_URL` env vars (individual, also comma-separated)
 * 3. Dev defaults for local development
 *
 * In production, at least one origin must be configured or requests
 * from browsers will be blocked.
 *
 * @module config/cors
 */

const DEV_ORIGIN_DEFAULTS = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:4173",
	"http://127.0.0.1:4173",
];

/**
 * Parse a comma-separated string into a deduplicated array of origins.
 */
function parseOrigins(raw: string): string[] {
	return Array.from(
		new Set(
			raw
				.split(",")
				.map((o) => o.trim())
				.filter(Boolean),
		),
	);
}

export function resolveCorsOrigins(
	env: Record<string, string | undefined> = process.env,
): string[] {
	// 1. Explicit CORS_ALLOWED_ORIGINS (highest priority)
	const corsAllowed = (env.CORS_ALLOWED_ORIGINS ?? "").trim();
	if (corsAllowed.length > 0) {
		return parseOrigins(corsAllowed);
	}

	// 2. FRONTEND_URL + LANDING_URL (legacy ALLOWED_ORIGINS fallback)
	const legacy = (env.ALLOWED_ORIGINS ?? "").trim();
	if (legacy.length > 0) {
		return parseOrigins(legacy);
	}

	const frontendUrl = (env.FRONTEND_URL ?? "").trim();
	const landingUrl = (env.LANDING_URL ?? "").trim();
	if (frontendUrl || landingUrl) {
		return [frontendUrl, landingUrl].filter(Boolean);
	}

	// 3. Dev defaults (non-production only)
	const nodeEnv = (env.NODE_ENV ?? "development").toLowerCase();
	if (nodeEnv !== "production") {
		return DEV_ORIGIN_DEFAULTS;
	}

	return [];
}
