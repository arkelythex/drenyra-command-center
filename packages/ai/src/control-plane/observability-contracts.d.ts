import { z } from "zod";
export declare const ObservabilityEventTypeSchema: z.ZodEnum<{
    log: "log";
    metric: "metric";
    span: "span";
}>;
export declare const RedactionEvidenceSchema: z.ZodObject<{
    fieldPath: z.ZodString;
    strategy: z.ZodEnum<{
        hash: "hash";
        mask: "mask";
        drop: "drop";
    }>;
}, z.core.$strip>;
export declare const ObservabilityEnvelopeSchema: z.ZodObject<{
    eventType: z.ZodEnum<{
        log: "log";
        metric: "metric";
        span: "span";
    }>;
    eventName: z.ZodString;
    scope: z.ZodObject<{
        tenantId: z.ZodString;
        organizationId: z.ZodString;
        companyId: z.ZodString;
        ruc: z.ZodString;
    }, z.core.$strip>;
    redaction: z.ZodObject<{
        status: z.ZodEnum<{
            "not-required": "not-required";
            redacted: "redacted";
        }>;
        evidence: z.ZodArray<z.ZodObject<{
            fieldPath: z.ZodString;
            strategy: z.ZodEnum<{
                hash: "hash";
                mask: "mask";
                drop: "drop";
            }>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    classification: z.ZodObject<{
        containsPii: z.ZodBoolean;
        containsFiscalDocument: z.ZodBoolean;
    }, z.core.$strip>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export type ObservabilityEnvelope = z.infer<typeof ObservabilityEnvelopeSchema>;
export type ObservabilityRejectReasonCode = "MISSING_SCOPE" | "INVALID_OBSERVABILITY_PAYLOAD" | "UNREDACTED_PII" | "UNREDACTED_FISCAL_DOCUMENT" | "REDACTION_EVIDENCE_MISSING";
export type ObservabilityValidationResult = {
    accepted: true;
    value: ObservabilityEnvelope;
} | {
    accepted: false;
    reasonCode: ObservabilityRejectReasonCode;
};
export declare const validateObservabilityEnvelope: (candidate: unknown) => ObservabilityValidationResult;
//# sourceMappingURL=observability-contracts.d.ts.map