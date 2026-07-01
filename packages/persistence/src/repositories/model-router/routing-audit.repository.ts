import type {
	ModelCapability,
	RoutingResult,
} from "@arkelythex/domain/ai/model-router/types";
import type { RoutingAuditLogRepository } from "@arkelythex/domain/repositories/model-registration.repository";
import { and, eq, gte } from "drizzle-orm";
import { db } from "../../client";
import { routingAuditLog } from "../../schema/model-router.schema";
import type { NewRoutingAuditLogRow } from "./types";

function mapDomainToRow(entry: RoutingResult): NewRoutingAuditLogRow {
	return {
		requestId: entry.requestId,
		capability: entry.capability,
		selectedModelId: entry.selectedModelId,
		providerName: entry.providerName,
		modelName: entry.modelName,
		strategyUsed: entry.strategy,
		latencyMs: entry.latencyMs ?? null,
		costCents: entry.costCents ?? null,
		success: entry.success,
		fallbackAttempted: entry.fallbackAttempted ?? null,
		attemptNumber: entry.attemptNumber,
		errorMessage: entry.errorMessage ?? null,
	};
}

export class PostgresRoutingAuditLogRepository
	implements RoutingAuditLogRepository
{
	async save(entry: RoutingResult): Promise<void> {
		await db.insert(routingAuditLog).values(mapDomainToRow(entry));
	}

	async findByRequestId(requestId: string): Promise<RoutingResult[]> {
		const rows = await db
			.select()
			.from(routingAuditLog)
			.where(eq(routingAuditLog.requestId, requestId));

		return rows.map((r) => ({
			requestId: r.requestId,
			capability: r.capability as ModelCapability,
			selectedModelId: r.selectedModelId!,
			providerName: r.providerName as RoutingResult["providerName"],
			modelName: r.modelName,
			strategy: r.strategyUsed as RoutingResult["strategy"],
			latencyMs: r.latencyMs ?? undefined,
			costCents: r.costCents ?? undefined,
			success: r.success,
			fallbackAttempted: r.fallbackAttempted ?? undefined,
			attemptNumber: r.attemptNumber ?? 1,
			errorMessage: r.errorMessage ?? undefined,
			timestamp: r.createdAt,
		}));
	}

	async findByCapability(
		capability: ModelCapability,
		since: Date,
	): Promise<RoutingResult[]> {
		const rows = await db
			.select()
			.from(routingAuditLog)
			.where(
				and(
					eq(routingAuditLog.capability, capability),
					gte(routingAuditLog.createdAt, since),
				),
			)
			.orderBy(routingAuditLog.createdAt);

		return rows.map((r) => ({
			requestId: r.requestId,
			capability: r.capability as ModelCapability,
			selectedModelId: r.selectedModelId!,
			providerName: r.providerName as RoutingResult["providerName"],
			modelName: r.modelName,
			strategy: r.strategyUsed as RoutingResult["strategy"],
			latencyMs: r.latencyMs ?? undefined,
			costCents: r.costCents ?? undefined,
			success: r.success,
			fallbackAttempted: r.fallbackAttempted ?? undefined,
			attemptNumber: r.attemptNumber ?? 1,
			errorMessage: r.errorMessage ?? undefined,
			timestamp: r.createdAt,
		}));
	}
}
