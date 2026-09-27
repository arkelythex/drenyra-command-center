import { Organization } from "@drenyra/domain/entities/organization";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../client";
import { organizationMetrics, organizations } from "../../schema";
export class PostgresOrganizationRepository {
    async findById(id) {
        const numericId = Number(id);
        if (Number.isNaN(numericId))
            return null;
        const row = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, numericId))
            .limit(1);
        return row[0] ? this.mapRowToEntity(row[0]) : null;
    }
    async findAll(filters) {
        const conditions = this.buildFilterConditions(filters);
        const limit = filters?.limit ?? 50;
        const offset = filters?.offset ?? 0;
        const rows = await db
            .select()
            .from(organizations)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .limit(limit)
            .offset(offset)
            .orderBy(organizations.name);
        return rows.map((row) => this.mapRowToEntity(row));
    }
    async count(filters) {
        const conditions = this.buildFilterConditions(filters);
        const result = await db
            .select({ count: sql `count(*)` })
            .from(organizations)
            .where(conditions.length > 0 ? and(...conditions) : undefined);
        return Number(result[0].count);
    }
    async save(entity) {
        await db.insert(organizations).values(this.mapEntityToRow(entity));
        return entity;
    }
    async update(entity) {
        await db
            .update(organizations)
            .set(this.mapEntityToRow(entity))
            .where(eq(organizations.id, Number(entity.id)));
        return entity;
    }
    async delete(id) {
        const numericId = Number(id);
        if (Number.isNaN(numericId))
            return;
        await db.delete(organizations).where(eq(organizations.id, numericId));
    }
    async saveForOrganization(entity, _organizationId) {
        return this.save(entity);
    }
    async findForOrganization(organizationId, filters) {
        const numericId = Number(organizationId);
        if (Number.isNaN(numericId))
            return [];
        const conditions = [
            eq(organizations.id, numericId),
            ...this.buildFilterConditions(filters),
        ];
        const limit = filters?.limit ?? 50;
        const offset = filters?.offset ?? 0;
        const rows = await db
            .select()
            .from(organizations)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset);
        return rows.map((row) => this.mapRowToEntity(row));
    }
    async countForOrganization(organizationId, filters) {
        const numericId = Number(organizationId);
        if (Number.isNaN(numericId))
            return 0;
        const conditions = [
            eq(organizations.id, numericId),
            ...this.buildFilterConditions(filters),
        ];
        const result = await db
            .select({ count: sql `count(*)` })
            .from(organizations)
            .where(and(...conditions));
        return Number(result[0].count);
    }
    async deleteForOrganization(id, organizationId) {
        const numericId = Number(id);
        const numericOrgId = Number(organizationId);
        if (Number.isNaN(numericId) || Number.isNaN(numericOrgId))
            return;
        await db
            .delete(organizations)
            .where(and(eq(organizations.id, numericId), eq(organizations.id, numericOrgId)));
    }
    async findByRuc(ruc) {
        const row = await db
            .select()
            .from(organizations)
            .where(eq(organizations.ruc, ruc))
            .limit(1);
        return row[0] ? this.mapRowToEntity(row[0]) : null;
    }
    async findBySlug(slug) {
        const row = await db
            .select()
            .from(organizations)
            .where(eq(organizations.slug, slug))
            .limit(1);
        return row[0] ? this.mapRowToEntity(row[0]) : null;
    }
    async findActive() {
        const rows = await db
            .select()
            .from(organizations)
            .where(eq(organizations.status, "ACTIVE"))
            .orderBy(organizations.name);
        return rows.map((row) => this.mapRowToEntity(row));
    }
    async getFirmMetrics(organizationId) {
        const numericId = Number(organizationId);
        const latestMetrics = await db
            .select()
            .from(organizationMetrics)
            .where(eq(organizationMetrics.organizationId, numericId))
            .orderBy(organizationMetrics.periodStart)
            .limit(1);
        if (latestMetrics.length > 0) {
            const m = latestMetrics[0];
            return {
                totalCompanies: m.totalCompanies,
                activeCompanies: m.activeCompanies,
                pendingReconciliations: m.pendingReconciliations,
                overdueDocuments: m.overdueDocuments,
                healthPercentage: m.healthPercentage,
            };
        }
        return {
            totalCompanies: 0,
            activeCompanies: 0,
            pendingReconciliations: 0,
            overdueDocuments: 0,
            healthPercentage: 0,
        };
    }
    buildFilterConditions(filters) {
        const conditions = [];
        if (!filters)
            return conditions;
        if (filters.status) {
            conditions.push(eq(organizations.status, filters.status));
        }
        if (filters.search) {
            conditions.push(or(ilike(organizations.name, `%${filters.search}%`), ilike(organizations.ruc, `%${filters.search}%`), ilike(organizations.slug, `%${filters.search}%`)));
        }
        return conditions;
    }
    mapRowToEntity(row) {
        return Organization.fromPrimitives({
            id: String(row.id),
            name: row.name,
            ruc: row.ruc,
            slug: row.slug,
            settings: row.settings ?? undefined,
            status: row.status,
            healthScore: row.healthScore ?? undefined,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
    mapEntityToRow(entity) {
        const json = entity.toJSON();
        return {
            id: Number(json.id),
            name: json.name,
            ruc: json.ruc,
            slug: json.slug,
            status: json.status,
            healthScore: json.healthScore ?? 0,
            settings: (json.settings ?? {}),
            businessName: json.name,
            isActive: json.status === "ACTIVE",
            createdAt: new Date(json.createdAt),
            updatedAt: new Date(json.updatedAt),
        };
    }
}
//# sourceMappingURL=repository.js.map