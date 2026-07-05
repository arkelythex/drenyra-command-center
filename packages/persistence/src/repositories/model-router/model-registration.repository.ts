import type { ModelRegistration } from "@drenyra/domain/ai/model-router-types";
import type {
	CapabilityScoringParams,
	ModelFilters,
	ModelRegistrationRepository,
} from "@drenyra/domain/repositories/model-registration.repository";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../client";
import { modelRegistrations } from "../../schema/model-router.schema";
import type { ModelRegistrationRow, NewModelRegistrationRow } from "./types";

function mapRowToDomain(row: ModelRegistrationRow): ModelRegistration {
	return {
		id: row.id,
		providerName: row.providerName as ModelRegistration["providerName"],
		modelName: row.modelName,
		displayName: row.displayName,
		capabilities: row.capabilities as ModelRegistration["capabilities"],
		status: row.status as ModelRegistration["status"],
		priority: row.priority,
		costPer1KInput: row.costPer1KInput,
		costPer1KOutput: row.costPer1KOutput,
		maxTokens: row.maxTokens,
		avgLatencyMs: row.avgLatencyMs ?? undefined,
		reliability: row.reliability ?? undefined,
		metadata: row.metadata as Record<string, unknown> | undefined,
		healthProbeUrl: row.healthProbeUrl ?? undefined,
		tags: row.tags ?? undefined,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

function mapDomainToRow(domain: ModelRegistration): NewModelRegistrationRow {
	return {
		id: domain.id,
		providerName: domain.providerName,
		modelName: domain.modelName,
		displayName: domain.displayName,
		capabilities: domain.capabilities,
		status: domain.status,
		priority: domain.priority,
		costPer1KInput: domain.costPer1KInput,
		costPer1KOutput: domain.costPer1KOutput,
		maxTokens: domain.maxTokens,
		avgLatencyMs: domain.avgLatencyMs ?? null,
		reliability: domain.reliability ?? null,
		metadata: domain.metadata ?? null,
		healthProbeUrl: domain.healthProbeUrl ?? null,
		tags: domain.tags ?? null,
	};
}

function mapDomainToUpdateRow(
	domain: ModelRegistration,
): Partial<NewModelRegistrationRow> {
	return {
		providerName: domain.providerName,
		modelName: domain.modelName,
		displayName: domain.displayName,
		capabilities: domain.capabilities,
		status: domain.status,
		priority: domain.priority,
		costPer1KInput: domain.costPer1KInput,
		costPer1KOutput: domain.costPer1KOutput,
		maxTokens: domain.maxTokens,
		avgLatencyMs: domain.avgLatencyMs ?? null,
		reliability: domain.reliability ?? null,
		metadata: domain.metadata ?? null,
		healthProbeUrl: domain.healthProbeUrl ?? null,
		tags: domain.tags ?? null,
		updatedAt: new Date(),
	};
}

export class PostgresModelRegistrationRepository
	implements ModelRegistrationRepository
{
	async save(model: ModelRegistration): Promise<ModelRegistration> {
		const rows = await db
			.insert(modelRegistrations)
			.values(mapDomainToRow(model))
			.onConflictDoNothing()
			.returning();

		return mapRowToDomain(rows[0] ?? model);
	}

	async update(model: ModelRegistration): Promise<ModelRegistration> {
		const rows = await db
			.update(modelRegistrations)
			.set(mapDomainToUpdateRow(model))
			.where(eq(modelRegistrations.id, model.id))
			.returning();

		return mapRowToDomain(rows[0]!);
	}

	async findById(id: string): Promise<ModelRegistration | null> {
		const rows = await db
			.select()
			.from(modelRegistrations)
			.where(eq(modelRegistrations.id, id))
			.limit(1);

		return rows.length > 0 ? mapRowToDomain(rows[0]!) : null;
	}

	async findAll(filters?: ModelFilters): Promise<ModelRegistration[]> {
		const conditions: ReturnType<typeof eq>[] = [];

		if (filters?.status) {
			conditions.push(eq(modelRegistrations.status, filters.status));
		}
		if (filters?.providerName) {
			conditions.push(
				eq(modelRegistrations.providerName, filters.providerName),
			);
		}
		if (filters?.minReliability !== undefined) {
			conditions.push(
				sql`${modelRegistrations.reliability} >= ${filters.minReliability}`,
			);
		}

		const rows = await db
			.select()
			.from(modelRegistrations)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(asc(modelRegistrations.priority));

		return rows.map(mapRowToDomain);
	}

	async findByCapability(capability: string): Promise<ModelRegistration[]> {
		const rows = await db
			.select()
			.from(modelRegistrations)
			.where(
				sql`${modelRegistrations.capabilities} @> ARRAY[${capability}]::varchar[]`,
			)
			.orderBy(asc(modelRegistrations.priority));

		return rows.map(mapRowToDomain);
	}

	async findOptimalForCapability(
		capability: string,
		scoring: CapabilityScoringParams,
	): Promise<ModelRegistration | null> {
		const conditions: ReturnType<typeof eq | typeof sql>[] = [
			sql`${modelRegistrations.capabilities} @> ARRAY[${capability}]::varchar[]`,
			eq(modelRegistrations.status, "ACTIVE"),
		];

		if (scoring.maxCostCents) {
			conditions.push(
				sql`${modelRegistrations.costPer1KInput} + ${modelRegistrations.costPer1KOutput} <= ${scoring.maxCostCents}`,
			);
		}
		if (scoring.minReliability) {
			conditions.push(
				sql`${modelRegistrations.reliability} >= ${scoring.minReliability}`,
			);
		}
		if (scoring.preferredProviders?.length) {
			conditions.push(
				inArray(modelRegistrations.providerName, scoring.preferredProviders),
			);
		}

		const rows = await db
			.select()
			.from(modelRegistrations)
			.where(and(...conditions))
			.orderBy(asc(modelRegistrations.priority));

		return rows.length > 0 ? mapRowToDomain(rows[0]!) : null;
	}

	async delete(id: string): Promise<void> {
		await db.delete(modelRegistrations).where(eq(modelRegistrations.id, id));
	}
}
