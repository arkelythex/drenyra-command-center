/**
 * Unit of Work Pattern
 *
 * Coordinates atomic operations across multiple repositories within a single transaction.
 * This ensures that all database operations either succeed or fail together.
 *
 * HIGH-001: Missing Transaction Boundaries - Elite 2026
 *
 * @example
 * ```typescript
 * const result = await UnitOfWork.execute(async (uow) => {
 *   const accounts = await uow.accounts.findByIds(accountIds);
 *   const entry = JournalEntry.create(...);
 *   await uow.journals.save(entry);
 *   return entry;
 * });
 * ```
 */

import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

import { db } from "./client";
import type * as schema from "./schema";

// ============================================
// TYPES
// ============================================

type Schema = typeof schema;

/**
 * Transaction type from Drizzle
 * @example
 * ```ts
 * const value: DbTransaction = {} as DbTransaction;
 * console.log(value);
 * ```
 */

export type DbTransaction = PgTransaction<
	PostgresJsQueryResultHKT,
	Schema,
	ExtractTablesWithRelations<Schema>
>;

/**
 * Repository factory that receives transaction context
 * @example
 * ```ts
 * const value: TransactionAwareRepository = {} as TransactionAwareRepository;
 * console.log(value);
 * ```
 * @typeParam T - Generic type parameter for TransactionAwareRepository.
 */

export type TransactionAwareRepository<T> = (tx: DbTransaction) => T;

// ============================================
// UNIT OF WORK
// ============================================

/**
 * UnitOfWork class.
 *
 * @example
 * ```ts
 * const value = new UnitOfWork();
 * console.log(value);
 * ```
 */
export class UnitOfWork {
	private _tx: DbTransaction | null = null;

	/**
	 * Get the active transaction
	 * @throws Error if called outside of execute()
	 */
	get tx(): DbTransaction {
		if (!this._tx) {
			throw new Error(
				"No active transaction. UnitOfWork must be used within execute().",
			);
		}
		return this._tx;
	}

	/**
	 * Check if there's an active transaction
	 */
	get isActive(): boolean {
		return this._tx !== null;
	}

	/**
	 * Execute a unit of work atomically
	 *
	 * All database operations within the callback will be part of a single transaction.
	 * If any operation fails, all changes are rolled back automatically.
	 *
	 * @param work - Async function containing the database operations
	 * @returns The result of the work function
	 *
	 * @example
	 * ```typescript
	 * const invoice = await UnitOfWork.execute(async (uow) => {
	 *   // All these operations are atomic
	 *   const client = await uow.tx.query.clients.findFirst({...});
	 *   const invoice = createInvoice(client);
	 *   await uow.tx.insert(invoices).values(invoice);
	 *   await uow.tx.insert(journalEntries).values(journalEntry);
	 *   return invoice;
	 * });
	 * ```
	 */
	static async execute<T>(work: (uow: UnitOfWork) => Promise<T>): Promise<T> {
		const unitOfWork = new UnitOfWork();

		return db.transaction(async (tx) => {
			unitOfWork._tx = tx;
			try {
				return await work(unitOfWork);
			} finally {
				unitOfWork._tx = null;
			}
		});
	}

	/**
	 * Execute with optional unit of work
	 *
	 * If a UoW is provided, uses its transaction.
	 * Otherwise, executes without transaction (for read-only operations).
	 */
	static async executeOptional<T>(
		uow: UnitOfWork | null,
		work: (tx: DbTransaction | typeof db) => Promise<T>,
	): Promise<T> {
		if (uow?.isActive) {
			return work(uow.tx);
		}
		return work(db);
	}
}

// ============================================
// REPOSITORY HELPERS
// ============================================

/**
 * Create a repository that can work with or without a transaction
 *
 * @example
 * ```typescript
 * const findAccounts = withTransaction(
 *   (tx) => async (ids: string[]) => {
 *     return tx.query.accounts.findMany({
 *       where: inArray(accounts.id, ids),
 *     });
 *   }
 * );
 *
 * // Without transaction
 * const accounts1 = await findAccounts(null)(ids);
 *
 * // With transaction
 * await UnitOfWork.execute(async (uow) => {
 *   const accounts2 = await findAccounts(uow.tx)(ids);
 * });
 * ```
 * @param factory - Input for factory.
 * @returns Result of withTransaction.
 * @typeParam TArgs - Generic type parameter for withTransaction.
 * @typeParam TResult - Generic type parameter for withTransaction.
 */

export function withTransaction<TArgs extends unknown[], TResult>(
	factory: (
		_tx: DbTransaction | typeof db,
	) => (...args: TArgs) => Promise<TResult>,
): (
	tx: DbTransaction | typeof db | null,
) => (...args: TArgs) => Promise<TResult> {
	return (tx) => factory(tx ?? db);
}

// ============================================
// BATCH QUERY HELPERS
// ============================================

/**
 * Batch multiple IDs into a single query and return a Map for O(1) lookups
 *
 * @example
 * ```typescript
 * const accountIds = lines.map(l => l.accountId);
 * const accountsMap = await batchQuery(
 *   uow.tx,
 *   accounts,
 *   accounts.id,
 *   accountIds
 * );
 * const account = accountsMap.get(lineAccountId);
 * ```
 * @param tx - Input for tx.
 * @param items - Input for items.
 * @param getId - Input for getId.
 * @returns Result of batchQuery.
 * @typeParam T - Generic type parameter for batchQuery.
 */

export async function batchQuery<T extends { id: string | number }>(
	_tx: DbTransaction | typeof db,
	items: T[],
	getId: (item: T) => string | number = (item) => item.id,
): Promise<Map<string | number, T>> {
	return new Map(items.map((item) => [getId(item), item]));
}
