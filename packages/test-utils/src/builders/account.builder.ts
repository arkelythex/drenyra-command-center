/**
 * Builder pattern for Account (Cuenta Contable) test data.
 *
 * Creates valid Account domain entities following PCGE standards.
 *
 * @example
 * ```ts
 * const account = new AccountBuilder()
 *   .withCode('1041')
 *   .withType('Activo')
 *   .build();
 * ```
 */
import type { AccountProps } from "@arkelythex/domain/entities/Account";
import type {
	AccountLevel,
	ChartAccountType,
	Currency,
} from "@arkelythex/domain/entities/account.types";
import { Money } from "@arkelythex/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";
import { Account } from "@arkelythex/domain/entities/Account";

const DEFAULT_ACCOUNT_ID = "acc_test_001";
const DEFAULT_ORGANIZATION_ID = 1;
const DEFAULT_CODE = "1041";
const DEFAULT_NAME = "Cuenta Bancaria Soles";
const DEFAULT_LEVEL: AccountLevel = "4";
const DEFAULT_TYPE: ChartAccountType = "Activo";
const DEFAULT_CURRENCY: Currency = "PEN";

export class AccountBuilder extends BaseBuilder<AccountProps, Account> {
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

	/**
	 * Set the account ID.
	 */
	withId(id: string): this {
		return this.set({ id });
	}

	/**
	 * Set the organization ID.
	 */
	withOrganizationId(orgId: number): this {
		return this.set({ organizationId: orgId });
	}

	/**
	 * Set the PCGE account code.
	 */
	withCode(code: string): this {
		return this.set({ code });
	}

	/**
	 * Set the account name.
	 */
	withName(name: string): this {
		return this.set({ name });
	}

	/**
	 * Set the account description.
	 */
	withDescription(description: string): this {
		return this.set({ description });
	}

	/**
	 * Set the account level (PCGE hierarchy).
	 */
	withLevel(level: AccountLevel): this {
		return this.set({ level });
	}

	/**
	 * Set the account type (Activo, Pasivo, etc.).
	 */
	withType(type: ChartAccountType): this {
		return this.set({ type });
	}

	/**
	 * Set the parent account ID.
	 */
	withParentId(parentId: string): this {
		return this.set({ parentId });
	}

	/**
	 * Mark as a group account.
	 */
	asGroup(): this {
		return this.set({ isGroup: true });
	}

	/**
	 * Mark as a leaf (non-group) account.
	 */
	asLeaf(): this {
		return this.set({ isGroup: false });
	}

	/**
	 * Mark as inactive.
	 */
	asInactive(): this {
		return this.set({ isActive: false });
	}

	/**
	 * Mark as a system account.
	 */
	asSystem(): this {
		return this.set({ isSystem: true });
	}

	/**
	 * Set the currency.
	 */
	withCurrency(currency: Currency): this {
		return this.set({ currency });
	}

	/**
	 * Set the balance.
	 */
	withBalance(amount: number, currency: Currency = DEFAULT_CURRENCY): this {
		return this.set({ balance: Money.fromAmount(amount, currency) });
	}

	/**
	 * Set the USD balance.
	 */
	withBalanceUSD(amount: number): this {
		return this.set({ balanceUSD: Money.fromAmount(amount, "USD") });
	}

	/**
	 * Set the destination.
	 */
	withDestination(destination: string): this {
		return this.set({ destination });
	}

	/**
	 * Build the Account domain entity.
	 */
	build(): Account {
		const now = new Date();
		const props = {
			...this.data,
			createdAt: this.data.createdAt ?? now,
			updatedAt: this.data.updatedAt ?? now,
		} as AccountProps;

		return Account.create(props);
	}
}
