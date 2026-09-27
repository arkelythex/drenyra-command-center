import { and, eq, gte } from "drizzle-orm";
import { db } from "../../client";
import { routingAuditLog } from "../../schema/model-router.schema";
function mapDomainToRow(entry) {
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
export class PostgresRoutingAuditLogRepository {
    async save(entry) {
        await db.insert(routingAuditLog).values(mapDomainToRow(entry));
    }
    async findByRequestId(requestId) {
        const rows = await db
            .select()
            .from(routingAuditLog)
            .where(eq(routingAuditLog.requestId, requestId));
        return rows.map((r) => ({
            requestId: r.requestId,
            capability: r.capability,
            selectedModelId: r.selectedModelId,
            providerName: r.providerName,
            modelName: r.modelName,
            strategy: r.strategyUsed,
            latencyMs: r.latencyMs ?? undefined,
            costCents: r.costCents ?? undefined,
            success: r.success,
            fallbackAttempted: r.fallbackAttempted ?? undefined,
            attemptNumber: r.attemptNumber ?? 1,
            errorMessage: r.errorMessage ?? undefined,
            timestamp: r.createdAt,
        }));
    }
    async findByCapability(capability, since) {
        const rows = await db
            .select()
            .from(routingAuditLog)
            .where(and(eq(routingAuditLog.capability, capability), gte(routingAuditLog.createdAt, since)))
            .orderBy(routingAuditLog.createdAt);
        return rows.map((r) => ({
            requestId: r.requestId,
            capability: r.capability,
            selectedModelId: r.selectedModelId,
            providerName: r.providerName,
            modelName: r.modelName,
            strategy: r.strategyUsed,
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
//# sourceMappingURL=routing-audit.repository.js.map