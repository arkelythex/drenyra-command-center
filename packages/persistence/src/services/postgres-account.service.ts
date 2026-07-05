/**
 * PostgreSQL Account Service
 * Simple service to fetch account details for journal entries
 *
 * HIGH-003: Added batch query to fix N+1 problem - Elite 2026
 */

import type { AccountService } from "@drenyra/application/use-cases/journal/create-journal-entry.use-case";
import { db } from "@drenyra/persistence/client";
import { accounts } from "@drenyra/persistence/schema";
import { eq, inArray } from "drizzle-orm";

type AccountInfo = { code: string; name: string };

/**
 * PostgresAccountService class.
 *
 * @example
 * ```ts
 * const value = new PostgresAccountService();
 * console.log(value);
 * ```
 */
export class PostgresAccountService implements AccountService {
	/**
	 * Get single account by ID
	 */
	async getById(id: string): Promise<AccountInfo | null> {
		const result = await db
			.select({
				code: accounts.code,
				name: accounts.name,
			})
			.from(accounts)
			.where(eq(accounts.id, id))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Get multiple accounts by IDs in a single query
	 *
	 * Fixes N+1 query problem:
	 * - Before: 50 items = 50 queries
	 * - After: 50 items = 1 query
	 *
	 * @param ids - Array of account IDs to fetch
	 * @returns Map of account ID to account info
	 */
	async getByIds(ids: string[]): Promise<Map<string, AccountInfo>> {
		if (ids.length === 0) return new Map();

		const result = await db
			.select({
				id: accounts.id,
				code: accounts.code,
				name: accounts.name,
			})
			.from(accounts)
			.where(inArray(accounts.id, ids));

		return new Map(result.map((r) => [r.id, { code: r.code, name: r.name }]));
	}
}
