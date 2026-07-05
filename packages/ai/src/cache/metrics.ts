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

	static recordHit(): void {
		CacheMetrics.hits += 1;
	}

	static recordMiss(): void {
		CacheMetrics.misses += 1;
	}

	static snapshot(): { hits: number; misses: number; hitRate: number } {
		const total = CacheMetrics.hits + CacheMetrics.misses;
		return {
			hits: CacheMetrics.hits,
			misses: CacheMetrics.misses,
			hitRate: total === 0 ? 0 : CacheMetrics.hits / total,
		};
	}
}
