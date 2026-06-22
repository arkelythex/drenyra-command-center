/**
 * Validation Cache Service
 * In-memory LRU cache to avoid re-validating same CPE
 *
 * Performance: O(1) get/set with Map
 * Eviction: LRU (Least Recently Used)
 */

import type { CpeNumber } from "../value-objects/cpe-number.vo";
import type { ValidationResult } from "../value-objects/validation-result.vo";

interface CacheEntry {
	result: ValidationResult;
	cachedAt: Date;
	accessCount: number;
}

/**
 * ValidationCacheService class.
 *
 * @example
 * ```ts
 * const value = new ValidationCacheService();
 * console.log(value);
 * ```
 */
export class ValidationCacheService {
	private cache = new Map<string, CacheEntry>();
	private readonly maxSize: number;
	private readonly ttlMs: number;

	constructor(maxSize = 1000, ttlMs = 3600000) {
		// 1h TTL
		this.maxSize = maxSize;
		this.ttlMs = ttlMs;
	}

	/**
	 * Get cached validation result
	 */
	get(cpeNumber: CpeNumber): ValidationResult | null {
		const key = cpeNumber.toString();
		const entry = this.cache.get(key);

		if (!entry) return null;

		// Check TTL expiration
		const age = Date.now() - entry.cachedAt.getTime();
		if (age > this.ttlMs) {
			this.cache.delete(key);
			return null;
		}

		// Update access count (for LRU)
		entry.accessCount++;

		return entry.result;
	}

	/**
	 * Set validation result in cache
	 */
	set(cpeNumber: CpeNumber, result: ValidationResult): void {
		const key = cpeNumber.toString();

		// Evict LRU if cache is full
		if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
			this.evictLRU();
		}

		this.cache.set(key, {
			result,
			cachedAt: new Date(),
			accessCount: 1,
		});
	}

	/**
	 * Clear cache
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get cache stats
	 */
	getStats() {
		return {
			size: this.cache.size,
			maxSize: this.maxSize,
			utilizationPercent: (this.cache.size / this.maxSize) * 100,
		};
	}

	/**
	 * Evict least recently used entry
	 */
	private evictLRU(): void {
		let lruKey: string | null = null;
		let minAccessCount = Number.POSITIVE_INFINITY;

		for (const [key, entry] of this.cache.entries()) {
			if (entry.accessCount < minAccessCount) {
				minAccessCount = entry.accessCount;
				lruKey = key;
			}
		}

		if (lruKey) {
			this.cache.delete(lruKey);
		}
	}
}
