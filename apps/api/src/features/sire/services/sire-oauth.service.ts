/**
 * SIRE OAuth token management.
 * Handles token caching, OAuth flow, and username building.
 */
import type { SireSubmissionConfig, TenantSunatContext } from "../types";

type OAuthTokenCacheEntry = { accessToken: string; expiresAt: number };

const oauthTokenCache = new Map<string, OAuthTokenCacheEntry>();

export async function resolveAuthToken(
	config: SireSubmissionConfig,
	tenantContext?: TenantSunatContext,
): Promise<string> {
	if (config.authMode === "token") return config.apiToken;
	if (config.authMode === "oauth-sol")
		return getOAuthToken(config, tenantContext);
	if (config.apiToken) return config.apiToken;
	if (hasOAuthCredentials(config)) return getOAuthToken(config, tenantContext);
	return "";
}

export function clearOAuthTokenCache(): void {
	oauthTokenCache.clear();
}

function hasOAuthCredentials(config: SireSubmissionConfig): boolean {
	return Boolean(
		config.oauth.clientId &&
			config.oauth.clientSecret &&
			config.oauth.solUsername &&
			config.oauth.solPassword,
	);
}

function getOAuthTokenUrl(config: SireSubmissionConfig): string {
	if (!config.oauth.clientId) {
		throw new Error("SUNAT_CLIENT_ID is required for OAuth SOL authentication");
	}
	const tokenPath = config.oauth.tokenPathTemplate.replace(
		"{clientId}",
		encodeURIComponent(config.oauth.clientId),
	);
	return new URL(tokenPath, config.oauth.baseUrl).toString();
}

function getTenantContextForOAuth(
	tenantContext: TenantSunatContext | undefined,
): TenantSunatContext {
	if (!tenantContext) {
		throw new Error(
			"Tenant SUNAT context is required for OAuth SOL authentication",
		);
	}
	return tenantContext;
}

function buildOAuthUsername(
	config: SireSubmissionConfig,
	tenantContext: TenantSunatContext,
): string {
	if (!config.oauth.solUsername) {
		throw new Error(
			"SUNAT_SOL_USERNAME is required for OAuth SOL authentication",
		);
	}
	if (config.oauth.solUsername.startsWith(tenantContext.ruc)) {
		return config.oauth.solUsername;
	}
	return `${tenantContext.ruc}${config.oauth.solUsername}`;
}

function buildOAuthCacheKey(tenantContext: TenantSunatContext): string {
	return JSON.stringify([
		tenantContext.ruc,
		tenantContext.credential.fingerprint,
		tenantContext.credential.scope,
	]);
}

async function getOAuthToken(
	config: SireSubmissionConfig,
	tenantContextInput?: TenantSunatContext,
): Promise<string> {
	const tenantContext = getTenantContextForOAuth(tenantContextInput);
	const cacheKey = buildOAuthCacheKey(tenantContext);
	const now = Date.now();
	const cached = oauthTokenCache.get(cacheKey);
	if (cached && cached.expiresAt > now + 60_000) {
		return cached.accessToken;
	}

	const tokenUrl = getOAuthTokenUrl(config);
	const oauthUsername = buildOAuthUsername(config, tenantContext);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

	try {
		const response = await fetch(tokenUrl, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: "password",
				scope: config.oauth.scope,
				client_id: config.oauth.clientId,
				client_secret: config.oauth.clientSecret,
				username: oauthUsername,
				password: config.oauth.solPassword,
			}),
			signal: controller.signal,
		});

		const payload = await readPayload(response);
		if (!response.ok) {
			throw new Error(
				`SUNAT OAuth failed (${response.status}): ${buildPayloadDetails(payload)}`,
			);
		}

		const payloadObject = asObject(payload);
		const accessToken = readString(payloadObject, ["access_token"]);
		if (!accessToken)
			throw new Error("SUNAT OAuth response missing access_token");

		const expiresInSeconds = readNumber(payloadObject, ["expires_in"]) ?? 3600;
		oauthTokenCache.set(cacheKey, {
			accessToken,
			expiresAt: now + expiresInSeconds * 1000,
		});

		return accessToken;
	} catch (error: unknown) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`SUNAT OAuth timeout after ${config.timeoutMs}ms`);
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

async function readPayload(response: Response): Promise<unknown> {
	const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
	if (contentType.includes("application/json")) return response.json();
	const text = await response.text();
	return text.trim() ? text : null;
}

function buildPayloadDetails(payload: unknown): string {
	const payloadObject = asObject(payload);
	return (
		readString(payloadObject, [
			"message",
			"error",
			"detail",
			"error_description",
		]) ?? (typeof payload === "string" ? payload : "No details")
	);
}

function asObject(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
}

function readString(
	payload: Record<string, unknown> | null,
	keys: string[],
): string | undefined {
	if (!payload) return undefined;
	for (const key of keys) {
		const value = payload[key];
		if (typeof value === "string" && value.trim()) return value.trim();
		if (typeof value === "number" && Number.isFinite(value))
			return value.toString();
	}
	return undefined;
}

function readNumber(
	payload: Record<string, unknown> | null,
	keys: string[],
): number | undefined {
	if (!payload) return undefined;
	for (const key of keys) {
		const value = payload[key];
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (typeof value === "string") {
			const parsed = Number(value);
			if (Number.isFinite(parsed)) return parsed;
		}
	}
	return undefined;
}
