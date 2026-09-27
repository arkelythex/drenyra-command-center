import type { AccountProps } from "@drenyra/domain/entities/Account";
import { Account } from "@drenyra/domain/entities/Account";
import type { AccountLevel, ChartAccountType, Currency } from "@drenyra/domain/entities/account.types";
import { BaseBuilder } from "./base.builder";
export declare class AccountBuilder extends BaseBuilder<AccountProps, Account> {
    constructor();
    withId(id: string): this;
    withOrganizationId(orgId: number): this;
    withCode(code: string): this;
    withName(name: string): this;
    withDescription(description: string): this;
    withLevel(level: AccountLevel): this;
    withType(type: ChartAccountType): this;
    withParentId(parentId: string): this;
    asGroup(): this;
    asLeaf(): this;
    asInactive(): this;
    asSystem(): this;
    withCurrency(currency: Currency): this;
    withBalance(amount: number, currency?: Currency): this;
    withBalanceUSD(amount: number): this;
    withDestination(destination: string): this;
    build(): Account;
}
//# sourceMappingURL=account.builder.d.ts.map