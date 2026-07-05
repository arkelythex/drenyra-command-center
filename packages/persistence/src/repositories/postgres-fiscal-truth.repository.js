import { and, asc, desc, eq } from "drizzle-orm";
import { computeAuditHash } from "@drenyra/domain";
import { db } from "../client";
import { fiscalTruthEvents } from "../schema/fiscal-truth.schema";
function toOrganizationId(value) {
    if (value === null || Number.isNaN(value)) {
        return null;
    }
    return String(value);
}
function toDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid date value: ${value}`);
    }
    return date;
}
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
        prevHash: row.prevHash ?? undefined,
        chainHash: row.chainHash || undefined,
    };
}
function scopeFilter(scope) {
    return and(eq(fiscalTruthEvents.companyId, scope.companyId), eq(fiscalTruthEvents.companyRuc, scope.companyRuc), eq(fiscalTruthEvents.period, scope.period));
}
export class PostgresFiscalTruthRepository {
    client;
    constructor(client = db) {
        this.client = client;
    }
    async append(event) {
        const lastEvent = await this.client
            .select({ chainHash: fiscalTruthEvents.chainHash })
            .from(fiscalTruthEvents)
            .where(scopeFilter(event.scope))
            .orderBy(desc(fiscalTruthEvents.occurredAt))
            .limit(1);
        const prevHash = lastEvent.length > 0 ? lastEvent[0].chainHash : null;
        const chainHash = await computeAuditHash(event.payload, prevHash);
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
    async findByEventId(eventId, scope) {
        const rows = await this.client
            .select()
            .from(fiscalTruthEvents)
            .where(and(eq(fiscalTruthEvents.eventId, eventId), eq(fiscalTruthEvents.companyId, scope.companyId), eq(fiscalTruthEvents.companyRuc, scope.companyRuc), eq(fiscalTruthEvents.period, scope.period)))
            .limit(1);
        const row = rows[0];
        return row ? mapRowToEvent(row) : null;
    }
    async findByAggregateId(aggregateId, scope) {
        const rows = await this.client
            .select()
            .from(fiscalTruthEvents)
            .where(and(eq(fiscalTruthEvents.aggregateId, aggregateId), eq(fiscalTruthEvents.companyId, scope.companyId), eq(fiscalTruthEvents.companyRuc, scope.companyRuc), eq(fiscalTruthEvents.period, scope.period)))
            .orderBy(asc(fiscalTruthEvents.occurredAt));
        return rows.map(mapRowToEvent);
    }
    async verifyChain(scope) {
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
        const brokenLinks = [];
        let previousChainHash = null;
        let validCount = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row.chainHash) {
                previousChainHash = null;
                continue;
            }
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
            const expectedHash = await computeAuditHash(row.payload, row.prevHash);
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
//# sourceMappingURL=postgres-fiscal-truth.repository.js.map