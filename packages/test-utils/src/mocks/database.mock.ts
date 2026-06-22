/**
 * Mock factory for PostgreSQL/Drizzle client.
 *
 * Provides a mock database client that simulates Drizzle ORM behavior
 * without requiring a real database connection.
 *
 * @example
 * ```ts
 * const mockDb = createDatabaseMock();
 * mockDb.select.mockResolvedValue([{ id: 1, name: 'Test' }]);
 * ```
 */
import { vi } from "vitest";

/**
 * Creates a mock chainable query builder.
 */
function createQueryChain<T>(result: T[] = []) {
	const chain = {
		where: vi.fn(() => createQueryChain(result)),
		limit: vi.fn(() => createQueryChain(result)),
		offset: vi.fn(() => createQueryChain(result)),
		orderBy: vi.fn(() => createQueryChain(result)),
		innerJoin: vi.fn(() => createQueryChain(result)),
		leftJoin: vi.fn(() => createQueryChain(result)),
		execute: vi.fn().mockResolvedValue(result),
	};
	return chain;
}

/**
 * Creates a mock insert chain.
 */
function createInsertChain<T>(result: T[] = []) {
	const chain = {
		values: vi.fn(() => createInsertChain(result)),
		onConflictDoNothing: vi.fn(() => createInsertChain(result)),
		onConflictDoUpdate: vi.fn(() => createInsertChain(result)),
		returning: vi.fn().mockResolvedValue(result),
	};
	return chain;
}

/**
 * Creates a mock update chain.
 */
function createUpdateChain<T>(result: T[] = []) {
	const chain = {
		set: vi.fn(() => createUpdateChain(result)),
		where: vi.fn(() => createUpdateChain(result)),
		returning: vi.fn().mockResolvedValue(result),
	};
	return chain;
}

/**
 * Creates a mock delete chain.
 */
function createDeleteChain<T>(result: T[] = []) {
	const chain = {
		where: vi.fn(() => createDeleteChain(result)),
		returning: vi.fn().mockResolvedValue(result),
	};
	return chain;
}

export interface MockDatabase {
	select: ReturnType<typeof vi.fn>;
	insert: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
	delete: ReturnType<typeof vi.fn>;
	transaction: ReturnType<typeof vi.fn>;
	query: Record<
		string,
		{ findMany: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> }
	>;
}

/**
 * Create a mock database client with chainable query builders.
 */
export function createDatabaseMock<T = Record<string, unknown>>(
	defaultResult: T[] = [],
): MockDatabase {
	const selectFn = vi.fn(() => createQueryChain(defaultResult));
	const insertFn = vi.fn(() => createInsertChain(defaultResult));
	const updateFn = vi.fn(() => createUpdateChain(defaultResult));
	const deleteFn = vi.fn(() => createDeleteChain(defaultResult));

	return {
		select: selectFn,
		insert: insertFn,
		update: updateFn,
		delete: deleteFn,
		transaction: vi.fn((callback: (tx: unknown) => Promise<unknown>) =>
			callback({}),
		),
		query: {
			anyTable: {
				findMany: vi.fn().mockResolvedValue(defaultResult),
				findFirst: vi.fn().mockResolvedValue(defaultResult[0]),
			},
		},
	};
}

/**
 * Create a mock that simulates a database transaction with rollback support.
 */
export function createTransactionMock() {
	const beginFn = vi.fn();
	const commitFn = vi.fn();
	const rollbackFn = vi.fn();

	return {
		begin: beginFn,
		commit: commitFn,
		rollback: rollbackFn,
		/** Simulate a successful transaction */
		succeed() {
			beginFn();
			commitFn();
		},
		/** Simulate a rolled-back transaction */
		fail() {
			beginFn();
			rollbackFn();
		},
		/** Reset all call counts */
		reset() {
			beginFn.mockClear();
			commitFn.mockClear();
			rollbackFn.mockClear();
		},
	};
}
