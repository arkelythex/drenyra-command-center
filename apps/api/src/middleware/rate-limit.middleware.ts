/**
 * @deprecated Use `@drenyra/shared/config/rate-limit` instead.
 * This file will be removed in the next major version.
 *
 * Rate Limiting Middleware for Elysia
 *
 * Simple in-memory rate limiter to prevent abuse.
 * For production, use Redis-backed limiter.
 *
 * @example
 * app.use(rateLimitMiddleware({ max: 10, windowMs: 60000 }))
 */

import type { Elysia } from "elysia";
import { createLogger } from "../lib/logger";

interface RateLimitConfig {
	max: number; // Max requests per window
	windowMs: number; // Time window in milliseconds
	message?: string;
}

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

// Auto-select store based on environment
interface RateLimitStore {
	get(key: string): RateLimitEntry | null;
	set(key: string, entry: RateLimitEntry): void;
	delete(key: string): void;
	entries(): IterableIterator<[string, RateLimitEntry]>;
}

class MemoryStore implements RateLimitStore {
	private store = new Map<string, RateLimitEntry>();

	get(key: string) {
		return this.store.get(key) || null;
	}

	set(key: string, entry: RateLimitEntry) {
		this.store.set(key, entry);
	}

	delete(key: string) {
		this.store.delete(key);
	}

	entries() {
		return this.store.entries();
	}
}

// Use in-memory for now (Redis implementation in rate-limit-redis.middleware.ts)
// To use Redis: import from rate-limit.ts instead
const store: RateLimitStore = new MemoryStore();
const logger = createLogger({ module: "rate-limit-middleware" });

logger.info(
	{ store: "memory", environment: process.env.NODE_ENV ?? "development" },
	"Using in-memory rate limiter",
);

// Cleanup old entries every 5 minutes
const cleanupInterval = setInterval(
	() => {
		const now = Date.now();
		for (const [key, entry] of store.entries()) {
			if (entry.resetTime < now) {
				store.delete(key);
			}
		}
	},
	5 * 60 * 1000,
);
// Avoid keeping test runners alive due to a long-lived interval.
cleanupInterval.unref?.();

/**
 * Trusted Proxy Configuration
 *
 * SECURITY: Only accept X-Forwarded-For from trusted proxies to prevent IP spoofing.
 *
 * Production Setup:
 * - Set TRUSTED_PROXIES env var with comma-separated IPs
 * - Example: TRUSTED_PROXIES=10.0.0.1,172.16.0.1,cloudflare
 *
 * Cloudflare IPs: https://www.cloudflare.com/ips/
 * Nginx: Usually 127.0.0.1 (local) or your LB IP
 *
 * @see https://owasp.org/www-community/attacks/Cross-Site_Request_Forgery_(CSRF)
 */
const TRUSTED_PROXIES = new Set(
	process.env.TRUSTED_PROXIES
		? process.env.TRUSTED_PROXIES.split(",").map((ip) => ip.trim())
		: ["127.0.0.1", "::1"], // Localhost only by default
);

/**
 * Cloudflare IP ranges (for production)
 * Enable with: TRUST_CLOUDFLARE=true
 */
const CLOUDFLARE_IP_RANGES = [
	// IPv4
	"173.245.48.0/20",
	"103.21.244.0/22",
	"103.22.200.0/22",
	"103.31.4.0/22",
	"141.101.64.0/18",
	"108.162.192.0/18",
	"190.93.240.0/20",
	"188.114.96.0/20",
	"197.234.240.0/22",
	"198.41.128.0/17",
	"162.158.0.0/15",
	"104.16.0.0/13",
	"104.24.0.0/14",
	"172.64.0.0/13",
	"131.0.72.0/22",
	// IPv6 (add if needed)
	// '2400:cb00::/32', '2606:4700::/32', ...
];

/**
 * Check if IP is within CIDR range
 */
