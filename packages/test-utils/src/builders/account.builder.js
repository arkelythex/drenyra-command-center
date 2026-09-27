import { Account } from "@drenyra/domain/entities/Account";
import { Money } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";
const DEFAULT_ACCOUNT_ID = "acc_test_001";
const DEFAULT_ORGANIZATION_ID = 1;
const DEFAULT_CODE = "1041";
const DEFAULT_NAME = "Cuenta Bancaria Soles";
const DEFAULT_LEVEL = "4";
const DEFAULT_TYPE = "Activo";
const DEFAULT_CURRENCY = "PEN";
export class AccountBuilder extends BaseBuilder {
    constructor() {
        const now = new Date();
        super({
            id: DEFAULT_ACCOUNT_ID,
            organizationId: DEFAULT_ORGANIZATION_ID,
            code: DEFAULT_CODE,
            name: DEFAULT_NAME,
            level: DEFAULT_LEVEL,
            type: DEFAULT_TYPE,
            isGroup: false,
            isActive: true,
            isSystem: false,
            currency: DEFAULT_CURRENCY,
            balance: Money.zero(DEFAULT_CURRENCY),
            createdAt: now,
            updatedAt: now,
        });
    }
    withId(id) {
        return this.set({ id });
    }
    withOrganizationId(orgId) {
        return this.set({ organizationId: orgId });
    }
    withCode(code) {
        return this.set({ code });
    }
    withName(name) {
        return this.set({ name });
    }
    withDescription(description) {
        return this.set({ description });
    }
    withLevel(level) {
        return this.set({ level });
    }
    withType(type) {
        return this.set({ type });
    }
    withParentId(parentId) {
        return this.set({ parentId });
    }
    asGroup() {
        return this.set({ isGroup: true });
    }
    asLeaf() {
        return this.set({ isGroup: false });
    }
    asInactive() {
        return this.set({ isActive: false });
    }
    asSystem() {
        return this.set({ isSystem: true });
    }
    withCurrency(currency) {
        return this.set({ currency });
    }
    withBalance(amount, currency = DEFAULT_CURRENCY) {
        return this.set({ balance: Money.fromAmount(amount, currency) });
    }
    withBalanceUSD(amount) {
        return this.set({ balanceUSD: Money.fromAmount(amount, "USD") });
    }
    withDestination(destination) {
        return this.set({ destination });
    }
    build() {
        const now = new Date();
        const props = {
            ...this.data,
            createdAt: this.data.createdAt ?? now,
            updatedAt: this.data.updatedAt ?? now,
        };
        return Account.create(props);
    }
}
//# sourceMappingURL=account.builder.js.map