import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
export class TestDatabase {
    client = null;
    db = null;
    transactionClient = null;
    transactionDb = null;
    databaseUrl;
    constructor(databaseUrl) {
        this.databaseUrl =
            databaseUrl ||
                process.env.DATABASE_URL_TEST ||
                process.env.DATABASE_URL ||
                "";
        if (!this.databaseUrl) {
            throw new Error("DATABASE_URL or DATABASE_URL_TEST environment variable is required for test database. " +
                "Set DATABASE_URL_TEST to a dedicated test database URL.");
        }
    }
    async setup() {
        if (this.client) {
            return;
        }
        this.client = postgres(this.databaseUrl, {
            max: 1,
            idle_timeout: 2,
            connect_timeout: 5,
        });
        this.db = drizzle(this.client);
    }
    async teardown() {
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
    async beginTransaction() {
        if (!this.client) {
            throw new Error("TestDatabase not initialized. Call setup() first.");
        }
        this.transactionClient = postgres(this.databaseUrl, {
            max: 1,
            idle_timeout: 2,
            connect_timeout: 5,
        });
        this.transactionDb = drizzle(this.transactionClient);
        await this.transactionClient `BEGIN`;
        return this.transactionDb;
    }
    async rollbackTransaction() {
        if (!this.transactionClient) {
            throw new Error("No active transaction. Call beginTransaction() first.");
        }
        try {
            await this.transactionClient `ROLLBACK`;
        }
        finally {
            await this.transactionClient.end();
            this.transactionClient = null;
            this.transactionDb = null;
        }
    }
    async commitTransaction() {
        if (!this.transactionClient) {
            throw new Error("No active transaction. Call beginTransaction() first.");
        }
        try {
            await this.transactionClient `COMMIT`;
        }
        finally {
            await this.transactionClient.end();
            this.transactionClient = null;
            this.transactionDb = null;
        }
    }
    getDb() {
        if (!this.db) {
            throw new Error("TestDatabase not initialized. Call setup() first.");
        }
        return this.db;
    }
    getTransactionDb() {
        if (!this.transactionDb) {
            throw new Error("No active transaction. Call beginTransaction() first.");
        }
        return this.transactionDb;
    }
    async seed(seedFn) {
        const db = this.transactionDb || this.db;
        if (!db) {
            throw new Error("TestDatabase not initialized. Call setup() first.");
        }
        await seedFn(db);
    }
    async clean(tables) {
        const db = this.transactionDb || this.db;
        if (!db) {
            throw new Error("TestDatabase not initialized. Call setup() first.");
        }
        if (tables.length > 0) {
            const tableList = tables.join(", ");
            await this.client?.unsafe(`TRUNCATE ${tableList} CASCADE`);
        }
    }
    async createTenantSchema(schemaName) {
        if (!this.client) {
            throw new Error("TestDatabase not initialized. Call setup() first.");
        }
        await this.client.unsafe(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    }
    async dropTenantSchema(schemaName) {
        if (!this.client) {
            throw new Error("TestDatabase not initialized. Call setup() first.");
        }
        await this.client.unsafe(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    }
}
export async function withTransaction(fn, databaseUrl) {
    const testDb = new TestDatabase(databaseUrl);
    await testDb.setup();
    try {
        const db = await testDb.beginTransaction();
        const result = await fn(db);
        await testDb.rollbackTransaction();
        return result;
    }
    catch (error) {
        try {
            await testDb.rollbackTransaction();
        }
        catch {
        }
        throw error;
    }
    finally {
        await testDb.teardown();
    }
}
export function createTransactionHooks(databaseUrl) {
    let testDb = null;
    let transactionDb = null;
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
                }
                catch {
                }
                await testDb.teardown();
                testDb = null;
                transactionDb = null;
            }
        },
        getDb: () => {
            if (!transactionDb) {
                throw new Error("Transaction not initialized. Ensure beforeEach hook has run.");
            }
            return transactionDb;
        },
    };
}
//# sourceMappingURL=test-db.js.map