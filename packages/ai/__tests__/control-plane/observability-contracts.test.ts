import { describe, expect, it } from "vitest";
import {
	ObservabilityEnvelopeSchema,
	validateObservabilityEnvelope,
} from "../../src/control-plane/observability-contracts";

const scopedContext = {
	tenantId: "tenant-1",
	organizationId: "org-1",
	companyId: "company-1",
	ruc: "20123456789",
};

describe("control-plane observability contracts", () => {
	it("requires scoped context for logs/metrics/spans", () => {
		const parsed = ObservabilityEnvelopeSchema.safeParse({
			eventType: "log",
			eventName: "ai.control-plane.request",
			redaction: {
				status: "not-required",
				evidence: [],
			},
			classification: {
				containsPii: false,
				containsFiscalDocument: false,
			},
			payload: { summary: "safe" },
		});

		expect(parsed.success).toBe(false);
	});

	it("fails closed when pii/fiscal payload is unredacted", () => {
		const piiResult = validateObservabilityEnvelope({
			eventType: "log",
			eventName: "ai.control-plane.output",
			scope: scopedContext,
			redaction: {
				status: "not-required",
				evidence: [],
			},
			classification: {
				containsPii: true,
				containsFiscalDocument: false,
			},
			payload: { customerName: "Juan Perez" },
		});

		expect(piiResult.accepted).toBe(false);
		expect(piiResult.reasonCode).toBe("UNREDACTED_PII");

		const fiscalResult = validateObservabilityEnvelope({
			eventType: "span",
			eventName: "ai.control-plane.trace",
			scope: scopedContext,
			redaction: {
				status: "not-required",
				evidence: [],
			},
			classification: {
				containsPii: false,
				containsFiscalDocument: true,
			},
			payload: { documentNumber: "F001-000123" },
		});

		expect(fiscalResult.accepted).toBe(false);
		expect(fiscalResult.reasonCode).toBe("UNREDACTED_FISCAL_DOCUMENT");
	});

	it("requires explicit redaction evidence when sensitive data exists", () => {
		const result = validateObservabilityEnvelope({
			eventType: "metric",
			eventName: "ai.control-plane.redaction-check",
			scope: scopedContext,
			redaction: {
				status: "redacted",
				evidence: [],
			},
			classification: {
				containsPii: true,
				containsFiscalDocument: false,
			},
			payload: { content: "***" },
		});

		expect(result.accepted).toBe(false);
		expect(result.reasonCode).toBe("REDACTION_EVIDENCE_MISSING");
	});

	it("accepts scoped and redacted observability envelopes", () => {
		const result = validateObservabilityEnvelope({
			eventType: "metric",
			eventName: "ai.control-plane.safe-event",
			scope: scopedContext,
			redaction: {
				status: "redacted",
				evidence: [{ fieldPath: "payload.customerName", strategy: "mask" }],
			},
			classification: {
				containsPii: true,
				containsFiscalDocument: false,
			},
			payload: { customerName: "J*** P****" },
		});

		expect(result.accepted).toBe(true);
		if (!result.accepted) {
			throw new Error("expected accepted envelope");
		}
		expect(result.value.scope.ruc).toBe("20123456789");
		expect(result.value.redaction.status).toBe("redacted");
	});
});
