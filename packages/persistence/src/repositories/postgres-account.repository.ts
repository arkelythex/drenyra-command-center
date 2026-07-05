/** PostgreSQL implementation of AccountRepository over the current PCGE schema. */

import { and, asc, count, eq, like, ne, or, type SQL } from "drizzle-orm";
import {
	Account,
	type AccountLevel,
	type AccountType,
	type Currency,
} from "@drenyra/domain/entities/Account";
import type {
	AccountFilters,
	AccountRepository,
	AccountWithChildren,
} from "@drenyra/domain/repositories/account.repository";
import { Money } from "@drenyra/domain/value-objects/Money";
import { db } from "../client";
import { pcgeAccounts } from "../schema";
import { resolveCompanyIdFromOrganization, resolveOrganizationIdFromCompany } from "./support/organization-resolver";

type PcgeAccountRow = typeof pcgeAccounts.$inferSelect;

type AccountNode = Account & { children: AccountWithChildren[] };

const levelFromCode = (code: string): AccountLevel => {
	if (code.length <= 2) return "1";
	if (code.length === 3) return "2";
	if (code.length === 4) return "3";
	if (code.length === 5) return "4";
	return "5";
};

export class PostgresAccountRepository implements AccountRepository {
	async save(account: Account): Promise<void> {
		const companyId = await resolveCompanyIdFromOrganization(account.organizationId);
		await db
			.insert(pcgeAccounts)
			.values({
				id: account.id,
				companyId,
				code: account.code,
				name: account.name,
				level: account.level,
				type: account.type,
				parentId: account.parentId ?? null,
				isActive: account.isActive ? "S" : "N",
				createdAt: account.createdAt,
				updatedAt: account.updatedAt,
			})
			.onConflictDoUpdate({
				target: pcgeAccounts.id,
				set: {
					name: account.name,
					level: account.level,
					type: account.type,
					parentId: account.parentId ?? null,
					isActive: account.isActive ? "S" : "N",
					updatedAt: account.updatedAt,
				},
			});
	}

	async findById(id: string): Promise<Account | null> {
		const row = await db.query.pcgeAccounts.findFirst({ where: eq(pcgeAccounts.id, id) });
		return row ? this.mapToDomain(row) : null;
	}

