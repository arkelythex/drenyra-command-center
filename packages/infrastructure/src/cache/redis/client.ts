/**
 * Redis Cache Infrastructure
 *
 * Provides caching utilities using Upstash Redis for
 * frequently accessed data like Chart of Accounts.
 *
 * Week 3: Performance & Scalability - Elite 2026
 */

import type { Redis } from "./types";

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

	// @ts-expect-error — Missing module, install via bun add
	const { Redis } = await import("@upstash/redis");
	return new Redis({ url, token });
}

let redisClient: Redis | null | undefined;

async function redis(): Promise<Redis | null> {
	if (redisClient === undefined) {
		redisClient = await getRedisClient();
	}
	return redisClient;
}

/**
 * Get data from cache or fetch and cache it
 */

export async function getCachedData<T>(
	key: string,
	fetcher: () => Promise<T>,
	ttlSeconds = 300,
): Promise<T> {
	const client = await redis();

	if (!client) {
		return fetcher();
	}

	try {
		const cached = await client.get<T>(key);
		if (cached !== null) {
			return cached;
		}

		const data = await fetcher();

		await client.setex(key, ttlSeconds, data);

		return data;
	} catch (error) {
		console.error(`[CACHE] Error for key "${key}":`, error);
		return fetcher();
	}
}

/**
 * Invalidate a cache key
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

/**
 * Cache keys for various data types
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
 */

export const CacheTTL = {
	accounts: 300,
	exchangeRate: 3600,
	organizationSettings: 600,
	shortLived: 60,
	longLived: 86400,
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
 */

export async function getCachedAccounts(organizationId: number) {
	const { db, eq, accountsTable } = await getDbDeps();
	return getCachedData(
		CacheKeys.accounts(organizationId),
		async () => {
			return db.query.accounts.findMany({
				// @ts-expect-error — Drizzle schema evolution: column organizationId not in accounts table schema
				where: eq(accountsTable.organizationId, organizationId),
				// @ts-expect-error — Drizzle schema evolution: column code not in accounts table schema
				orderBy: accountsTable.code,
			});
		},
		CacheTTL.accounts,
	);
}

type CachedAccount = Awaited<ReturnType<typeof getCachedAccounts>>[number];

/**
 * Get accounts by IDs (batch query, cached per org)
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
 */

export async function invalidateAccountsCache(
	organizationId: number,
): Promise<void> {
	await invalidateCache(CacheKeys.accounts(organizationId));
}
