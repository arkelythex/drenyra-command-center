export declare class CacheMetrics {
	private static hits;
	private static misses;
	static recordHit(): void;
	static recordMiss(): void;
	static getStats(): {
		hits: number;
		misses: number;
		hitRate: number;
	};
}
//# sourceMappingURL=metrics.d.ts.map
