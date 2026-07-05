/**
 * Cache Layer for Agent Results
 *
 * Caches agent results to reduce costs and improve performance.
 * Uses in-memory cache for POC (can be upgraded to Redis later).
 *
 * @module ai-swarm/tools
 */

import { createHash } from "node:crypto";

/**
 * Cache entry
 */
interface CacheEntry<T> {
	data: T;
	timestamp: Date;
	ttl: number; // milliseconds
	hits: number;
}

/**
 * Cache statistics
 * @example
 * ```ts
 * const value: CacheStats = {} as CacheStats;
 * console.log(value);
 * ```
 */

export interface CacheStats {
	size: number;
	hits: number;
	misses: number;
	hitRate: number;
	totalSavingsUsd: number;
}

/**
 * Agent Result Cache
 *
 * In-memory cache with TTL and LRU eviction
 * @example
 * ```ts
 * const value = new AgentCache();
 * console.log(value);
 * ```
 */

export class AgentCache {
	private cache: Map<string, CacheEntry<unknown>>;
	private maxSize: number;
	private defaultTtl: number;
	private stats: { hits: number; misses: number; savings: number };

	constructor(options?: { maxSize?: number; defaultTtl?: number }) {
		this.cache = new Map();
		this.maxSize = options?.maxSize || 1000;
		this.defaultTtl = options?.defaultTtl || 7 * 24 * 60 * 60 * 1000; // 7 days
		this.stats = { hits: 0, misses: 0, savings: 0 };
	}

	/**
	 * Generate cache key from input
	 */
	private generateKey(prefix: string, data: unknown): string {
		const hash = createHash("sha256")
			.update(JSON.stringify(data))
			.digest("hex")
			.slice(0, 16);
		return `${prefix}:${hash}`;
	}

	/**
	 * Get cached result
	 */
	get<T>(prefix: string, input: unknown): T | null {
		const key = this.generateKey(prefix, input);
		const entry = this.cache.get(key) as CacheEntry<T> | undefined;

		if (!entry) {
			this.stats.misses++;
			return null;
		}

		// Check if expired
		const now = Date.now();
		const age = now - entry.timestamp.getTime();

		if (age > entry.ttl) {
			this.cache.delete(key);
			this.stats.misses++;
			return null;
		}

		// Update hits
		entry.hits++;
		this.stats.hits++;

		// LRU: move to the end (most recently used)
		this.cache.delete(key);
		this.cache.set(key, entry as CacheEntry<unknown>);

		return entry.data;
	}

	/**
	 * Set cache entry
	 */
	set<T>(
		prefix: string,
		input: unknown,
		data: T,
		costUsd: number,
		ttl?: number,
	): void {
		const key = this.generateKey(prefix, input);

		// Overwriting an existing key should refresh recency without evicting.
		if (this.cache.has(key)) {
			this.cache.delete(key);
		} else if (this.cache.size >= this.maxSize) {
			this.evictOldest();
		}

		this.cache.set(key, {
			data,
			timestamp: new Date(),
			ttl: ttl || this.defaultTtl,
			hits: 0,
		});

		// Track potential savings (if this is used again, we save this cost)
		this.stats.savings += costUsd;
	}

	/**
	 * Evict oldest entry (LRU)
	 */
	private evictOldest(): void {
		const first = this.cache.keys().next();
		if (!first.done) this.cache.delete(first.value);
	}

	/**
	 * Clear cache
	 */
	clear(): void {
		this.cache.clear();
		this.stats = { hits: 0, misses: 0, savings: 0 };
	}

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats {
		const total = this.stats.hits + this.stats.misses;
		const hitRate = total > 0 ? this.stats.hits / total : 0;

		return {
			size: this.cache.size,
			hits: this.stats.hits,
			misses: this.stats.misses,
			hitRate,
			totalSavingsUsd: this.stats.savings,
		};
	}

	/**
	 * Get entries by prefix (for debugging)
	 */
	getEntriesByPrefix(
		prefix: string,
	): Array<{ key: string; hits: number; age: number }> {
		const entries: Array<{ key: string; hits: number; age: number }> = [];
		const now = Date.now();

		for (const [key, entry] of this.cache.entries()) {
			if (key.startsWith(prefix)) {
				entries.push({
					key,
					hits: entry.hits,
					age: now - entry.timestamp.getTime(),
				});
			}
		}

		return entries;
	}
}

// Global cache instance
/**
 * agentCache const.
 *
 * @example
 * ```ts
 * console.log(agentCache);
 * ```
 */
export const agentCache = new AgentCache({
	maxSize: 10000,
	defaultTtl: 7 * 24 * 60 * 60 * 1000, // 7 days
});
