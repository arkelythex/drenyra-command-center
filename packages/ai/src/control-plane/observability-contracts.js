import { z } from "zod";
import { TenantCompanyRucScopeSchema } from "./contracts";
const nonEmpty = z.string().min(1);
export const ObservabilityEventTypeSchema = z.enum(["log", "metric", "span"]);
export const RedactionEvidenceSchema = z.object({
    fieldPath: nonEmpty,
    strategy: z.enum(["mask", "hash", "drop"]),
});
export const ObservabilityEnvelopeSchema = z.object({
    eventType: ObservabilityEventTypeSchema,
    eventName: nonEmpty,
    scope: TenantCompanyRucScopeSchema,
    redaction: z.object({
        status: z.enum(["redacted", "not-required"]),
        evidence: z.array(RedactionEvidenceSchema),
    }),
    classification: z.object({
        containsPii: z.boolean(),
        containsFiscalDocument: z.boolean(),
    }),
    payload: z.record(z.string(), z.unknown()),
});
const hasScopePathIssue = (issues) => {
    return issues.some((issue) => issue.path[0] === "scope");
};
export const validateObservabilityEnvelope = (candidate) => {
    const parsed = ObservabilityEnvelopeSchema.safeParse(candidate);
    if (!parsed.success) {
        if (hasScopePathIssue(parsed.error.issues)) {
            return { accepted: false, reasonCode: "MISSING_SCOPE" };
        }
        return { accepted: false, reasonCode: "INVALID_OBSERVABILITY_PAYLOAD" };
    }
    const envelope = parsed.data;
    if (envelope.classification.containsFiscalDocument &&
        envelope.redaction.status !== "redacted") {
        return { accepted: false, reasonCode: "UNREDACTED_FISCAL_DOCUMENT" };
    }
    if (envelope.classification.containsPii &&
        envelope.redaction.status !== "redacted") {
        return { accepted: false, reasonCode: "UNREDACTED_PII" };
    }
    if ((envelope.classification.containsPii ||
        envelope.classification.containsFiscalDocument) &&
        envelope.redaction.evidence.length === 0) {
        return { accepted: false, reasonCode: "REDACTION_EVIDENCE_MISSING" };
    }
    return { accepted: true, value: envelope };
};
//# sourceMappingURL=observability-contracts.js.map