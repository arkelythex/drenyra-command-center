import { vi } from "vitest";
export interface MockDatabase {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
    query: Record<string, {
        findMany: ReturnType<typeof vi.fn>;
        findFirst: ReturnType<typeof vi.fn>;
    }>;
}
export declare function createDatabaseMock<T = Record<string, unknown>>(defaultResult?: T[]): MockDatabase;
export declare function createTransactionMock(): {
    begin: import("vitest").Mock<import("@vitest/spy").Procedure>;
    commit: import("vitest").Mock<import("@vitest/spy").Procedure>;
    rollback: import("vitest").Mock<import("@vitest/spy").Procedure>;
    succeed(): void;
    fail(): void;
    reset(): void;
};
//# sourceMappingURL=database.mock.d.ts.map