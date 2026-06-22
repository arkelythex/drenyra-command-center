import { and, asc, desc, eq } from "drizzle-orm";
import type {
	ChainVerificationResult,
	FiscalTruthEvent,
	FiscalTruthRepository,
	FiscalTruthScope,
} from "@arkelythex/domain";
import { computeAuditHash } from "@arkelythex/domain";
import type { DbTransaction } from "../unit-of-work";
import { db } from "../client";
import { fiscalTruthEvents } from "../schema/fiscal-truth.schema";

function toOrganizationId(value: number | null): string | null {
	if (value === null || Number.isNaN(value)) {
		return null;
	}

	return String(value);
}

function toDate(value: string): Date {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date value: ${value}`);
	}
	return date;
}

function mapRowToEvent(
	row: typeof fiscalTruthEvents.$inferSelect,
): FiscalTruthEvent {
	return {
		eventId: row.eventId,
		aggregateId: row.aggregateId,
		aggregateType: row.aggregateType,
		eventKind: row.eventKind as FiscalTruthEvent["eventKind"],
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
		payload: row.payload as Record<string, unknown>,
		prevHash: row.prevHash ?? undefined,
		chainHash: row.chainHash || undefined,
	};
}

/**
 * Build a scope-level equality filter for the fiscal_truth_events table.
 */
function scopeFilter(scope: FiscalTruthScope) {
	return and(
		eq(fiscalTruthEvents.companyId, scope.companyId),
		eq(fiscalTruthEvents.companyRuc, scope.companyRuc),
		eq(fiscalTruthEvents.period, scope.period),
	);
}

export class PostgresFiscalTruthRepository implements FiscalTruthRepository {
	constructor(private readonly client: DbTransaction | typeof db = db) {}

	async append(event: FiscalTruthEvent): Promise<void> {
		// 1. Retrieve last chainHash for this scope
		const lastEvent = await this.client
			.select({ chainHash: fiscalTruthEvents.chainHash })
			.from(fiscalTruthEvents)
			.where(scopeFilter(event.scope))
			.orderBy(desc(fiscalTruthEvents.occurredAt))
			.limit(1);

		const prevHash: string | null =
			lastEvent.length > 0 ? lastEvent[0].chainHash : null;

		// 2. Compute the cryptographic chain hash
		const chainHash = await computeAuditHash(event.payload, prevHash);

		// 3. Insert with hash-link columns
		await this.client.insert(fiscalTruthEvents).values({
				eventId: event.eventId,
				aggregateId: event.aggregateId,
				aggregateType: event.aggregateType,
				eventKind: event.eventKind,
				companyId: event.scope.companyId,
				companyRuc: event.scope.companyRuc,
				organizationId: toOrganizationId(event.scope.organizationId),
				period: event.scope.period,
				countryCode: event.scope.countryCode,
				traceId: event.trace.traceId,
				correlationId: event.trace.correlationId,
				causationId: event.trace.causationId,
				validatorSetVersion: event.validatorSetVersion,
				policyVersion: event.policyVersion,
				evidenceRootNodeId: event.evidenceRootNodeId,
				evidenceBundleHash: event.evidenceBundleHash,
				approvalId: event.approvalId,
				occurredAt: toDate(event.occurredAt),
				payload: event.payload,
				prevHash,
				chainHash,
			});
		}

	async findByEventId(
		eventId: string,
		scope: FiscalTruthScope,
	): Promise<FiscalTruthEvent | null> {
		const rows = await this.client
			.select()
			.from(fiscalTruthEvents)
			.where(
				and(
					eq(fiscalTruthEvents.eventId, eventId),
					eq(fiscalTruthEvents.companyId, scope.companyId),
					eq(fiscalTruthEvents.companyRuc, scope.companyRuc),
					eq(fiscalTruthEvents.period, scope.period),
				),
			)
			.limit(1);

		const row = rows[0];
		return row ? mapRowToEvent(row) : null;
	}

	async findByAggregateId(
		aggregateId: string,
		scope: FiscalTruthScope,
	): Promise<FiscalTruthEvent[]> {
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

	async verifyChain(scope: FiscalTruthScope): Promise<ChainVerificationResult> {
		const rows = await this.client
			.select({
				eventId: fiscalTruthEvents.eventId,
				prevHash: fiscalTruthEvents.prevHash,
				chainHash: fiscalTruthEvents.chainHash,
				occurredAt: fiscalTruthEvents.occurredAt,
				payload: fiscalTruthEvents.payload,
			})
			.from(fiscalTruthEvents)
			.where(scopeFilter(scope))
			.orderBy(asc(fiscalTruthEvents.occurredAt));

		const brokenLinks: ChainVerificationResult["brokenLinks"] = [];
		let previousChainHash: string | null = null;
		let validCount = 0;

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];

			// Skip pre-migration events (empty-chain markers)
			if (!row.chainHash) {
				previousChainHash = null;
				continue;
			}

			// --- Verify prevHash linkage ---
			if (row.prevHash !== previousChainHash) {
				brokenLinks.push({
					index: i,
					eventId: row.eventId,
					expectedPrevHash: previousChainHash,
					actualPrevHash: row.prevHash,
					expectedChainHash: row.chainHash,
					actualChainHash: row.chainHash,
				});
			}

			// --- Verify chainHash integrity ---
			const expectedHash = await computeAuditHash(
				row.payload as Record<string, unknown>,
				row.prevHash,
			);
			if (row.chainHash !== expectedHash) {
				brokenLinks.push({
					index: i,
					eventId: row.eventId,
					expectedPrevHash: row.prevHash,
					actualPrevHash: row.prevHash,
					expectedChainHash: expectedHash,
					actualChainHash: row.chainHash,
				});
			}

			previousChainHash = row.chainHash;
			validCount++;
		}

		return {
			valid: brokenLinks.length === 0,
			count: validCount,
			brokenLinks,
		};
	}
}
