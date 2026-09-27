import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
export declare class TestDatabase {
    private client;
    private db;
    private transactionClient;
    private transactionDb;
    private readonly databaseUrl;
    constructor(databaseUrl?: string);
    setup(): Promise<void>;
    teardown(): Promise<void>;
    beginTransaction(): Promise<PostgresJsDatabase>;
    rollbackTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    getDb(): PostgresJsDatabase;
    getTransactionDb(): PostgresJsDatabase;
    seed(seedFn: (db: PostgresJsDatabase) => Promise<void>): Promise<void>;
    clean(tables: string[]): Promise<void>;
    createTenantSchema(schemaName: string): Promise<void>;
    dropTenantSchema(schemaName: string): Promise<void>;
}
export declare function withTransaction<T>(fn: (db: PostgresJsDatabase) => Promise<T>, databaseUrl?: string): Promise<T>;
export declare function createTransactionHooks(databaseUrl?: string): {
    beforeEach: () => Promise<void>;
    afterEach: () => Promise<void>;
    getDb: () => PostgresJsDatabase<Record<string, never>>;
};
//# sourceMappingURL=test-db.d.ts.map