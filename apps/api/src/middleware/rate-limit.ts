/**
 * @deprecated Use `@arkelythex/platform-core/config/rate-limit` instead.
 * This file will be removed in the next major version.
 *
 * Rate Limiting Middleware for ARKELYTHEX API
 * Protects against brute force attacks and DoS
 *
 * Best Practices 2026:
 * - Different limits per endpoint sensitivity
 * - Redis-based for distributed systems
 * - Graceful degradation with in-memory fallback
 * - Clear error messages with Retry-After header
 *
 * @module RateLimiter
 */

import type { Context } from "elysia";

type ExtendedContext = Context & {
	user?: { id: string };
	request: Request & { ip?: string };
	response?: { headers?: { set: (key: string, value: string) => void } };
};

// Rate limit store (Redis in production, Map in development)
interface RateLimitStore {
	get(key: string): Promise<{ count: number; resetTime: number } | null>;
	set(
		key: string,
		value: { count: number; resetTime: number },
		ttl: number,
	): Promise<void>;
	increment(key: string): Promise<number>;
}

// In-memory implementation for development/single instance
class MemoryRateLimitStore implements RateLimitStore {
	private store = new Map<string, { count: number; resetTime: number }>();

	async get(key: string): Promise<{ count: number; resetTime: number } | null> {
		const entry = this.store.get(key);
		if (!entry) return null;

		// Clean expired entries
		if (Date.now() > entry.resetTime) {
			this.store.delete(key);
			return null;
		}

		return entry;
	}

	async set(
		key: string,
		value: { count: number; resetTime: number },
		ttl: number,
	): Promise<void> {
		this.store.set(key, value);

		// Auto-cleanup after TTL
		setTimeout(() => {
			this.store.delete(key);
		}, ttl * 1000);
	}

	async increment(key: string): Promise<number> {
		const entry = this.store.get(key);
		if (!entry) return 0;

		entry.count += 1;
		return entry.count;
	}
}

// Configuration for different endpoint types
export interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Max requests per window
	message?: string; // Custom error message
	skipSuccessfulRequests?: boolean; // Don't count successful requests
}

// Default configurations for different sensitivity levels
export const RATE_LIMITS = {
	// Public endpoints - generous limits
	PUBLIC: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 100, // 100 requests per minute
		message: "Too many requests from this IP",
	} as RateLimitConfig,

	// Authentication endpoints - strict limits
	AUTH: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		maxRequests: 5, // 5 attempts per 15 minutes
		message: "Too many authentication attempts. Please try again later.",
	} as RateLimitConfig,

	// API endpoints - moderate limits
	API: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 60, // 60 requests per minute
		message: "API rate limit exceeded",
	} as RateLimitConfig,

	// Sensitive operations - very strict
	SENSITIVE: {
		windowMs: 60 * 60 * 1000, // 1 hour
		maxRequests: 10, // 10 requests per hour
		message: "Too many sensitive operations. Please try again later.",
	} as RateLimitConfig,

	// SUNAT integration - strict to avoid API bans
	SUNAT: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 30, // 30 requests per minute (SUNAT limit)
		message: "SUNAT rate limit approaching",
	} as RateLimitConfig,
} as const;

// Generate rate limit key from request
function generateKey(context: ExtendedContext, identifier?: string): string {
	// Prefer Better Auth identity, then legacy UUID, then network identity.
	const userId =
		context.headers?.["x-auth-user-id"] ||
		context.headers?.["x-user-id"] ||
		context.user?.id ||
		context.headers?.["x-forwarded-for"] ||
		context.request?.ip ||
		"unknown";

	const path = context.path || context.request?.url || "unknown";

	return identifier
		? `ratelimit:${identifier}:${userId}`
		: `ratelimit:${path}:${userId}`;
}

// Rate limiter class
export class RateLimiter {
	private store: RateLimitStore;

	constructor(store?: RateLimitStore) {
		this.store = store || new MemoryRateLimitStore();
	}

	/**
	 * Check if request exceeds rate limit
	 */
	async checkLimit(
		context: ExtendedContext,
		config: RateLimitConfig = RATE_LIMITS.API,
		identifier?: string,
	): Promise<{ allowed: boolean; retryAfter?: number; remaining?: number }> {
		const key = generateKey(context, identifier);
		const now = Date.now();

		const entry = await this.store.get(key);

		if (!entry) {
			// First request - create new entry
			await this.store.set(
				key,
				{
					count: 1,
					resetTime: now + config.windowMs,
				},
				Math.ceil(config.windowMs / 1000),
			);

			return {
				allowed: true,
				remaining: config.maxRequests - 1,
			};
		}

		// Check if window has reset
		if (now > entry.resetTime) {
			await this.store.set(
				key,
				{
					count: 1,
					resetTime: now + config.windowMs,
				},
				Math.ceil(config.windowMs / 1000),
			);

			return {
				allowed: true,
				remaining: config.maxRequests - 1,
			};
		}

		// Check limit
		if (entry.count >= config.maxRequests) {
			const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

			return {
				allowed: false,
				retryAfter,
				remaining: 0,
			};
		}

		// Increment counter
		const newCount = await this.store.increment(key);

		return {
			allowed: true,
			remaining: Math.max(0, config.maxRequests - newCount),
		};
	}

	/**
	 * Middleware for Elysia
	 */
	middleware(config: RateLimitConfig = RATE_LIMITS.API, identifier?: string) {
		return async (context: ExtendedContext) => {
			const result = await this.checkLimit(context, config, identifier);

			if (!result.allowed) {
				// Set rate limit headers
				const headers = new Headers();
				headers.set("Retry-After", String(result.retryAfter));
				headers.set("X-RateLimit-Limit", String(config.maxRequests));
				headers.set("X-RateLimit-Remaining", "0");
				headers.set(
					"X-RateLimit-Reset",
					String(Math.ceil(Date.now() / 1000) + (result.retryAfter || 0)),
				);

				return new Response(
					JSON.stringify({
						error: "Too Many Requests",
						message: config.message || "Rate limit exceeded",
						retryAfter: result.retryAfter,
					}),
					{
						status: 429,
						headers,
					},
				);
			}

			// Set remaining headers on successful request
			if (result.remaining !== undefined) {
				const response = context.response;
				if (response?.headers) {
					response.headers.set("X-RateLimit-Limit", String(config.maxRequests));
					response.headers.set(
						"X-RateLimit-Remaining",
						String(result.remaining),
					);
				}
			}

			return undefined; // Continue to next handler
		};
	}
}

// Convenience exports
export const rateLimiter = new RateLimiter();

// Pre-configured middlewares
export const authRateLimit = rateLimiter.middleware(RATE_LIMITS.AUTH, "auth");
export const apiRateLimit = rateLimiter.middleware(RATE_LIMITS.API);
export const sunatRateLimit = rateLimiter.middleware(
	RATE_LIMITS.SUNAT,
	"sunat",
);
export const sensitiveRateLimit = rateLimiter.middleware(
	RATE_LIMITS.SENSITIVE,
	"sensitive",
);

export default rateLimiter;
