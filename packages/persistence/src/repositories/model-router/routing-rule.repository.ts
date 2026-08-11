import type { CapabilityRoutingRule } from "@drenyra/ai/providers/model-router-types";
import { eq } from "drizzle-orm";
import { db } from "../../client";
import { capabilityRoutingRules } from "../../schema/model-router.schema";
import type {
	CapabilityRoutingRuleRow,
	NewCapabilityRoutingRuleRow,
} from "./types";

function mapRowToDomain(row: CapabilityRoutingRuleRow): CapabilityRoutingRule {
	return {
		id: row.id,
		capability: row.capability as CapabilityRoutingRule["capability"],
		strategy: row.strategy as CapabilityRoutingRule["strategy"],
		allowedModelIds: row.allowedModelIds ?? [],
		excludedModelIds: row.excludedModelIds ?? [],
		maxRetries: row.maxRetries,
		...(row.costCapCents !== null
			? { costCapCents: row.costCapCents }
			: {}),
		...(row.latencyCapMs !== null
			? { latencyCapMs: row.latencyCapMs }
			: {}),
		...(row.minReliability !== null
			? { minReliability: row.minReliability }
			: {}),
		requiresAudit: row.requiresAudit,
		fallbackStrategy: (row.fallbackStrategy ??
			"fallback_chain") as CapabilityRoutingRule["fallbackStrategy"],
		...(row.metadata !== null
			? { metadata: row.metadata as Record<string, unknown> }
			: {}),
	};
}

function mapDomainToRow(
	domain: CapabilityRoutingRule,
): NewCapabilityRoutingRuleRow {
	return {
		id: domain.id,
		capability: domain.capability,
		strategy: domain.strategy,
		allowedModelIds:
			domain.allowedModelIds.length > 0 ? domain.allowedModelIds : null,
		excludedModelIds:
			domain.excludedModelIds.length > 0 ? domain.excludedModelIds : null,
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
	async save(rule: CapabilityRoutingRule): Promise<CapabilityRoutingRule> {
		const rows = await db
			.insert(capabilityRoutingRules)
			.values(mapDomainToRow(rule))
			.onConflictDoNothing()
			.returning();
    
		const row = rows[0];
		return row ? mapRowToDomain(row) : rule;
	}

	async findByCapability(
		capability: string,
	): Promise<CapabilityRoutingRule | null> {
		const rows = await db
			.select()
			.from(capabilityRoutingRules)
			.where(eq(capabilityRoutingRules.capability, capability))
			.limit(1);

		return rows.length > 0 ? mapRowToDomain(rows[0]!) : null;
	}

	async findAll(): Promise<CapabilityRoutingRule[]> {
		const rows = await db.select().from(capabilityRoutingRules);
		return rows.map(mapRowToDomain);
	}

	async delete(id: string): Promise<void> {
		await db
			.delete(capabilityRoutingRules)
			.where(eq(capabilityRoutingRules.id, id));
	}
}
