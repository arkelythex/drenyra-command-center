import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "./client";
import type * as schema from "./schema";
type Schema = typeof schema;
export type DbTransaction = PgTransaction<PostgresJsQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>;
export type TransactionAwareRepository<T> = (tx: DbTransaction) => T;
export declare class UnitOfWork {
    private _tx;
    get tx(): DbTransaction;
    get isActive(): boolean;
    static execute<T>(work: (uow: UnitOfWork) => Promise<T>): Promise<T>;
    static executeOptional<T>(uow: UnitOfWork | null, work: (tx: DbTransaction | typeof db) => Promise<T>): Promise<T>;
}
export declare function withTransaction<TArgs extends unknown[], TResult>(factory: (_tx: DbTransaction | typeof db) => (...args: TArgs) => Promise<TResult>): (tx: DbTransaction | typeof db | null) => (...args: TArgs) => Promise<TResult>;
export declare function batchQuery<T extends {
    id: string | number;
}>(_tx: DbTransaction | typeof db, items: T[], getId?: (item: T) => string | number): Promise<Map<string | number, T>>;
export {};
//# sourceMappingURL=unit-of-work.d.ts.map