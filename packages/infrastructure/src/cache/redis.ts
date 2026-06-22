/**
 * Redis Cache Infrastructure
 *
 * Provides caching utilities using Upstash Redis for
 * frequently accessed data like Chart of Accounts.
 *
 * Week 3: Performance & Scalability - Elite 2026
 */

import type { Redis } from "@upstash/redis";

// ============================================
// REDIS CLIENT
// ============================================

/**
 * Get Redis client with fallback for development
 */
async function getRedisClient(): Promise<Redis | null> {
	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;

	if (!url || !token) {
		if (process.env.NODE_ENV === "production") {
			console.warn(
				"[CACHE] Redis not configured in production. Caching disabled.",
			);
		}
		return null;
	}

	const { Redis } = await import("@upstash/redis");
	return new Redis({ url, token });
}

// Singleton
let redisClient: Redis | null | undefined;

async function redis(): Promise<Redis | null> {
	if (redisClient === undefined) {
		redisClient = await getRedisClient();
	}
	return redisClient;
}

// ============================================
// CACHING FUNCTIONS
// ============================================

/**
 * Get data from cache or fetch and cache it
 * @param key - Input for key.
 * @param fetcher - Input for fetcher.
 * @param ttlSeconds - Input for ttlSeconds.
 * @returns Result of getCachedData.
 * @example
 * ```ts
 * const result = await getCachedData("", undefined, undefined);
 * console.log(result);
 * ```
 * @typeParam T - Generic type parameter for getCachedData.
 */

export async function getCachedData<T>(
	key: string,
	fetcher: () => Promise<T>,
	ttlSeconds = 300,
): Promise<T> {
	const client = await redis();

	// No Redis available - just fetch
	if (!client) {
		return fetcher();
	}

	try {
		// Check cache
		const cached = await client.get<T>(key);
		if (cached !== null) {
			return cached;
		}

		// Fetch fresh data
		const data = await fetcher();

		// Store in cache
		await client.setex(key, ttlSeconds, data);

		return data;
	} catch (error) {
		console.error(`[CACHE] Error for key "${key}":`, error);
		// Fallback to fetcher on cache error
		return fetcher();
	}
}

/**
 * Invalidate a cache key
 * @param key - Input for key.
 * @returns Result of invalidateCache.
 * @example
 * ```ts
 * const result = await invalidateCache("");
 * console.log(result);
 * ```
 */

export async function invalidateCache(key: string): Promise<void> {
	const client = await redis();
	if (!client) return;

	try {
		await client.del(key);
	} catch (error) {
		console.error(`[CACHE] Error invalidating key "${key}":`, error);
	}
}

/**
 * Invalidate all keys matching a pattern
 * @param pattern - Input for pattern.
 * @returns Result of invalidateCachePattern.
 * @example
 * ```ts
 * const result = await invalidateCachePattern("");
 * console.log(result);
 * ```
 */

export async function invalidateCachePattern(pattern: string): Promise<void> {
	const client = await redis();
	if (!client) return;

	try {
		let cursor: string | number = 0;
		do {
			const result = await client.scan(cursor, {
				match: pattern,
				count: 100,
			});
			const [newCursor, keys] = result as [string | number, string[]];
			cursor = newCursor;

			if (keys.length > 0) {
				await client.del(...keys);
			}
		} while (cursor !== 0 && cursor !== "0");
	} catch (error) {
		console.error(`[CACHE] Error invalidating pattern "${pattern}":`, error);
	}
}

// ============================================
// DOMAIN-SPECIFIC CACHING
// ============================================

/**
 * Cache keys for various data types
 * @example
 * ```ts
 * console.log(CacheKeys);
 * ```
 */

export const CacheKeys = {
	accounts: (orgId: number) => `accounts:${orgId}`,
	accountsById: (orgId: number, accountId: string) =>
		`accounts:${orgId}:${accountId}`,
	exchangeRate: (currency: string, date: string) =>
		`exchange:${currency}:${date}`,
	organizationSettings: (orgId: number) => `org:${orgId}:settings`,
} as const;

/**
 * TTL values in seconds
 * @example
 * ```ts
 * console.log(CacheTTL);
 * ```
 */

export const CacheTTL = {
	accounts: 300, // 5 minutes (changed frequently)
	exchangeRate: 3600, // 1 hour (changes daily)
	organizationSettings: 600, // 10 minutes
	shortLived: 60, // 1 minute
	longLived: 86400, // 24 hours
} as const;

async function getDbDeps() {
	const [drizzle, dbModule, schemaModule] = await Promise.all([
		import("drizzle-orm"),
		import("@arkelythex/persistence"),
		import("@arkelythex/persistence/schema"),
	]);

	return {
		eq: drizzle.eq,
		inArray: drizzle.inArray,
		db: dbModule.db,
		accountsTable: schemaModule.accounts,
	};
}

/**
 * Get all accounts for an organization (cached)
 * @param organizationId - Input for organizationId.
 * @returns Result of getCachedAccounts.
 * @example
 * ```ts
 * const result = await getCachedAccounts(0);
 * console.log(result);
 * ```
 */

export async function getCachedAccounts(organizationId: number) {
	const { db, eq, accountsTable } = await getDbDeps();
	return getCachedData(
		CacheKeys.accounts(organizationId),
		async () => {
			return db.query.accounts.findMany({
				where: eq(accountsTable.organizationId, organizationId),
				orderBy: accountsTable.code,
			});
		},
		CacheTTL.accounts,
	);
}

type CachedAccount = Awaited<ReturnType<typeof getCachedAccounts>>[number];

/**
 * Get accounts by IDs (batch query, cached per org)
 * @param organizationId - Input for organizationId.
 * @param accountIds - Input for accountIds.
 * @returns Result of getCachedAccountsByIds.
 * @example
 * ```ts
 * const result = await getCachedAccountsByIds(0, []);
 * console.log(result);
 * ```
 */

export async function getCachedAccountsByIds(
	organizationId: number,
	accountIds: string[],
): Promise<Map<string, CachedAccount>> {
	if (accountIds.length === 0) return new Map();

	const allAccounts = await getCachedAccounts(organizationId);
	const accountIdSet = new Set(accountIds);
	const filteredAccounts = allAccounts.filter((account: CachedAccount) =>
		accountIdSet.has(account.id),
	);

	return new Map(filteredAccounts.map((account) => [account.id, account]));
}

/**
 * Invalidate account cache for an organization
 * @param organizationId - Input for organizationId.
 * @returns Result of invalidateAccountsCache.
 * @example
 * ```ts
 * const result = await invalidateAccountsCache(0);
 * console.log(result);
 * ```
 */

export async function invalidateAccountsCache(
	organizationId: number,
): Promise<void> {
	await invalidateCache(CacheKeys.accounts(organizationId));
}