function isIpInCidr(ip: string, cidr: string): boolean {
	// Simplified check - for production use ip-cidr npm package
	return ip.startsWith((cidr.split("/")[0] ?? "").split(".").slice(0, 2).join("."));
}

/**
 * Check if request comes from trusted proxy
 */
function isTrustedProxy(ip: string | null): boolean {
	if (!ip) return false;

	// Check exact match
	if (TRUSTED_PROXIES.has(ip)) return true;

	// Check Cloudflare (if enabled)
	if (process.env.TRUST_CLOUDFLARE === "true") {
		return CLOUDFLARE_IP_RANGES.some((range) => isIpInCidr(ip, range));
	}

	return false;
}

/**
 * Extract client identifier from request (anti-spoofing)
 *
 * SECURITY: Only trusts X-Forwarded-For if request comes from a trusted proxy.
 * Otherwise uses direct connection IP to prevent attackers from bypassing
 * rate limits by spoofing headers.
 *
 * Attack Scenario:
 * - Attacker sends: X-Forwarded-For: 1.2.3.4
 * - Without validation: rate limit applies to 1.2.3.4 (not attacker's IP)
 * - With validation: rate limit applies to attacker's real IP
 */
function getClientId(request: Request): string {
	// Get proxy IP (if available)
	const proxyIp = request.headers.get("x-real-ip") || null;

	// Only trust X-Forwarded-For if coming from trusted proxy
	if (isTrustedProxy(proxyIp)) {
		const forwardedFor = request.headers.get("x-forwarded-for");
		if (forwardedFor) {
			// Take first IP (original client)
			return (forwardedFor.split(",")[0] ?? "").trim();
		}
	}

	// Development fallback: if we don't have x-real-ip, allow x-forwarded-for.
	// In production, this is intentionally ignored unless coming from a trusted proxy.
	if ((process.env.NODE_ENV ?? "development") !== "production") {
		const forwardedFor = request.headers.get("x-forwarded-for");
		if (forwardedFor) return (forwardedFor.split(",")[0] ?? "").trim();
	}

	// Fallback: use direct connection IP (or proxy IP if no forwarding)
	return proxyIp || "unknown";
}

/**
 * Rate limit middleware factory
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
	const { max, windowMs, message = "Too many requests" } = config;

	return (app: Elysia) =>
		app.derive(({ request, set }) => {
			const clientId = getClientId(request);
			const now = Date.now();

			let entry = store.get(clientId);

			// Create new entry or reset if window expired
			if (!entry || entry.resetTime < now) {
				entry = {
					count: 0,
					resetTime: now + windowMs,
				};
				store.set(clientId, entry);
			}

			// Increment request count
			entry.count++;

			// Check if limit exceeded
			if (entry.count > max) {
				set.status = 429;
				const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
				set.headers["Retry-After"] = retryAfter.toString();
				set.headers["X-RateLimit-Limit"] = max.toString();
				set.headers["X-RateLimit-Remaining"] = "0";
				set.headers["X-RateLimit-Reset"] = entry.resetTime.toString();

				throw new Error(message);
			}

			// Add rate limit headers
			set.headers["X-RateLimit-Limit"] = max.toString();
			set.headers["X-RateLimit-Remaining"] = (max - entry.count).toString();
			set.headers["X-RateLimit-Reset"] = entry.resetTime.toString();

			return {};
		});
}

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimit = rateLimitMiddleware({
	max: 5,
	windowMs: 60000, // 5 requests per minute
	message: "Rate limit exceeded. Please try again later.",
});

/**
 * Standard rate limiter for normal endpoints
 */
export const standardRateLimit = rateLimitMiddleware({
	max: 10,
	windowMs: 60000, // 10 requests per minute
});

/**
 * Lenient rate limiter for read-heavy endpoints
 */
export const lenientRateLimit = rateLimitMiddleware({
	max: 30,
	windowMs: 60000, // 30 requests per minute
});
