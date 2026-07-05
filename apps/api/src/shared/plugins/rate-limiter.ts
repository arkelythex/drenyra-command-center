/**
 * Rate Limiter — Elysia Plugin
 *
 * In-memory rate limiting for API endpoints using a sliding window.
 * Per-company/per-user tracking with configurable limits per route group.
 *
 * ## Usage
 *
 * ```ts
 * // Global rate limit (100 req/min)
 * app.use(rateLimiter({ windowMs: 60_000, max: 100 }))
 *
 * // Strict auth rate limit (10 req/min)
 * authRoutes.use(rateLimiter({ windowMs: 60_000, max: 10 }))
 * ```
 *
 * @module rate-limiter
 */

import type { Elysia } from "elysia";

export interface RateLimiterOptions {
	/** Time window in milliseconds (default: 60_000 = 1 min) */
	windowMs?: number;
	/** Max requests per window (default: 100) */
	max?: number;
	/** Optional route prefix for scoped limits */
	prefix?: string;
	/** Status code when rate limited (default: 429) */
	statusCode?: number;
	/** Error message (default: "Demasiadas requests. Intente en 60 segundos.") */
	message?: string;
}

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(prefix: string): Map<string, RateLimitEntry> {
	if (!stores.has(prefix)) {
		stores.set(prefix, new Map());
	}
	return stores.get(prefix)!;
}

function cleanup() {
	const now = Date.now();
	for (const [, store] of stores) {
		for (const [key, entry] of store) {
			if (entry.resetAt <= now) {
				store.delete(key);
			}
		}
	}
}

// Cleanup expired entries every 60s
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
	if (!cleanupInterval) {
		cleanupInterval = setInterval(cleanup, 60_000);
		// Allow process to exit even if interval is active
		if (typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
			(cleanupInterval as ReturnType<typeof setInterval>).unref?.();
		}
	}
}

/**
 * In-memory rate limiter Elysia plugin.
 *
 * Tracks requests by company ID (from companyContext) or user identity
 * (from authorization header) using a sliding window algorithm.
 */
export function rateLimiter(options: RateLimiterOptions = {}) {
	const {
		windowMs = 60_000,
		max = 100,
		prefix = "global",
		statusCode = 429,
		message = "Demasiadas requests. Intente en 60 segundos.",
	} = options;

	ensureCleanup();

	return (app: Elysia) =>
		app.onBeforeHandle(async ({ request, store, set }) => {
			const store_ = store as Record<string, unknown>;
			const companyContext = store_["companyContext"] as
				| { companyId?: string; userId?: string }
				| undefined;

			// Use company ID if available, fall back to auth header or IP
			const key =
				companyContext?.companyId ??
				request.headers.get("authorization") ??
				request.headers.get("x-forwarded-for") ??
				"anonymous";

			const now = Date.now();
			const store_entries = getStore(prefix);

			let entry = store_entries.get(key);
			if (!entry || entry.resetAt <= now) {
				entry = { count: 0, resetAt: now + windowMs };
				store_entries.set(key, entry);
			}

			entry.count++;

			// Set rate limit headers
			const remaining = Math.max(0, max - entry.count);
			const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

			(set.headers as Record<string, string | number>)["X-RateLimit-Limit"] =
				max;
			(set.headers as Record<string, string | number>)[
				"X-RateLimit-Remaining"
			] = remaining;
			(set.headers as Record<string, string | number>)["X-RateLimit-Reset"] =
				resetSeconds;

			if (entry.count > max) {
				set.status = statusCode;
				throw new Error(message);
			}
		});
}
