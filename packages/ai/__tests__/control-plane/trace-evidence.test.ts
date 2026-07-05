import { describe, expect, it } from "vitest";
import {
	createAppendOnlyTraceEvidenceStore,
	createInMemoryTraceEvidenceStore,
	EvidenceTraceBundleSchema,
} from "../../src/control-plane/trace-evidence";

describe("trace/evidence contracts and retrieval", () => {
	it("represents explicit approval lineage states in trace bundles", () => {
		const pending = EvidenceTraceBundleSchema.safeParse({
			traceId: "trace-with-pending-lineage",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
			redactionStatus: "redacted",
			toolCalls: ["ledger.read"],
			rationale: "advisory reasoning",
			evidence: [
				{
					sourceRef: "source://summary",
					hash: "hash-1",
					scope: "ledger-entry",
					isRedacted: true,
				},
			],
			approvalLineage: {
				approvalId: "approval-1",
				approvalStatus: "proposed",
				decision: "pending",
			},
		});

		expect(pending.success).toBe(true);

		const rejected = EvidenceTraceBundleSchema.safeParse({
			traceId: "trace-with-rejected-lineage",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
			redactionStatus: "redacted",
			toolCalls: ["ledger.read"],
			rationale: "advisory reasoning",
			evidence: [
				{
					sourceRef: "source://summary",
					hash: "hash-2",
					scope: "policy-artifact",
					isRedacted: true,
				},
			],
			approvalLineage: {
				approvalId: "approval-2",
				approvalStatus: "rejected",
				decision: "rejected",
			},
		});

		expect(rejected.success).toBe(true);
	});

	it("requires redaction status and rejects raw document evidence", () => {
		const parsed = EvidenceTraceBundleSchema.safeParse({
			traceId: "trace-1",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
			redactionStatus: "none",
			toolCalls: [],
			rationale: "reason",
			evidence: [
				{
					sourceRef: "doc://invoice-001",
					hash: "hash-1",
					scope: "fiscal-document",
					isRedacted: false,
				},
			],
		});

		expect(parsed.success).toBe(false);
	});

	it("fails closed when scope mismatches or trace is missing", () => {
		const store = createInMemoryTraceEvidenceStore();
		store.save({
			traceId: "trace-1",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
			redactionStatus: "redacted",
			toolCalls: ["ledger.read"],
			rationale: "advisory reasoning",
			evidence: [
				{
					sourceRef: "source://summary",
					hash: "hash-1",
					scope: "ledger-entry",
					isRedacted: true,
				},
			],
		});

		const mismatch = store.getScoped({
			traceId: "trace-1",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20999999999",
			},
		});

		expect(mismatch.found).toBe(false);
		expect(mismatch.reason).toBe("scope-mismatch");

		const missing = store.getScoped({
			traceId: "trace-missing",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
		});

		expect(missing.found).toBe(false);
		expect(missing.reason).toBe("not-found");
	});

	it("rejects lineage payloads that include unredacted fiscal-document references", () => {
		const parsed = EvidenceTraceBundleSchema.safeParse({
			traceId: "trace-lineage-unredacted",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
			redactionStatus: "redacted",
			toolCalls: ["ledger.read"],
			rationale: "advisory reasoning",
			evidence: [
				{
					sourceRef: "source://summary",
					hash: "hash-3",
					scope: "policy-artifact",
					isRedacted: true,
				},
			],
			approvalLineage: {
				approvalId: "approval-3",
				approvalStatus: "approved",
				decision: "approved",
				decisionEvidenceRef: "doc://invoice-unsafe",
				decisionEvidenceRedacted: false,
			},
		});

		expect(parsed.success).toBe(false);
	});

	it("persists append-only trace evidence beyond process memory", () => {
		const filePath = `/tmp/opencode/trace-evidence-${Date.now()}.ndjson`;
		const firstStore = createAppendOnlyTraceEvidenceStore({ filePath });

		firstStore.save({
			traceId: "trace-durable-1",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
			redactionStatus: "redacted",
			toolCalls: ["ledger.read"],
			rationale: "durable advisory trace",
			evidence: [
				{
					sourceRef: "source://durable",
					hash: "hash-durable-1",
					scope: "policy-artifact",
					isRedacted: true,
				},
			],
			auditTrail: [
				{
					eventType: "approval.requested",
					status: "success",
					recordedAt: "2026-01-01T00:00:00.000Z",
					actorId: "system",
					actorRole: "financial-controller",
					reasonCode: "APPROVAL_REQUIRED",
				},
			],
		});

		const secondStore = createAppendOnlyTraceEvidenceStore({ filePath });
		const lookup = secondStore.getScoped({
			traceId: "trace-durable-1",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
		});

		expect(lookup.found).toBe(true);
		if (lookup.found) {
			expect(lookup.bundle.auditTrail).toHaveLength(1);
			expect(lookup.bundle.auditTrail?.[0]?.eventType).toBe(
				"approval.requested",
			);
		}
	});
});
