const FALLBACK_API_URL = "http://localhost:3000";
const FALLBACK_TIMEOUT_MS = 10_000;
const FALLBACK_MONITORING_ENABLED = import.meta.env.PROD;
const FALLBACK_WEB_VITALS_ENABLED = true;
const FALLBACK_SENTRY_SCRIPT_URL =
	"https://browser.sentry-cdn.com/8.33.0/bundle.tracing.replay.min.js";
const FALLBACK_PLAUSIBLE_API_HOST = "https://plausible.io";

function parseBooleanEnv(value: unknown, defaultValue = false): boolean {
	if (typeof value !== "string") return defaultValue;
	const normalized = value.trim().toLowerCase();
	return normalized === "1" || normalized === "true" || normalized === "yes";
}

function parseNumberEnv(value: unknown, defaultValue: number): number {
	if (typeof value !== "string") return defaultValue;
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function parseRateEnv(value: unknown, defaultValue: number): number {
	if (typeof value !== "string") return defaultValue;
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
		? parsed
		: defaultValue;
}

function parseStringEnv(value: unknown, defaultValue = ""): string {
	if (typeof value !== "string") return defaultValue;
	return value.trim();
}

function resolveBrowserOrigin(): string | null {
	if (typeof window !== "undefined" && window.location?.origin) {
		return window.location.origin;
	}
	return null;
}

/**
 * When `VITE_API_URL` points at another loopback port (e.g. :3000) while the SPA runs on
 * :5173, calling the API cross-origin stores session cookies on :3000 — the browser will not
 * send them on same-origin `/api/*` requests from :5173. Prefer the page origin so the Vite
 * proxy keeps cookies first-party. Non-loopback production split (app vs API host) is unchanged.
 */
function shouldPreferBrowserOriginOverEnvApi(
	envApiUrl: string,
	browserOrigin: string,
): boolean {
	try {
		const page = new URL(browserOrigin);
		const api = new URL(envApiUrl);
		const isLoopback = (host: string) =>
			host === "localhost" || host === "127.0.0.1" || host === "[::1]";
		if (!isLoopback(page.hostname) || !isLoopback(api.hostname)) return false;
		return page.origin !== api.origin;
	} catch {
		return false;
	}
}

function resolveApiUrl(): string {
	const fromEnv = parseStringEnv(import.meta.env.VITE_API_URL);
	const browserOrigin = resolveBrowserOrigin();

	if (
		fromEnv &&
		browserOrigin &&
		shouldPreferBrowserOriginOverEnvApi(fromEnv, browserOrigin)
	) {
		return browserOrigin;
	}

	if (fromEnv) return fromEnv;
	if (browserOrigin) return browserOrigin;
	return FALLBACK_API_URL;
}

export const runtimeConfig = {
	// Prefer same-origin in browser when VITE_API_URL is unset, or when it targets another
	// loopback port than the SPA (see `shouldPreferBrowserOriginOverEnvApi`), so `/api/*`
	// uses the Vite proxy and session cookies stay first-party.
	apiUrl: resolveApiUrl(),
	// Preserve direct API base for non-proxied surfaces (e.g. /inbox/* routes).
	directApiUrl: parseStringEnv(import.meta.env.VITE_API_URL, FALLBACK_API_URL),
	requestTimeoutMs: parseNumberEnv(
		import.meta.env.VITE_HTTP_TIMEOUT_MS,
		FALLBACK_TIMEOUT_MS,
	),
	mockMode: parseBooleanEnv(import.meta.env.VITE_FRONTEND_MOCK_MODE, false),
	monitoringEnabled: parseBooleanEnv(
		import.meta.env.VITE_MONITORING_ENABLED,
		FALLBACK_MONITORING_ENABLED,
	),
	monitoringEndpoint: parseStringEnv(import.meta.env.VITE_MONITORING_ENDPOINT),
	monitoringKey: parseStringEnv(import.meta.env.VITE_MONITORING_KEY),
	webVitalsEnabled: parseBooleanEnv(
		import.meta.env.VITE_WEB_VITALS_ENABLED,
		FALLBACK_WEB_VITALS_ENABLED,
	),
	sentryDsn: parseStringEnv(import.meta.env.VITE_SENTRY_DSN),
	sentryEnvironment: parseStringEnv(
		import.meta.env.VITE_SENTRY_ENVIRONMENT,
		import.meta.env.MODE,
	),
	sentryTracesSampleRate: parseRateEnv(
		import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
		0.2,
	),
	sentryReplaysSessionSampleRate: parseRateEnv(
		import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
		0.1,
	),
	sentryReplaysOnErrorSampleRate: parseRateEnv(
		import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
		1.0,
	),
	sentryScriptUrl: parseStringEnv(
		import.meta.env.VITE_SENTRY_SCRIPT_URL,
		FALLBACK_SENTRY_SCRIPT_URL,
	),
	plausibleDomain: parseStringEnv(import.meta.env.VITE_PLAUSIBLE_DOMAIN),
	plausibleApiHost: parseStringEnv(
		import.meta.env.VITE_PLAUSIBLE_API_HOST,
		FALLBACK_PLAUSIBLE_API_HOST,
	),
};
