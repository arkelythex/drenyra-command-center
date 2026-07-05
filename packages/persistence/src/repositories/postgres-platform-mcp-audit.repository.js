import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { platformMcpAuditEvents } from "../schema/platform-mcp.schema";

function toDate(value) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime()))
		throw new Error(`Invalid date value: ${value}`);
	return date;
}
function createAuditId() {
	return `pmcp_${crypto.randomUUID()}`;
}
function fromRow(row) {
	return {
		operation: row.operation,
		outcome: row.outcome,
		toolName: row.toolName,
		scope: {
			organizationId: row.organizationId,
			companyId: row.companyId,
			companyRuc: row.companyRuc,
			period: row.period,
			countryCode: "PE",
			userId: row.actorId,
		},
		actorId: row.actorId,
		redactionStatus: row.redactionStatus,
		reason: row.reason,
		occurredAt: row.occurredAt.toISOString(),
		metadata: row.metadata,
	};
}
export class PostgresPlatformMcpAuditSink {
	async append(event) {
		await db.insert(platformMcpAuditEvents).values({
			id: createAuditId(),
			operation: event.operation,
			outcome: event.outcome,
			toolName: event.toolName,
			companyId: event.scope.companyId,
			companyRuc: event.scope.companyRuc,
			organizationId: event.scope.organizationId,
			period: event.scope.period,
			countryCode: event.scope.countryCode,
			actorId: event.actorId,
			redactionStatus: event.redactionStatus,
			reason: event.reason,
			occurredAt: toDate(event.occurredAt),
			metadata: event.metadata,
			message: `${event.operation}:${event.outcome}:${event.toolName}:${event.reason}`,
		});
	}
	async list(query) {
		const filters = [
			eq(platformMcpAuditEvents.organizationId, query.scope.organizationId),
			eq(platformMcpAuditEvents.companyId, query.scope.companyId),
			eq(platformMcpAuditEvents.companyRuc, query.scope.companyRuc),
			eq(platformMcpAuditEvents.period, query.scope.period),
			eq(platformMcpAuditEvents.countryCode, query.scope.countryCode),
			query.outcome
				? eq(platformMcpAuditEvents.outcome, query.outcome)
				: undefined,
			query.toolName
				? eq(platformMcpAuditEvents.toolName, query.toolName)
				: undefined,
		].filter((filter) => filter !== undefined);
		const rows = await db
			.select()
			.from(platformMcpAuditEvents)
			.where(and(...filters))
			.orderBy(desc(platformMcpAuditEvents.occurredAt))
			.limit(query.limit);
		return rows.map(fromRow);
	}
}
//# sourceMappingURL=postgres-platform-mcp-audit.repository.js.map
