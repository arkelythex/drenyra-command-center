type CacheEntry = {
	value: string;
	expiresAt: number;
};

class InMemoryRedisLike {
	private store = new Map<string, CacheEntry>();

	async get(key: string): Promise<string | null> {
		const entry = this.store.get(key);
		if (!entry) {
			return null;
		}

		if (entry.expiresAt <= Date.now()) {
			this.store.delete(key);
			return null;
		}

		return entry.value;
	}

	async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
		this.store.set(key, {
			value,
			expiresAt: Date.now() + ttlSeconds * 1000,
		});
	}
}

/**
 * CACHE_TTL const.
 *
 * @example
 * ```ts
 * console.log(CACHE_TTL);
 * ```
 */
export const CACHE_TTL = {
	AI_CLASSIFICATION: 60 * 30, // 30 minutes
} as const;

/**
 * redis const.
 *
 * @example
 * ```ts
 * console.log(redis);
 * ```
 */
export const redis = new InMemoryRedisLike();
