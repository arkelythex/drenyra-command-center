import { and, asc, count, eq, like, ne, or } from "drizzle-orm";
import { Account, } from "@arkelythex/domain/entities/Account";
import { Money } from "@arkelythex/domain/value-objects/Money";
import { db } from "../client";
import { pcgeAccounts } from "../schema";
import { resolveCompanyIdFromOrganization, resolveOrganizationIdFromCompany } from "./support/organization-resolver";
const levelFromCode = (code) => {
    if (code.length <= 2)
        return "1";
    if (code.length === 3)
        return "2";
    if (code.length === 4)
        return "3";
    if (code.length === 5)
        return "4";
    return "5";
};
export class PostgresAccountRepository {
    async save(account) {
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
    async findById(id) {
        const row = await db.query.pcgeAccounts.findFirst({ where: eq(pcgeAccounts.id, id) });
        return row ? this.mapToDomain(row) : null;
    }
    async findByCode(organizationId, code) {
        const companyId = await resolveCompanyIdFromOrganization(organizationId);
        const row = await db.query.pcgeAccounts.findFirst({ where: and(eq(pcgeAccounts.companyId, companyId), eq(pcgeAccounts.code, code)) });
        return row ? this.mapToDomain(row, organizationId) : null;
    }
    async findAll(organizationId) {
        const companyId = await resolveCompanyIdFromOrganization(organizationId);
        const rows = await db.query.pcgeAccounts.findMany({ where: eq(pcgeAccounts.companyId, companyId), orderBy: [asc(pcgeAccounts.code)] });
        return Promise.all(rows.map((row) => this.mapToDomain(row, organizationId)));
    }
    async findWithFilters(filters) {
        const companyId = await resolveCompanyIdFromOrganization(filters.organizationId);
        const rows = await db.query.pcgeAccounts.findMany({
            where: and(...this.buildConditions(companyId, filters)),
            orderBy: [asc(pcgeAccounts.code)],
        });
        return Promise.all(rows.map((row) => this.mapToDomain(row, filters.organizationId)));
    }
    async findChildren(parentId) {
        const rows = await db.query.pcgeAccounts.findMany({ where: eq(pcgeAccounts.parentId, parentId), orderBy: [asc(pcgeAccounts.code)] });
        return Promise.all(rows.map((row) => this.mapToDomain(row)));
    }
    async findMovementAccounts(organizationId) {
        const accounts = await this.findWithFilters({ organizationId, status: "active" });
        return accounts.filter((account) => account.isMovementAccount());
    }
    async getHierarchy(organizationId) {
        const accounts = await this.findAll(organizationId);
        const byId = new Map();
        for (const account of accounts)
            byId.set(account.id, Object.assign(account, { children: [] }));
        const roots = [];
        for (const account of byId.values()) {
            if (account.parentId && byId.has(account.parentId)) {
                byId.get(account.parentId)?.children.push(account);
            }
            else {
                roots.push(account);
            }
        }
        return roots;
    }
    async delete(id) {
        await db.delete(pcgeAccounts).where(eq(pcgeAccounts.id, id));
    }
    async hasChildren(id) {
        const [result] = await db.select({ value: count() }).from(pcgeAccounts).where(eq(pcgeAccounts.parentId, id));
        return (result?.value ?? 0) > 0;
    }
    async codeExists(organizationId, code, excludeId) {
        const companyId = await resolveCompanyIdFromOrganization(organizationId);
        const conditions = [eq(pcgeAccounts.companyId, companyId), eq(pcgeAccounts.code, code)];
        if (excludeId)
            conditions.push(ne(pcgeAccounts.id, excludeId));
        const [result] = await db.select({ value: count() }).from(pcgeAccounts).where(and(...conditions));
        return (result?.value ?? 0) > 0;
    }
    async count(filters) {
        if (!filters) {
            const [result] = await db.select({ value: count() }).from(pcgeAccounts);
            return result?.value ?? 0;
        }
        const companyId = await resolveCompanyIdFromOrganization(filters.organizationId);
        const [result] = await db.select({ value: count() }).from(pcgeAccounts).where(and(...this.buildConditions(companyId, filters)));
        return result?.value ?? 0;
    }
    async getNextChildCode(parentId) {
        const parent = await this.findById(parentId);
        if (!parent)
            throw new Error("Parent account not found");
        const children = await this.findChildren(parentId);
        if (children.length === 0)
            return `${parent.code}1`;
        const suffixes = children.map((child) => Number.parseInt(child.code.slice(parent.code.length), 10)).filter(Number.isFinite);
        return `${parent.code}${Math.max(...suffixes) + 1}`;
    }
    buildConditions(companyId, filters) {
        const conditions = [eq(pcgeAccounts.companyId, companyId)];
        if (filters.status && filters.status !== "all")
            conditions.push(eq(pcgeAccounts.isActive, filters.status === "active" ? "S" : "N"));
        if (filters.type)
            conditions.push(eq(pcgeAccounts.type, filters.type));
        if (filters.level)
            conditions.push(eq(pcgeAccounts.level, filters.level));
        if (filters.parentId)
            conditions.push(eq(pcgeAccounts.parentId, filters.parentId));
        if (filters.onlyMovement)
            conditions.push(eq(pcgeAccounts.level, "5"));
        if (filters.searchTerm) {
            const search = `%${filters.searchTerm}%`;
            const searchCondition = or(like(pcgeAccounts.code, search), like(pcgeAccounts.name, search));
            if (searchCondition)
                conditions.push(searchCondition);
        }
        return conditions;
    }
    async mapToDomain(raw, organizationId) {
        const resolvedOrganizationId = organizationId ?? await resolveOrganizationIdFromCompany(raw.companyId);
        const level = raw.level;
        const currency = "PEN";
        return Account.create({
            id: raw.id,
            organizationId: resolvedOrganizationId,
            code: raw.code,
            name: raw.name,
            level: levelFromCode(raw.code) === level ? level : levelFromCode(raw.code),
            type: raw.type,
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
//# sourceMappingURL=postgres-account.repository.js.map