import { eq } from "drizzle-orm";
import { db } from "../../client";
import { capabilityRoutingRules } from "../../schema/model-router.schema";
function mapRowToDomain(row) {
    return {
        id: row.id,
        capability: row.capability,
        strategy: row.strategy,
        allowedModelIds: row.allowedModelIds ?? [],
        excludedModelIds: row.excludedModelIds ?? [],
        maxRetries: row.maxRetries,
        costCapCents: row.costCapCents ?? undefined,
        latencyCapMs: row.latencyCapMs ?? undefined,
        minReliability: row.minReliability ?? undefined,
        requiresAudit: row.requiresAudit,
        fallbackStrategy: (row.fallbackStrategy ??
            "fallback_chain"),
        metadata: row.metadata,
    };
}
function mapDomainToRow(domain) {
    return {
        id: domain.id,
        capability: domain.capability,
        strategy: domain.strategy,
        allowedModelIds: domain.allowedModelIds.length > 0 ? domain.allowedModelIds : null,
        excludedModelIds: domain.excludedModelIds.length > 0 ? domain.excludedModelIds : null,
        maxRetries: domain.maxRetries,
        costCapCents: domain.costCapCents ?? null,
        latencyCapMs: domain.latencyCapMs ?? null,
        minReliability: domain.minReliability ?? null,
        requiresAudit: domain.requiresAudit,
        fallbackStrategy: domain.fallbackStrategy,
        metadata: domain.metadata ?? null,
    };
}
export class PostgresCapabilityRoutingRuleRepository {
    async save(rule) {
        const rows = await db
            .insert(capabilityRoutingRules)
            .values(mapDomainToRow(rule))
            .onConflictDoNothing()
            .returning();
        return mapRowToDomain(rows[0] ?? rule);
    }
    async findByCapability(capability) {
        const rows = await db
            .select()
            .from(capabilityRoutingRules)
            .where(eq(capabilityRoutingRules.capability, capability))
            .limit(1);
        return rows.length > 0 ? mapRowToDomain(rows[0]) : null;
    }
    async findAll() {
        const rows = await db.select().from(capabilityRoutingRules);
        return rows.map(mapRowToDomain);
    }
    async delete(id) {
        await db
            .delete(capabilityRoutingRules)
            .where(eq(capabilityRoutingRules.id, id));
    }
}
//# sourceMappingURL=routing-rule.repository.js.map