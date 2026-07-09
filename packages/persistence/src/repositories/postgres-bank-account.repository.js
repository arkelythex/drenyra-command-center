import { BankAccount } from "@drenyra/domain/entities/BankAccount";
import { Money } from "@drenyra/domain/value-objects/Money";
import { and, count, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { bankAccounts } from "../schema";
import {
	resolveCompanyIdFromOrganization,
	resolveOrganizationIdFromCompany,
} from "./support/organization-resolver";
import { toStableUuid } from "./support/stable-uuid";

const idToUuid = (id) => toStableUuid(`legacy-bank-account:${id}`);
const uuidToLegacyId = (id) => {
	const numeric = Number.parseInt(id.replace(/\D/g, "").slice(0, 9), 10);
	return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
};
const decimal = (amount) => amount.toFixed(2);
function mapDbTypeToDomain(dbType) {
	const typeMap = {
		corriente: "CORRIENTE",
		ahorros: "AHORROS",
		cts: "CTS",
		detracciones: "DETRACCIONES",
		otro: "OTRO",
	};
	return typeMap[dbType.toLowerCase()] ?? "OTRO";
}
function mapDomainTypeToDb(domainType) {
	const typeMap = {
		CORRIENTE: "corriente",
		AHORROS: "ahorros",
		CTS: "cts",
		DETRACCIONES: "detracciones",
		OTRO: "otro",
	};
	return typeMap[domainType];
}
export class PostgresBankAccountRepository {
	async save(account) {
		const companyId = await resolveCompanyIdFromOrganization(
			account.organizationId,
		);
		const persistedId =
			account.id > 0
				? idToUuid(account.id)
				: toStableUuid(
						`legacy-bank-account:${companyId}:${account.accountNumber}`,
					);
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
	async update(account) {
		const companyId = await resolveCompanyIdFromOrganization(
			account.organizationId,
		);
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
			.where(
				and(
					eq(bankAccounts.id, idToUuid(account.id)),
					eq(bankAccounts.companyId, companyId),
				),
			)
			.returning();
		return updated ? this.mapToDomain(updated) : account;
	}
	async findById(id, organizationId) {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const result = await db.query.bankAccounts.findFirst({
			where: and(
				eq(bankAccounts.id, idToUuid(id)),
				eq(bankAccounts.companyId, companyId),
			),
		});
		return result ? this.mapToDomain(result, organizationId) : null;
	}
	async findByAccountNumber(accountNumber, organizationId) {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const result = await db.query.bankAccounts.findFirst({
			where: and(
				eq(bankAccounts.accountNumber, accountNumber),
				eq(bankAccounts.companyId, companyId),
			),
		});
		return result ? this.mapToDomain(result, organizationId) : null;
	}
	async findAll(organizationId, filters) {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const conditions = this.buildConditions(companyId, filters);
		const results = await db.query.bankAccounts.findMany({
			where: and(...conditions),
			orderBy: (table, { asc }) => [
				asc(table.bankName),
				asc(table.accountNumber),
			],
		});
		return Promise.all(
			results.map((row) => this.mapToDomain(row, organizationId)),
		);
	}
	async findAllActive(organizationId) {
		return this.findAll(organizationId, { isActive: true });
	}
	async findDetraccionesAccount(organizationId) {
		const [account] = await this.findAll(organizationId, {
			accountType: "DETRACCIONES",
			isActive: true,
		});
		return account ?? null;
	}
	async updateBalance(id, newBalance, _currency) {
		await db
			.update(bankAccounts)
			.set({
				currentBalance: decimal(newBalance),
				availableBalance: decimal(newBalance),
				updatedAt: new Date(),
			})
			.where(eq(bankAccounts.id, idToUuid(id)));
	}
	async getTotalBalanceByCurrency(organizationId) {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const results = await db
			.select({
				currency: bankAccounts.currency,
				total: sql`SUM(CAST(${bankAccounts.currentBalance} AS DECIMAL))`,
			})
			.from(bankAccounts)
			.where(
				and(
					eq(bankAccounts.companyId, companyId),
					eq(bankAccounts.isActive, true),
				),
			)
			.groupBy(bankAccounts.currency);
		const balances = { PEN: 0, USD: 0, EUR: 0 };
		for (const row of results) {
			if (row.currency === "PEN" || row.currency === "USD") {
				balances[row.currency] = Number(row.total ?? 0);
			}
		}
		return balances;
	}
	async count(organizationId, filters) {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const [result] = await db
			.select({ value: count() })
			.from(bankAccounts)
			.where(and(...this.buildConditions(companyId, filters)));
		return result?.value ?? 0;
	}
	async delete(id, organizationId) {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		await db
			.update(bankAccounts)
			.set({ isActive: false, updatedAt: new Date() })
			.where(
				and(
					eq(bankAccounts.id, idToUuid(id)),
					eq(bankAccounts.companyId, companyId),
				),
			);
	}
	buildConditions(companyId, filters) {
		const conditions = [eq(bankAccounts.companyId, companyId)];
		if (filters?.isActive !== undefined)
			conditions.push(eq(bankAccounts.isActive, filters.isActive));
		if (filters?.currency)
			conditions.push(eq(bankAccounts.currency, filters.currency));
		if (filters?.accountType)
			conditions.push(
				eq(bankAccounts.accountType, mapDomainTypeToDb(filters.accountType)),
			);
		if (filters?.bankName)
			conditions.push(eq(bankAccounts.bankName, filters.bankName));
		return conditions;
	}
	async mapToDomain(raw, organizationId) {
		const resolvedOrganizationId =
			organizationId ?? (await resolveOrganizationIdFromCompany(raw.companyId));
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
