import type { CapabilityRoutingRule } from "@drenyra/domain/ai/model-router-types";
import type { CapabilityRoutingRuleRepository } from "@drenyra/domain/repositories/model-registration.repository";
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
		costCapCents: row.costCapCents ?? undefined,
		latencyCapMs: row.latencyCapMs ?? undefined,
		minReliability: row.minReliability ?? undefined,
		requiresAudit: row.requiresAudit,
		fallbackStrategy: (row.fallbackStrategy ??
			"fallback_chain") as CapabilityRoutingRule["fallbackStrategy"],
		metadata: row.metadata as Record<string, unknown> | undefined,
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

export class PostgresCapabilityRoutingRuleRepository
	implements CapabilityRoutingRuleRepository
{
	async save(rule: CapabilityRoutingRule): Promise<CapabilityRoutingRule> {
		const rows = await db
			.insert(capabilityRoutingRules)
			.values(mapDomainToRow(rule))
			.onConflictDoNothing()
			.returning();

		return mapRowToDomain(rows[0] ?? rule);
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
