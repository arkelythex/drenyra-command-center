export class CacheMetrics {
	static hits = 0;
	static misses = 0;
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
//# sourceMappingURL=metrics.js.map
