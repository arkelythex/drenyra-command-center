import { Account } from "@drenyra/domain/entities/Account";
import type { AccountFilters, AccountRepository, AccountWithChildren } from "@drenyra/domain/repositories/account.repository";
export declare class PostgresAccountRepository implements AccountRepository {
    save(account: Account): Promise<void>;
    findById(id: string): Promise<Account | null>;
    findByCode(organizationId: number, code: string): Promise<Account | null>;
    findAll(organizationId: number): Promise<Account[]>;
    findWithFilters(filters: AccountFilters): Promise<Account[]>;
    findChildren(parentId: string): Promise<Account[]>;
    findMovementAccounts(organizationId: number): Promise<Account[]>;
    getHierarchy(organizationId: number): Promise<AccountWithChildren[]>;
    delete(id: string): Promise<void>;
    hasChildren(id: string): Promise<boolean>;
    codeExists(organizationId: number, code: string, excludeId?: string): Promise<boolean>;
    count(filters?: AccountFilters): Promise<number>;
    getNextChildCode(parentId: string): Promise<string>;
    private buildConditions;
    private mapToDomain;
}
//# sourceMappingURL=postgres-account.repository.d.ts.map