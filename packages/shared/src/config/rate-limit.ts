import type { Elysia } from "elysia";

export interface RateLimitConfig {
	max: number;
	windowMs: number;
	message?: string;
}

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

interface RateLimitStore {
	get(key: string): RateLimitEntry | null;
	set(key: string, entry: RateLimitEntry): void;
	delete(key: string): void;
	entries(): IterableIterator<[string, RateLimitEntry]>;
}

class MemoryStore implements RateLimitStore {
	private store = new Map<string, RateLimitEntry>();

	get(key: string) {
		return this.store.get(key) ?? null;
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

const defaultStore: RateLimitStore = new MemoryStore();

const cleanup = setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of defaultStore.entries()) {
		if (entry.resetTime < now) defaultStore.delete(key);
	}
}, 300_000);
cleanup.unref?.();

function getClientIp(request: Request): string {
	const realIp = request.headers.get("x-real-ip");
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		const first = forwardedFor.split(",")[0];
		if (first !== undefined) return first.trim();
	}
	return realIp || "unknown";
}

export function rateLimitMiddleware(config: RateLimitConfig) {
	const {
		max,
		windowMs,
		message = "Too many requests. Try again later.",
	} = config;

	return (app: Elysia) =>
		app.derive(({ request, set }) => {
			const clientId = getClientIp(request);
			const now = Date.now();

			let entry = defaultStore.get(clientId);
			if (!entry || entry.resetTime < now) {
				entry = { count: 1, resetTime: now + windowMs };
				defaultStore.set(clientId, entry);
			} else {
				entry.count++;
			}

			set.headers["X-RateLimit-Limit"] = String(max);
			set.headers["X-RateLimit-Remaining"] = String(
				Math.max(0, max - entry.count),
			);
			set.headers["X-RateLimit-Reset"] = String(entry.resetTime);

			if (entry.count > max) {
				set.status = 429;
				const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
				set.headers["Retry-After"] = String(retryAfter);
				throw new Error(message);
			}

			return {};
		});
}

export const strictRateLimit = rateLimitMiddleware({
	max: 5,
	windowMs: 60_000,
});
export const standardRateLimit = rateLimitMiddleware({
	max: 10,
	windowMs: 60_000,
});
export const lenientRateLimit = rateLimitMiddleware({
	max: 30,
	windowMs: 60_000,
});
