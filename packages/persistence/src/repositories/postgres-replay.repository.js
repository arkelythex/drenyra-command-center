import { and, asc, eq } from "drizzle-orm";
import { db } from "../client";
import {
	fiscalReplayCheckpoints,
	fiscalTruthEvents,
} from "../schema/fiscal-truth.schema";

function mapRowToEvent(row) {
	return {
		eventId: row.eventId,
		aggregateId: row.aggregateId,
		aggregateType: row.aggregateType,
		eventKind: row.eventKind,
		scope: {
			companyId: row.companyId,
			companyRuc: row.companyRuc,
			organizationId: row.organizationId ? Number(row.organizationId) : null,
			period: row.period,
			countryCode: row.countryCode,
		},
		trace: {
			traceId: row.traceId,
			correlationId: row.correlationId,
			causationId: row.causationId,
		},
		validatorSetVersion: row.validatorSetVersion,
		policyVersion: row.policyVersion,
		evidenceRootNodeId: row.evidenceRootNodeId,
		evidenceBundleHash: row.evidenceBundleHash,
		approvalId: row.approvalId,
		occurredAt: row.occurredAt.toISOString(),
		payload: row.payload,
	};
}
export class PostgresReplayRepository {
	client;
	constructor(client = db) {
		this.client = client;
	}
	async loadEventChain(aggregateId, scope) {
		const rows = await this.client
			.select()
			.from(fiscalTruthEvents)
			.where(
				and(
					eq(fiscalTruthEvents.aggregateId, aggregateId),
					eq(fiscalTruthEvents.companyId, scope.companyId),
					eq(fiscalTruthEvents.companyRuc, scope.companyRuc),
					eq(fiscalTruthEvents.period, scope.period),
				),
			)
			.orderBy(asc(fiscalTruthEvents.occurredAt));
		return rows.map(mapRowToEvent);
	}
	async saveReplayResult(aggregateId, result, scope) {
		await this.client.insert(fiscalReplayCheckpoints).values({
			aggregateId,
			companyId: scope.companyId,
			companyRuc: scope.companyRuc,
			organizationId:
				scope.organizationId === null ? null : String(scope.organizationId),
			period: scope.period,
			countryCode: scope.countryCode,
			success: result.success,
			reproducedEventId: result.reproducedEventId,
			reproducedOutcomeHash: result.reproducedOutcomeHash,
			failureCode: result.failureCode,
			message: result.message,
		});
	}
}

