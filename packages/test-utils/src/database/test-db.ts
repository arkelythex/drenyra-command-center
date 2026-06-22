/**
 * TestDatabase - Transaction-wrapped test database helper.
 *
 * Provides setup/teardown with automatic transaction rollback per test
 * to ensure complete isolation between integration tests.
 *
 * Usage:
 *   const testDb = new TestDatabase();
 *   await testDb.setup();
 *   await testDb.beginTransaction();
 *   // ... run test ...
 *   await testDb.rollbackTransaction();
 *   await testDb.teardown();
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export class TestDatabase {
	private client: postgres.Sql | null = null;
	private db: PostgresJsDatabase | null = null;
	private transactionClient: postgres.Sql | null = null;
	private transactionDb: PostgresJsDatabase | null = null;

	private readonly databaseUrl: string;

	constructor(databaseUrl?: string) {
		this.databaseUrl =
			databaseUrl ||
			process.env.DATABASE_URL_TEST ||
			process.env.DATABASE_URL ||
			"";
		if (!this.databaseUrl) {
			throw new Error(
				"DATABASE_URL or DATABASE_URL_TEST environment variable is required for test database. " +
					"Set DATABASE_URL_TEST to a dedicated test database URL.",
			);
		}
	}

	/**
	 * Initialize the database connection.
	 */
	async setup(): Promise<void> {
		if (this.client) {
			return; // Already initialized
		}

		this.client = postgres(this.databaseUrl, {
			max: 1,
			idle_timeout: 2,
			connect_timeout: 5,
		});

		this.db = drizzle(this.client);
	}

	/**
	 * Close the database connection.
	 */
	async teardown(): Promise<void> {
		if (this.transactionClient) {
			await this.transactionClient.end();
			this.transactionClient = null;
			this.transactionDb = null;
		}

		if (this.client) {
			await this.client.end();
			this.client = null;
			this.db = null;
		}
	}

	/**
	 * Begin a transaction that can be rolled back.
	 * Returns a transaction-scoped database instance.
	 */
	async beginTransaction(): Promise<PostgresJsDatabase> {
		if (!this.client) {
			throw new Error("TestDatabase not initialized. Call setup() first.");
		}

		this.transactionClient = postgres(this.databaseUrl, {
			max: 1,
			idle_timeout: 2,
			connect_timeout: 5,
		});

		this.transactionDb = drizzle(this.transactionClient);

		await this.transactionClient`BEGIN`;

		return this.transactionDb;
	}

	/**
	 * Rollback the current transaction.
	 */
	async rollbackTransaction(): Promise<void> {
		if (!this.transactionClient) {
			throw new Error("No active transaction. Call beginTransaction() first.");
		}

		try {
			await this.transactionClient`ROLLBACK`;
		} finally {
			await this.transactionClient.end();
			this.transactionClient = null;
			this.transactionDb = null;
		}
	}

	/**
	 * Commit the current transaction (use sparingly in tests).
	 */
	async commitTransaction(): Promise<void> {
		if (!this.transactionClient) {
			throw new Error("No active transaction. Call beginTransaction() first.");
		}

		try {
			await this.transactionClient`COMMIT`;
		} finally {
			await this.transactionClient.end();
			this.transactionClient = null;
			this.transactionDb = null;
		}
	}

	/**
	 * Get the primary database instance (non-transactional).
	 * Use for setup operations like creating test schemas.
	 */
	getDb(): PostgresJsDatabase {
		if (!this.db) {
			throw new Error("TestDatabase not initialized. Call setup() first.");
		}
		return this.db;
	}

	/**
	 * Get the transaction-scoped database instance.
	 */
	getTransactionDb(): PostgresJsDatabase {
		if (!this.transactionDb) {
			throw new Error("No active transaction. Call beginTransaction() first.");
		}
		return this.transactionDb;
	}

	/**
	 * Seed the database with test data.
	 * Accepts an array of SQL statements or a seed function.
	 */
	async seed(seedFn: (db: PostgresJsDatabase) => Promise<void>): Promise<void> {
		const db = this.transactionDb || this.db;
		if (!db) {
			throw new Error("TestDatabase not initialized. Call setup() first.");
		}
		await seedFn(db);
	}

	/**
	 * Clean all data from test tables.
	 * Use TRUNCATE with CASCADE for complete cleanup.
	 */
	async clean(tables: string[]): Promise<void> {
		const db = this.transactionDb || this.db;
		if (!db) {
			throw new Error("TestDatabase not initialized. Call setup() first.");
		}

		if (tables.length > 0) {
			const tableList = tables.join(", ");
			await this.client!.unsafe(`TRUNCATE ${tableList} CASCADE`);
		}
	}

	/**
	 * Create a tenant-specific schema for isolation testing.
	 */
	async createTenantSchema(schemaName: string): Promise<void> {
		if (!this.client) {
			throw new Error("TestDatabase not initialized. Call setup() first.");
		}

		await this.client.unsafe(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
	}

	/**
	 * Drop a tenant-specific schema.
	 */
	async dropTenantSchema(schemaName: string): Promise<void> {
		if (!this.client) {
			throw new Error("TestDatabase not initialized. Call setup() first.");
		}

		await this.client.unsafe(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
	}
}

/**
 * Helper to wrap a test in a transaction with automatic rollback.
 *
 * Usage:
 *   it('should do something', async () => {
 *     await withTransaction(async (db) => {
 *       // ... test code using db ...
 *     });
 *   });
 */
export async function withTransaction<T>(
	fn: (db: PostgresJsDatabase) => Promise<T>,
	databaseUrl?: string,
): Promise<T> {
	const testDb = new TestDatabase(databaseUrl);
	await testDb.setup();

	try {
		const db = await testDb.beginTransaction();
		const result = await fn(db);
		await testDb.rollbackTransaction();
		return result;
	} catch (error) {
		try {
			await testDb.rollbackTransaction();
		} catch {
			// Ignore rollback errors if transaction already failed
		}
		throw error;
	} finally {
		await testDb.teardown();
	}
}

/**
 * Vitest helper factory: creates beforeEach/afterEach hooks for transaction isolation.
 *
 * Usage in test file:
 *   describe('my tests', () => {
 *     const hooks = createTransactionHooks();
 *     beforeEach(hooks.beforeEach);
 *     afterEach(hooks.afterEach);
 *
 *     it('should work', async () => {
 *       const db = hooks.getDb();
 *       // ... use db ...
 *     });
 *   });
 */
export function createTransactionHooks(databaseUrl?: string) {
	let testDb: TestDatabase | null = null;
	let transactionDb: PostgresJsDatabase | null = null;

	return {
		beforeEach: async () => {
			testDb = new TestDatabase(databaseUrl);
			await testDb.setup();
			transactionDb = await testDb.beginTransaction();
		},
		afterEach: async () => {
			if (testDb) {
				try {
					await testDb.rollbackTransaction();
				} catch {
					// Ignore rollback errors
				}
				await testDb.teardown();
				testDb = null;
				transactionDb = null;
			}
		},
		getDb: () => {
			if (!transactionDb) {
				throw new Error(
					"Transaction not initialized. Ensure beforeEach hook has run.",
				);
			}
			return transactionDb;
		},
	};
}
