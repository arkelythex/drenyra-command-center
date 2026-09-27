import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { z } from "zod";
import { type TenantCompanyRucScope } from "./contracts";
export declare const EvidenceScopeSchema: z.ZodEnum<{
    "ledger-entry": "ledger-entry";
    "policy-artifact": "policy-artifact";
    "fiscal-document": "fiscal-document";
}>;
export declare const TraceEvidenceItemSchema: z.ZodObject<{
    sourceRef: z.ZodString;
    hash: z.ZodString;
    scope: z.ZodEnum<{
        "ledger-entry": "ledger-entry";
        "policy-artifact": "policy-artifact";
        "fiscal-document": "fiscal-document";
    }>;
    isRedacted: z.ZodBoolean;
}, z.core.$strip>;
export declare const EvidenceTraceBundleSchema: z.ZodObject<{
    traceId: z.ZodString;
    tenantScope: z.ZodObject<{
        tenantId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        ruc: z.ZodString;
    }, z.core.$strip>;
    redactionStatus: z.ZodEnum<{
        redacted: "redacted";
        "partially-redacted": "partially-redacted";
    }>;
    toolCalls: z.ZodArray<z.ZodString>;
    rationale: z.ZodString;
    evidence: z.ZodArray<z.ZodObject<{
        sourceRef: z.ZodString;
        hash: z.ZodString;
        scope: z.ZodEnum<{
            "ledger-entry": "ledger-entry";
            "policy-artifact": "policy-artifact";
            "fiscal-document": "fiscal-document";
        }>;
        isRedacted: z.ZodBoolean;
    }, z.core.$strip>>;
    approvalLineage: z.ZodOptional<z.ZodObject<{
        approvalId: z.ZodString;
        approvalStatus: z.ZodEnum<{
            approved: "approved";
            rejected: "rejected";
            proposed: "proposed";
            validated: "validated";
        }>;
        decision: z.ZodEnum<{
            pending: "pending";
            approved: "approved";
            rejected: "rejected";
        }>;
        decisionEvidenceRef: z.ZodOptional<z.ZodString>;
        decisionEvidenceRedacted: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    auditTrail: z.ZodOptional<z.ZodArray<z.ZodObject<{
        eventType: z.ZodString;
        status: z.ZodEnum<{
            success: "success";
            failure: "failure";
        }>;
        recordedAt: z.ZodString;
        actorId: z.ZodString;
        actorRole: z.ZodEnum<{
            supervisor: "supervisor";
            "financial-controller": "financial-controller";
            system: "system";
        }>;
        reasonCode: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type EvidenceTraceBundle = z.infer<typeof EvidenceTraceBundleSchema>;
export type TraceLookupInput = {
    traceId: string;
    tenantScope: TenantCompanyRucScope;
};
export type TraceLookupResult = {
    found: true;
    bundle: EvidenceTraceBundle;
} | {
    found: false;
    reason: "not-found" | "scope-mismatch";
};
export type TraceEvidenceStore = {
    save(bundle: EvidenceTraceBundle): EvidenceTraceBundle;
    getScoped(input: TraceLookupInput): TraceLookupResult;
    updateApprovalLineage(input: {
        traceId: string;
        tenantScope: TenantCompanyRucScope;
        approvalLineage: NonNullable<EvidenceTraceBundle["approvalLineage"]>;
    }): TraceLookupResult;
    appendAuditEvent(input: {
        traceId: string;
        tenantScope: TenantCompanyRucScope;
        event: NonNullable<EvidenceTraceBundle["auditTrail"]>[number];
    }): TraceLookupResult;
};
export declare const createInMemoryTraceEvidenceStore: () => TraceEvidenceStore;
export declare const createAppendOnlyTraceEvidenceStore: (input: {
    filePath: string;
}) => TraceEvidenceStore;
type DrizzleDb = PostgresJsDatabase<any>;
export declare function createPostgresTraceEvidenceStore(db: DrizzleDb, ttlDays?: number): TraceEvidenceStore;
export {};
//# sourceMappingURL=trace-evidence.d.ts.map