	async findByCode(organizationId: number, code: string): Promise<Account | null> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const row = await db.query.pcgeAccounts.findFirst({ where: and(eq(pcgeAccounts.companyId, companyId), eq(pcgeAccounts.code, code)) });
		return row ? this.mapToDomain(row, organizationId) : null;
	}

	async findAll(organizationId: number): Promise<Account[]> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const rows = await db.query.pcgeAccounts.findMany({ where: eq(pcgeAccounts.companyId, companyId), orderBy: [asc(pcgeAccounts.code)] });
		return Promise.all(rows.map((row) => this.mapToDomain(row, organizationId)));
	}

	async findWithFilters(filters: AccountFilters): Promise<Account[]> {
		const companyId = await resolveCompanyIdFromOrganization(filters.organizationId);
		const rows = await db.query.pcgeAccounts.findMany({
			where: and(...this.buildConditions(companyId, filters)),
			orderBy: [asc(pcgeAccounts.code)],
		});
		return Promise.all(rows.map((row) => this.mapToDomain(row, filters.organizationId)));
	}

	async findChildren(parentId: string): Promise<Account[]> {
		const rows = await db.query.pcgeAccounts.findMany({ where: eq(pcgeAccounts.parentId, parentId), orderBy: [asc(pcgeAccounts.code)] });
		return Promise.all(rows.map((row) => this.mapToDomain(row)));
	}

	async findMovementAccounts(organizationId: number): Promise<Account[]> {
		const accounts = await this.findWithFilters({ organizationId, status: "active" });
		return accounts.filter((account) => account.isMovementAccount());
	}

	async getHierarchy(organizationId: number): Promise<AccountWithChildren[]> {
		const accounts = await this.findAll(organizationId);
		const byId = new Map<string, AccountNode>();
		for (const account of accounts) byId.set(account.id, Object.assign(account, { children: [] }));

		const roots: AccountWithChildren[] = [];
		for (const account of byId.values()) {
			if (account.parentId && byId.has(account.parentId)) {
				byId.get(account.parentId)?.children.push(account);
			} else {
				roots.push(account);
			}
		}
		return roots;
	}

	async delete(id: string): Promise<void> {
		await db.delete(pcgeAccounts).where(eq(pcgeAccounts.id, id));
	}

	async hasChildren(id: string): Promise<boolean> {
		const [result] = await db.select({ value: count() }).from(pcgeAccounts).where(eq(pcgeAccounts.parentId, id));
		return (result?.value ?? 0) > 0;
	}

	async codeExists(organizationId: number, code: string, excludeId?: string): Promise<boolean> {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const conditions: SQL<unknown>[] = [eq(pcgeAccounts.companyId, companyId), eq(pcgeAccounts.code, code)];
		if (excludeId) conditions.push(ne(pcgeAccounts.id, excludeId));
		const [result] = await db.select({ value: count() }).from(pcgeAccounts).where(and(...conditions));
		return (result?.value ?? 0) > 0;
	}

	async count(filters?: AccountFilters): Promise<number> {
		if (!filters) {
			const [result] = await db.select({ value: count() }).from(pcgeAccounts);
			return result?.value ?? 0;
		}
		const companyId = await resolveCompanyIdFromOrganization(filters.organizationId);
		const [result] = await db.select({ value: count() }).from(pcgeAccounts).where(and(...this.buildConditions(companyId, filters)));
		return result?.value ?? 0;
	}

	async getNextChildCode(parentId: string): Promise<string> {
		const parent = await this.findById(parentId);
		if (!parent) throw new Error("Parent account not found");
		const children = await this.findChildren(parentId);
		if (children.length === 0) return `${parent.code}1`;
		const suffixes = children.map((child) => Number.parseInt(child.code.slice(parent.code.length), 10)).filter(Number.isFinite);
		return `${parent.code}${Math.max(...suffixes) + 1}`;
	}

	private buildConditions(companyId: string, filters: AccountFilters): SQL<unknown>[] {
		const conditions: SQL<unknown>[] = [eq(pcgeAccounts.companyId, companyId)];
		if (filters.status && filters.status !== "all") conditions.push(eq(pcgeAccounts.isActive, filters.status === "active" ? "S" : "N"));
		if (filters.type) conditions.push(eq(pcgeAccounts.type, filters.type));
		if (filters.level) conditions.push(eq(pcgeAccounts.level, filters.level));
		if (filters.parentId) conditions.push(eq(pcgeAccounts.parentId, filters.parentId));
		if (filters.onlyMovement) conditions.push(eq(pcgeAccounts.level, "5"));
		if (filters.searchTerm) {
			const search = `%${filters.searchTerm}%`;
			const searchCondition = or(like(pcgeAccounts.code, search), like(pcgeAccounts.name, search));
			if (searchCondition) conditions.push(searchCondition);
		}
		return conditions;
	}

	private async mapToDomain(raw: PcgeAccountRow, organizationId?: number): Promise<Account> {
		const resolvedOrganizationId = organizationId ?? await resolveOrganizationIdFromCompany(raw.companyId);
		const level = raw.level as AccountLevel;
		const currency: Currency = "PEN";
		return Account.create({
			id: raw.id,
			organizationId: resolvedOrganizationId,
			code: raw.code,
			name: raw.name,
			level: levelFromCode(raw.code) === level ? level : levelFromCode(raw.code),
			type: raw.type as AccountType,
			parentId: raw.parentId ?? undefined,
			isGroup: raw.level !== "5",
			isActive: raw.isActive === "S",
			isSystem: false,
			currency,
			balance: Money.zero(currency),
			createdAt: raw.createdAt,
			updatedAt: raw.updatedAt,
		});
	}
}
