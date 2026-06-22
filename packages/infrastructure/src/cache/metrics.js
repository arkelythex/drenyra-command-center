export class CacheMetrics {
    static hits = 0;
    static misses = 0;
    static recordHit() {
        this.hits += 1;
    }
    static recordMiss() {
        this.misses += 1;
    }
    static getStats() {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? (this.hits / total) * 100 : 0,
        };
    }
}
//# sourceMappingURL=metrics.js.map