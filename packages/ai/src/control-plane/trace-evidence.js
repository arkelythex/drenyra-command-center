import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { aiTraceEvidence } from "@drenyra/persistence/schema";
import { z } from "zod";
import { TenantCompanyRucScopeSchema, } from "./contracts";
const nonEmpty = z.string().min(1);
export const EvidenceScopeSchema = z.enum([
    "ledger-entry",
    "policy-artifact",
    "fiscal-document",
]);
export const TraceEvidenceItemSchema = z
    .object({
    sourceRef: nonEmpty,
    hash: nonEmpty,
    scope: EvidenceScopeSchema,
    isRedacted: z.boolean(),
})
    .refine((item) => item.scope !== "fiscal-document" || item.isRedacted, "fiscal-document evidence must be redacted");
export const EvidenceTraceBundleSchema = z
    .object({
    traceId: nonEmpty,
    tenantScope: TenantCompanyRucScopeSchema,
    redactionStatus: z.enum(["redacted", "partially-redacted"]),
    toolCalls: z.array(nonEmpty),
    rationale: nonEmpty,
    evidence: z.array(TraceEvidenceItemSchema),
    approvalLineage: z
        .object({
        approvalId: nonEmpty,
        approvalStatus: z.enum([
            "proposed",
            "validated",
            "approved",
            "rejected",
        ]),
        decision: z.enum(["pending", "approved", "rejected"]),
        decisionEvidenceRef: z.string().min(1).optional(),
        decisionEvidenceRedacted: z.boolean().optional(),
    })
        .optional(),
    auditTrail: z
        .array(z.object({
        eventType: nonEmpty,
        status: z.enum(["success", "failure"]),
        recordedAt: nonEmpty,
        actorId: nonEmpty,
        actorRole: z.enum(["system", "supervisor", "financial-controller"]),
        reasonCode: nonEmpty,
    }))
        .optional(),
})
    .refine((bundle) => bundle.redactionStatus === "redacted" ||
    bundle.evidence.every((item) => item.isRedacted), "partially-redacted traces cannot contain unredacted evidence")
    .refine((bundle) => {
    const lineage = bundle.approvalLineage;
    if (!lineage?.decisionEvidenceRef) {
        return true;
    }
    if (lineage.decisionEvidenceRef.startsWith("doc://")) {
        return lineage.decisionEvidenceRedacted === true;
    }
    return true;
}, "approval lineage fiscal-document evidence must be redacted");
const scopeMatches = (left, right) => {
    return (left.tenantId === right.tenantId &&
        left.organizationId === right.organizationId &&
        left.companyId === right.companyId &&
        left.ruc === right.ruc);
};
const createBaseStore = (setBundle, getBundle) => {
    const getScoped = (input) => {
        const bundle = getBundle(input.traceId);
        if (!bundle) {
            return { found: false, reason: "not-found" };
        }
        if (!scopeMatches(bundle.tenantScope, input.tenantScope)) {
            return { found: false, reason: "scope-mismatch" };
        }
        return { found: true, bundle };
    };
    return {
        save(bundle) {
            const parsed = EvidenceTraceBundleSchema.parse(bundle);
            setBundle(parsed);
            return parsed;
        },
        getScoped(input) {
            return getScoped(input);
        },
        updateApprovalLineage(input) {
            const lookup = getScoped({
                traceId: input.traceId,
                tenantScope: input.tenantScope,
            });
            if (!lookup.found) {
                return lookup;
            }
            const updated = EvidenceTraceBundleSchema.parse({
                ...lookup.bundle,
                approvalLineage: input.approvalLineage,
            });
            setBundle(updated);
            return { found: true, bundle: updated };
        },
        appendAuditEvent(input) {
            const lookup = getScoped({
                traceId: input.traceId,
                tenantScope: input.tenantScope,
            });
            if (!lookup.found) {
                return lookup;
            }
            const updated = EvidenceTraceBundleSchema.parse({
                ...lookup.bundle,
                auditTrail: [...(lookup.bundle.auditTrail ?? []), input.event],
            });
            setBundle(updated);
            return { found: true, bundle: updated };
        },
    };
};
export const createInMemoryTraceEvidenceStore = () => {
    const store = new Map();
    return createBaseStore((bundle) => {
        store.set(bundle.traceId, bundle);
    }, (traceId) => store.get(traceId));
};
const safeParseTraceStoreEvent = (line) => {
    try {
        const parsed = JSON.parse(line);
        if (typeof parsed === "object" &&
            parsed !== null &&
            "type" in parsed &&
            parsed.type === "upsert" &&
            "bundle" in parsed) {
            const bundle = EvidenceTraceBundleSchema.safeParse(parsed.bundle);
            if (bundle.success) {
                return { type: "upsert", bundle: bundle.data };
            }
        }
        return null;
    }
    catch {
        return null;
    }
};
export const createAppendOnlyTraceEvidenceStore = (input) => {
    const store = new Map();
    if (existsSync(input.filePath)) {
        const content = readFileSync(input.filePath, "utf-8");
        for (const line of content.split("\n")) {
            if (!line.trim()) {
                continue;
            }
            const event = safeParseTraceStoreEvent(line);
            if (event) {
                store.set(event.bundle.traceId, event.bundle);
            }
        }
    }
    const append = (bundle) => {
        mkdirSync(dirname(input.filePath), { recursive: true });
        const event = { type: "upsert", bundle };
        appendFileSync(input.filePath, `${JSON.stringify(event)}\n`, "utf-8");
    };
    return createBaseStore((bundle) => {
        store.set(bundle.traceId, bundle);
        append(bundle);
    }, (traceId) => store.get(traceId));
};
export function createPostgresTraceEvidenceStore(db, ttlDays = 90) {
    const cache = new Map();
    hydrateCacheFromDb(db, cache);
    return createBaseStore((bundle) => {
        cache.set(bundle.traceId, bundle);
        void db
            .insert(aiTraceEvidence)
            .values({
            traceId: bundle.traceId,
            agentId: null,
            decision: bundle.approvalLineage?.approvalStatus ?? "proposed",
            policyResult: bundle,
            tenantScope: bundle.tenantScope,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
        })
            .returning()
            .catch((err) => {
            console.error(`[PostgresTraceEvidenceStore] Failed to save trace ${bundle.traceId}:`, err);
        });
    }, (traceId) => cache.get(traceId));
}
function hydrateCacheFromDb(db, cache) {
    try {
        void db
            .select()
            .from(aiTraceEvidence)
            .then((rows) => {
            for (const row of rows) {
                const bundle = row.policyResult;
                if (bundle?.traceId) {
                    cache.set(bundle.traceId, bundle);
                }
            }
        })
            .catch((err) => {
            console.error("[PostgresTraceEvidenceStore] Failed to hydrate cache from DB:", err);
        });
    }
    catch {
    }
}
//# sourceMappingURL=trace-evidence.js.map