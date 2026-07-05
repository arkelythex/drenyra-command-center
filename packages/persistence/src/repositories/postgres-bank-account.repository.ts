/**
 * PostgreSQL Bank Account Repository.
 *
 * Bridges the legacy domain BankAccount contract to the current modular
 * banking schema, where persisted identifiers are UUID strings and scope is
 * companyId. The public legacy API still speaks organizationId:number.
 */

import { and, count, eq, sql, type SQL } from "drizzle-orm";
import {
	BankAccount,
	type BankAccountType,
	type Currency,
} from "@drenyra/domain/entities/BankAccount";
import type {
	BankAccountFilters,
	BankAccountRepository,
} from "@drenyra/domain/repositories/bank-account.repository";
import { Money } from "@drenyra/domain/value-objects/Money";
import { db } from "../client";
import { bankAccounts } from "../schema";
import {
	resolveCompanyIdFromOrganization,
	resolveOrganizationIdFromCompany,
} from "./support/organization-resolver";
import { toStableUuid } from "./support/stable-uuid";

type BankAccountRow = typeof bankAccounts.$inferSelect;

const idToUuid = (id: number): string => toStableUuid(`legacy-bank-account:${id}`);
const uuidToLegacyId = (id: string): number => {
	const numeric = Number.parseInt(id.replace(/\D/g, "").slice(0, 9), 10);
	return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
};

const decimal = (amount: number): string => amount.toFixed(2);

function mapDbTypeToDomain(dbType: string): BankAccountType {
	const typeMap: Record<string, BankAccountType> = {
		corriente: "CORRIENTE",
		ahorros: "AHORROS",
		cts: "CTS",
		detracciones: "DETRACCIONES",
		otro: "OTRO",
	};
	return typeMap[dbType.toLowerCase()] ?? "OTRO";
}

function mapDomainTypeToDb(domainType: BankAccountType): string {
	const typeMap: Record<BankAccountType, string> = {
		CORRIENTE: "corriente",
		AHORROS: "ahorros",
		CTS: "cts",
		DETRACCIONES: "detracciones",
		OTRO: "otro",
	};
	return typeMap[domainType];
}

export class PostgresBankAccountRepository implements BankAccountRepository {
	async save(account: BankAccount): Promise<BankAccount> {
		const companyId = await resolveCompanyIdFromOrganization(account.organizationId);
		const persistedId = account.id > 0 ? idToUuid(account.id) : toStableUuid(`legacy-bank-account:${companyId}:${account.accountNumber}`);

		const [saved] = await db
			.insert(bankAccounts)
			.values({
				id: persistedId,
				companyId,
				accountName: `${account.bankName} ${account.accountNumber}`.trim(),
				accountNumber: account.accountNumber,
				accountType: mapDomainTypeToDb(account.accountType),
				bankName: account.bankName,
				currency: account.currency,
				currentBalance: decimal(account.currentBalance.getAmount()),
				availableBalance: decimal(account.currentBalance.getAmount()),
				isActive: account.isActive,
				createdAt: account.createdAt,
				updatedAt: account.updatedAt,
			})
			.onConflictDoUpdate({
				target: bankAccounts.id,
				set: {
					accountName: `${account.bankName} ${account.accountNumber}`.trim(),
					accountType: mapDomainTypeToDb(account.accountType),
					bankName: account.bankName,
					currency: account.currency,
					currentBalance: decimal(account.currentBalance.getAmount()),
					availableBalance: decimal(account.currentBalance.getAmount()),
					isActive: account.isActive,
					updatedAt: account.updatedAt,
				},
			})
			.returning();

		if (!saved) {
			throw new Error("Failed to save bank account");
		}

		return this.mapToDomain(saved);
	}

	async update(account: BankAccount): Promise<BankAccount> {
		const companyId = await resolveCompanyIdFromOrganization(account.organizationId);
		const [updated] = await db
			.update(bankAccounts)
			.set({
				accountName: `${account.bankName} ${account.accountNumber}`.trim(),
				accountType: mapDomainTypeToDb(account.accountType),
				bankName: account.bankName,
				currency: account.currency,
				currentBalance: decimal(account.currentBalance.getAmount()),
				availableBalance: decimal(account.currentBalance.getAmount()),
				isActive: account.isActive,
				updatedAt: new Date(),
			})
			.where(and(eq(bankAccounts.id, idToUuid(account.id)), eq(bankAccounts.companyId, companyId)))
			.returning();

		return updated ? this.mapToDomain(updated) : account;
	}

