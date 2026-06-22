import {
	CONTEXT_APPROVAL_STATES,
	CONTEXT_EVALUATION_STATES,
	CONTEXT_RETRIEVAL_MODES,
} from "@arkelythex/application";
import { describe, expect, it } from "vitest";
import {
	buildContextAuditEnvelope,
	buildContextEvaluationTraceRecord,
	buildContextPolicyTraceRecord,
} from "../../context-control-plane/context-observability";

describe("context observability foundation", () => {
	it("builds canonical policy trace records", () => {
		const record = buildContextPolicyTraceRecord({
			request: {
				surfaceId: "validate-cpe",
				tenantId: "tenant-1",
				requestedTools: ["sunat-rule-pack", "sunat-rule-pack"],
				requestedCorpora: ["sunat-cpe-specs"],
			},
			response: {
				traceId: "trace-1",
				surfaceId: "validate-cpe",
				tenantScope: "organization",
				allowed: true,
				retrievalMode: CONTEXT_RETRIEVAL_MODES.HYBRID_DOCUMENTARY,
				approvalState: CONTEXT_APPROVAL_STATES.NOT_REQUIRED,
				allowedTools: ["sunat-rule-pack"],
				allowedCorpora: ["sunat-cpe-specs"],
				contextWindow: {
					maxMemoryItems: 8,
					maxDocumentResults: 3,
					maxToolCalls: 4,
				},
				deterministicFallback: {
					strategyId: "validate-cpe-deterministic",
					description: "Fallback",
					owner: "apps/api/src/lib/accounting-jobs.ts",
					evidenceSource: "accounting-job-catalog",
				},
				violations: [],
			},
			runId: "run-1",
			organizationId: 77,
		});

		expect(record.attributes.traceId).toBe("trace-1");
		expect(record.attributes.runId).toBe("run-1");
		expect(record.attributes.requestedTools).toEqual(["sunat-rule-pack"]);
		expect(record.piiRedacted).toBe(true);
	});

	it("builds canonical evaluation trace records and sanitized audit envelopes", () => {
		const record = buildContextEvaluationTraceRecord({
			traceId: "trace-2",
			runId: "run-2",
			surfaceId: "prepare-sire",
			tenantId: "tenant-2",
			organizationId: 88,
			evaluationSummary: {
				state: CONTEXT_EVALUATION_STATES.YELLOW,
				generatedAt: "2026-04-01T12:00:00.000Z",
				metrics: [
					{
						metric: "approval-latency",
						value: 2,
						window: "24h",
						target: 1,
						blocker: 5,
						unit: "count",
					},
				],
				notes: ["Investigate manual approvals"],
			},
		});

		const envelope = buildContextAuditEnvelope(record, {
			decisionReason: "Contains ruc 20123456789",
			ruc: "20123456789",
		});

		expect(record.attributes.evaluationState).toBe(
			CONTEXT_EVALUATION_STATES.YELLOW,
		);
		expect(envelope.inputs.traceId).toBe("trace-2");
		expect(envelope.outputs.payloadPreview).toEqual({
			decisionReason: "Contains ruc 20123456789",
			ruc: "[REDACTED]",
		});
		expect(typeof envelope.outputs.payloadHash).toBe("string");
		expect(envelope.piiRedacted).toBe(true);
	});
});
