import { vi } from "vitest";
function createQueryChain(result = []) {
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
function createInsertChain(result = []) {
    const chain = {
        values: vi.fn(() => createInsertChain(result)),
        onConflictDoNothing: vi.fn(() => createInsertChain(result)),
        onConflictDoUpdate: vi.fn(() => createInsertChain(result)),
        returning: vi.fn().mockResolvedValue(result),
    };
    return chain;
}
function createUpdateChain(result = []) {
    const chain = {
        set: vi.fn(() => createUpdateChain(result)),
        where: vi.fn(() => createUpdateChain(result)),
        returning: vi.fn().mockResolvedValue(result),
    };
    return chain;
}
function createDeleteChain(result = []) {
    const chain = {
        where: vi.fn(() => createDeleteChain(result)),
        returning: vi.fn().mockResolvedValue(result),
    };
    return chain;
}
export function createDatabaseMock(defaultResult = []) {
    const selectFn = vi.fn(() => createQueryChain(defaultResult));
    const insertFn = vi.fn(() => createInsertChain(defaultResult));
    const updateFn = vi.fn(() => createUpdateChain(defaultResult));
    const deleteFn = vi.fn(() => createDeleteChain(defaultResult));
    return {
        select: selectFn,
        insert: insertFn,
        update: updateFn,
        delete: deleteFn,
        transaction: vi.fn((callback) => callback({})),
        query: {
            anyTable: {
                findMany: vi.fn().mockResolvedValue(defaultResult),
                findFirst: vi.fn().mockResolvedValue(defaultResult[0]),
            },
        },
    };
}
export function createTransactionMock() {
    const beginFn = vi.fn();
    const commitFn = vi.fn();
    const rollbackFn = vi.fn();
    return {
        begin: beginFn,
        commit: commitFn,
        rollback: rollbackFn,
        succeed() {
            beginFn();
            commitFn();
        },
        fail() {
            beginFn();
            rollbackFn();
        },
        reset() {
            beginFn.mockClear();
            commitFn.mockClear();
            rollbackFn.mockClear();
        },
    };
}
//# sourceMappingURL=database.mock.js.map