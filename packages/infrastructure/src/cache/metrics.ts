/**
 * CacheMetrics class.
 *
 * @example
 * ```ts
 * const value = new CacheMetrics();
 * console.log(value);
 * ```
 */
export class CacheMetrics {
	private static hits = 0;
	private static misses = 0;

	static recordHit() {
		CacheMetrics.hits += 1;
	}

	static recordMiss() {
		CacheMetrics.misses += 1;
	}

	static getStats() {
		const total = CacheMetrics.hits + CacheMetrics.misses;

		return {
			hits: CacheMetrics.hits,
			misses: CacheMetrics.misses,
			hitRate: total > 0 ? (CacheMetrics.hits / total) * 100 : 0,
		};
	}
}
