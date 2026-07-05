/**
 * SIRE Rate Limiting Middleware
 *
 * Prevents abuse of SIRE submission endpoint by enforcing rate limits per company.
 *
 * **Rate Limiting Strategy:**
 * - Sliding window: last 1 minute
 * - Default limit: 10 requests per minute per company
 * - Configurable via SIRE_RATE_LIMIT_MAX_REQUESTS env var
 * - 429 status code when limit exceeded
 *
 * **SUNAT Compliance:**
 * - Prevents accidental duplicate submissions
 * - Protects against API quota exhaustion
 * - Audit trail of rate limit violations
 */

import { Elysia } from "elysia";
import { fail } from "../../shared/api-response";
import { resolveSireCompanyId } from "./request-company-id";

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
	maxRequests: number; // Max requests per window
	windowMinutes: number; // Time window in minutes
}

const requestLog = new Map<string, number[]>();

/**
 * Get rate limit config from environment
 */
function getRateLimitConfig(): RateLimitConfig {
	const maxRequests = Number.parseInt(
		process.env.SIRE_RATE_LIMIT_MAX_REQUESTS ?? "10",
		10,
	);
	const windowMinutes = Number.parseInt(
		process.env.SIRE_RATE_LIMIT_WINDOW_MINUTES ?? "1",
		10,
	);

	return {
		maxRequests:
			Number.isFinite(maxRequests) && maxRequests > 0 ? maxRequests : 10,
		windowMinutes:
			Number.isFinite(windowMinutes) && windowMinutes > 0 ? windowMinutes : 1,
	};
}

/**
 * Rate limiting middleware for SIRE submissions
 * @returns Result of enforceSireRateLimit.
 * @example
 * ```ts
 * const result = enforceSireRateLimit(undefined);
 * console.log(result);
 * ```
 */

export function enforceSireRateLimit({
	body,
	query,
	request,
	set,
}: {
	body: unknown;
	query: unknown;
	request: Request;
	set: { status: number; headers: Record<string, string> };
}) {
	const companyId = resolveSireCompanyId({ body, query, request });

	if (!companyId) {
		return;
	}

	const config = getRateLimitConfig();
	const now = Date.now();
	const windowStart = now - config.windowMinutes * 60 * 1000;
	const key = `${request.method}:${new URL(request.url).pathname}:${companyId}`;
	const previous = requestLog.get(key) ?? [];
	const activeWindow = previous.filter((timestamp) => timestamp > windowStart);

	if (activeWindow.length >= config.maxRequests) {
		set.status = 429;
		set.headers["Retry-After"] = String(config.windowMinutes * 60);
		return fail(
			`Rate limit exceeded: max ${config.maxRequests} requests per ${config.windowMinutes} minutes for company ${companyId}.`,
			"SIRE_RATE_LIMIT_EXCEEDED",
		);
	}

	activeWindow.push(now);
	requestLog.set(key, activeWindow);

	return;
}

/** Minimal context shape accepted by the rate-limit middleware function */
type RateLimitMiddlewareContext = {
	body: unknown;
	query: unknown;
	request: Request;
	set: { status: number; headers: Record<string, string> };
};

/**
 * Elysia plugin that enforces per-RUC rate limiting on SIRE submission endpoints.
 * Returns HTTP 429 with `Retry-After` header when the limit is exceeded.
 *
 * @example
 * ```ts
 * app.use(rateLimitMiddleware);
 * ```
 */
export const rateLimitMiddleware = new Elysia({
	name: "sire-rate-limit",
}).onBeforeHandle((context) => {
	return enforceSireRateLimit(context as unknown as RateLimitMiddlewareContext);
});

/**
 * resetSireRateLimitStateForTests operation.
 *
 * @returns Result of resetSireRateLimitStateForTests.
 * @example
 * ```ts
 * const result = resetSireRateLimitStateForTests();
 * console.log(result);
 * ```
 */
export function resetSireRateLimitStateForTests(): void {
	requestLog.clear();
}