	async findById(id: number, organizationId: number): Promise<BankAccount | null> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const result = await db.query.bankAccounts.findFirst({
			where: and(eq(bankAccounts.id, idToUuid(id)), eq(bankAccounts.companyId, companyId)),
		});
		return result ? this.mapToDomain(result, organizationId) : null;
	}

	async findByAccountNumber(accountNumber: string, organizationId: number): Promise<BankAccount | null> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const result = await db.query.bankAccounts.findFirst({
			where: and(eq(bankAccounts.accountNumber, accountNumber), eq(bankAccounts.companyId, companyId)),
		});
		return result ? this.mapToDomain(result, organizationId) : null;
	}

	async findAll(organizationId: number, filters?: BankAccountFilters): Promise<BankAccount[]> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const conditions = this.buildConditions(companyId, filters);
		const results = await db.query.bankAccounts.findMany({
			where: and(...conditions),
			orderBy: (table, { asc }) => [asc(table.bankName), asc(table.accountNumber)],
		});
		return Promise.all(results.map((row) => this.mapToDomain(row, organizationId)));
	}

	async findAllActive(organizationId: number): Promise<BankAccount[]> {
		return this.findAll(organizationId, { isActive: true });
	}

	async findDetraccionesAccount(organizationId: number): Promise<BankAccount | null> {
		const [account] = await this.findAll(organizationId, {
			accountType: "DETRACCIONES",
			isActive: true,
		});
		return account ?? null;
	}

	async updateBalance(id: number, newBalance: number, _currency: Currency): Promise<void> {
		await db
			.update(bankAccounts)
			.set({ currentBalance: decimal(newBalance), availableBalance: decimal(newBalance), updatedAt: new Date() })
			.where(eq(bankAccounts.id, idToUuid(id)));
	}

	async getTotalBalanceByCurrency(organizationId: number): Promise<Record<Currency, number>> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const results = await db
			.select({ currency: bankAccounts.currency, total: sql<string>`SUM(CAST(${bankAccounts.currentBalance} AS DECIMAL))` })
			.from(bankAccounts)
			.where(and(eq(bankAccounts.companyId, companyId), eq(bankAccounts.isActive, true)))
			.groupBy(bankAccounts.currency);

		const balances: Record<Currency, number> = { PEN: 0, USD: 0, EUR: 0 };
		for (const row of results) {
			if (row.currency === "PEN" || row.currency === "USD") {
				balances[row.currency] = Number(row.total ?? 0);
			}
		}
		return balances;
	}

	async count(organizationId: number, filters?: BankAccountFilters): Promise<number> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const [result] = await db
			.select({ value: count() })
			.from(bankAccounts)
			.where(and(...this.buildConditions(companyId, filters)));
		return result?.value ?? 0;
	}

	async delete(id: number, organizationId: number): Promise<void> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		await db
			.update(bankAccounts)
			.set({ isActive: false, updatedAt: new Date() })
			.where(and(eq(bankAccounts.id, idToUuid(id)), eq(bankAccounts.companyId, companyId)));
	}

	private buildConditions(companyId: string, filters?: BankAccountFilters): SQL<unknown>[] {
		const conditions: SQL<unknown>[] = [eq(bankAccounts.companyId, companyId)];
		if (filters?.isActive !== undefined) conditions.push(eq(bankAccounts.isActive, filters.isActive));
		if (filters?.currency) conditions.push(eq(bankAccounts.currency, filters.currency));
		if (filters?.accountType) conditions.push(eq(bankAccounts.accountType, mapDomainTypeToDb(filters.accountType)));
		if (filters?.bankName) conditions.push(eq(bankAccounts.bankName, filters.bankName));
		return conditions;
	}

	private async mapToDomain(raw: BankAccountRow, organizationId?: number): Promise<BankAccount> {
		const resolvedOrganizationId = organizationId ?? await resolveOrganizationIdFromCompany(raw.companyId);
		const currency = raw.currency === "USD" ? "USD" : "PEN";
		const balance = Number(raw.currentBalance);
		const createdAt = raw.createdAt ?? new Date();
		const updatedAt = raw.updatedAt ?? createdAt;

		return BankAccount.create({
			id: uuidToLegacyId(raw.id),
			organizationId: resolvedOrganizationId,
			bankName: raw.bankName,
			accountNumber: raw.accountNumber,
			accountType: mapDbTypeToDomain(raw.accountType),
			currency,
			initialBalance: Money.fromAmount(balance, currency),
			currentBalance: Money.fromAmount(balance, currency),
			isActive: raw.isActive ?? true,
			createdAt,
			updatedAt,
		});
	}
}
