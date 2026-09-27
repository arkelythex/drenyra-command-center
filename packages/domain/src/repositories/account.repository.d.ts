import type { Account, AccountLevel, AccountType, Currency } from "../entities/Account";
export interface AccountFilters {
    organizationId: number;
    searchTerm?: string;
    type?: AccountType;
    currency?: Currency;
    level?: AccountLevel;
    status?: "active" | "inactive" | "all";
    onlyCustom?: boolean;
    onlyMovement?: boolean;
    parentId?: string;
}
export interface AccountWithChildren extends Account {
    children: AccountWithChildren[];
}
export interface AccountRepository {
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
}
//# sourceMappingURL=account.repository.d.ts.map