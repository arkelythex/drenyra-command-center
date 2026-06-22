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
    this.hits += 1;
  }

  static recordMiss(): void {
    this.misses += 1;
  }

  static snapshot(): { hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : this.hits / total,
    };
  }
}
