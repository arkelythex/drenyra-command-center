import { createInMemoryTraceEvidenceStore } from "@drenyra/ai";
import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { createAiControlPlaneModule } from "../../index";

const createTestApp = () =>
	new Elysia().use(
		createAiControlPlaneModule({
			approvalStore: new Map(),
			traceEvidenceStore: createInMemoryTraceEvidenceStore(),
		}),
	);

describe("ai-control-plane policy preview routes", () => {
	it("fails closed when tenant/company/RUC scope is missing", async () => {
		const app = createTestApp();

		const response = await app.handle(
			new Request("http://localhost/api/ai-control-plane/policy/preview", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					traceId: "trace-missing-scope",
					agentId: "agent-reconciliation",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "ledger.read",
				}),
			}),
		);

		expect(response.status).toBe(400);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "VALIDATION_ERROR",
		});
	});

	it("returns deterministic-required escalation when capability is blocked", async () => {
		const app = createTestApp();

		const response = await app.handle(
			new Request("http://localhost/api/ai-control-plane/policy/preview", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					traceId: "trace-capability-blocked",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.route",
					requestedTool: "ledger.read",
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				allowed: false,
				fallbackMode: "deterministic-required",
				canHandoffToDeterministic: false,
				violations: expect.arrayContaining(["capability-not-allowed"]),
			},
		});
	});

	it("blocks unlisted tools and exposes least-privilege capability tool lookup", async () => {
		const app = createTestApp();

		const blockedToolResponse = await app.handle(
			new Request("http://localhost/api/ai-control-plane/policy/preview", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					traceId: "trace-tool-blocked",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "journal.post",
				}),
			}),
		);

		expect(blockedToolResponse.status).toBe(200);
		const blockedPayload = await blockedToolResponse.json();
		expect(blockedPayload).toMatchObject({
			success: true,
			data: {
				allowed: false,
				violations: expect.arrayContaining(["tool-not-allowed"]),
			},
		});

		const toolsResponse = await app.handle(
			new Request("http://localhost/api/ai-control-plane/capabilities/tools", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					agentId: "agent-reconciliation",
					requestedCapability: "advisory.review",
				}),
			}),
		);

		expect(toolsResponse.status).toBe(200);
		const toolsPayload = await toolsResponse.json();
		expect(toolsPayload).toMatchObject({
			success: true,
			data: {
				allowedTools: ["ledger.read", "sunat.lookup"],
			},
		});
	});
});

describe("ai-control-plane approval orchestration routes", () => {
	it("requires explicit approval before deterministic handoff on material actions", async () => {
		const app = createTestApp();

		const requestResponse = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/request", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-material-1",
					traceId: "trace-material-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "ledger.read",
					isMaterialAction: true,
				}),
			}),
		);

		expect(requestResponse.status).toBe(200);
		const requestPayload = await requestResponse.json();
		expect(requestPayload).toMatchObject({
			success: true,
			data: {
				approvalId: "approval-material-1",
				state: "proposed",
				requiresHumanApproval: true,
				canHandoffToDeterministic: false,
				authoritativeMutationAllowed: false,
			},
		});

		const applyWithoutApproval = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/apply", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-material-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					reviewerId: "reviewer-1",
					reviewerRole: "financial-controller",
					authorizedForSensitiveApproval: true,
				}),
			}),
		);

		expect(applyWithoutApproval.status).toBe(403);
		const applyPayload = await applyWithoutApproval.json();
		expect(applyPayload).toMatchObject({
			success: false,
			code: "APPROVAL_REQUIRED",
		});

		const approveResponse = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/approve", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-material-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					reviewerId: "reviewer-1",
					reviewerRole: "financial-controller",
					authorizedForSensitiveApproval: true,
				}),
			}),
		);

		expect(approveResponse.status).toBe(200);
		const approvePayload = await approveResponse.json();
		expect(approvePayload).toMatchObject({
			success: true,
			data: {
				approvalId: "approval-material-1",
				state: "approved",
				canHandoffToDeterministic: true,
			},
		});

		const applyAfterApproval = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/apply", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-material-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(applyAfterApproval.status).toBe(200);
		const applyApprovedPayload = await applyAfterApproval.json();
		expect(applyApprovedPayload).toMatchObject({
			success: true,
			data: {
				approvalId: "approval-material-1",
				deterministicCommandReady: true,
				handoffMode: "deterministic-command",
				executeModelOutputAsTruth: false,
				authoritativeMutationAllowed: false,
			},
		});
	});

	it("rejects approval when reviewer identity or authorization is missing/invalid", async () => {
		const app = createTestApp();

		await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/request", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-material-authz-1",
					traceId: "trace-material-authz-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "ledger.read",
					isMaterialAction: true,
				}),
			}),
		);

		const missingIdentity = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/approve", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-material-authz-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(missingIdentity.status).toBe(400);
		expect(await missingIdentity.json()).toMatchObject({
			success: false,
			code: "VALIDATION_ERROR",
		});

		const wrongRole = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/approve", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-material-authz-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					reviewerId: "reviewer-2",
					reviewerRole: "supervisor",
					authorizedForSensitiveApproval: true,
				}),
			}),
		);

		expect(wrongRole.status).toBe(403);
		expect(await wrongRole.json()).toMatchObject({
			success: false,
			code: "REVIEWER_UNAUTHORIZED",
		});
	});

	it("records provider failure audit and keeps approval state unchanged", async () => {
		const app = createTestApp();

		await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/request", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-provider-failure-1",
					traceId: "trace-provider-failure-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "ledger.read",
					isMaterialAction: true,
				}),
			}),
		);

		await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/approve", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-provider-failure-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					reviewerId: "reviewer-1",
					reviewerRole: "financial-controller",
					authorizedForSensitiveApproval: true,
				}),
			}),
		);

		const failedApply = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/apply", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-drenyra-simulate-provider-failure": "true",
				},
				body: JSON.stringify({
					approvalId: "approval-provider-failure-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(failedApply.status).toBe(502);
		expect(await failedApply.json()).toMatchObject({
			success: false,
			code: "PROVIDER_FAILURE",
		});

		const traceResponse = await app.handle(
			new Request("http://localhost/api/ai-control-plane/trace/retrieve", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					traceId: "trace-provider-failure-1",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(traceResponse.status).toBe(200);
		expect(await traceResponse.json()).toMatchObject({
			success: true,
			data: {
				approvalLineage: {
					approvalId: "approval-provider-failure-1",
					approvalStatus: "approved",
				},
				auditTrail: expect.arrayContaining([
					expect.objectContaining({
						eventType: "provider.apply.failed",
						status: "failure",
						reasonCode: "PROVIDER_FAILURE",
					}),
				]),
			},
		});
	});

	it("keeps non-material advisory actions approved-by-policy but still non-authoritative", async () => {
		const app = createTestApp();

		const requestResponse = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/request", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-advisory-1",
					traceId: "trace-advisory-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "ledger.read",
					isMaterialAction: false,
				}),
			}),
		);

		expect(requestResponse.status).toBe(200);
		const requestPayload = await requestResponse.json();
		expect(requestPayload).toMatchObject({
			success: true,
			data: {
				approvalId: "approval-advisory-1",
				state: "approved",
				requiresHumanApproval: false,
				canHandoffToDeterministic: true,
				authoritativeMutationAllowed: false,
			},
		});
	});

	it("fails closed for blocked policy and supports reject/escalate transitions", async () => {
		const app = createTestApp();

		const blockedRequest = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/request", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-blocked-1",
					traceId: "trace-blocked-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "journal.post",
					isMaterialAction: true,
				}),
			}),
		);

		expect(blockedRequest.status).toBe(403);
		const blockedPayload = await blockedRequest.json();
		expect(blockedPayload).toMatchObject({
			success: false,
			code: "POLICY_BLOCKED",
		});

		await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/request", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-material-2",
					traceId: "trace-material-2",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "ledger.read",
					isMaterialAction: true,
				}),
			}),
		);

		const escalateResponse = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/escalate", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-material-2",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(escalateResponse.status).toBe(200);
		const escalatePayload = await escalateResponse.json();
		expect(escalatePayload).toMatchObject({
			success: true,
			data: {
				approvalId: "approval-material-2",
				state: "validated",
				reviewerRole: "financial-controller",
			},
		});

		const rejectResponse = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/reject", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-material-2",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(rejectResponse.status).toBe(200);
		const rejectPayload = await rejectResponse.json();
		expect(rejectPayload).toMatchObject({
			success: true,
			data: {
				approvalId: "approval-material-2",
				state: "rejected",
				canHandoffToDeterministic: false,
			},
		});

		const applyRejected = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/apply", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-material-2",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(applyRejected.status).toBe(403);
		const applyRejectedPayload = await applyRejected.json();
		expect(applyRejectedPayload).toMatchObject({
			success: false,
			code: "APPROVAL_REJECTED",
		});
	});

	it("fails closed when apply scope mismatches and never returns deterministic readiness", async () => {
		const app = createTestApp();

		await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/request", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-scope-mismatch-1",
					traceId: "trace-scope-mismatch-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "ledger.read",
					isMaterialAction: true,
				}),
			}),
		);

		const scopeMismatchApply = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/apply", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-scope-mismatch-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20999999999",
				}),
			}),
		);

		expect(scopeMismatchApply.status).toBe(404);
		const scopeMismatchPayload = await scopeMismatchApply.json();
		expect(scopeMismatchPayload).toMatchObject({
			success: false,
			code: "APPROVAL_NOT_FOUND",
		});
	});

	it("retrieves redacted trace bundles only for matching tenant/company/RUC scope", async () => {
		const app = createTestApp();

		await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/request", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-trace-1",
					traceId: "trace-retrieval-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "ledger.read",
					isMaterialAction: true,
				}),
			}),
		);

		const okResponse = await app.handle(
			new Request("http://localhost/api/ai-control-plane/trace/retrieve", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					traceId: "trace-retrieval-1",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(okResponse.status).toBe(200);
		const okPayload = await okResponse.json();
		expect(okPayload).toMatchObject({
			success: true,
			data: {
				traceId: "trace-retrieval-1",
				redactionStatus: "redacted",
				approvalLineage: {
					approvalId: "approval-trace-1",
					approvalStatus: "proposed",
					decision: "pending",
				},
				tenantScope: {
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				},
			},
		});

		await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/approve", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-trace-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					reviewerId: "reviewer-1",
					reviewerRole: "financial-controller",
					authorizedForSensitiveApproval: true,
				}),
			}),
		);

		const approvedTrace = await app.handle(
			new Request("http://localhost/api/ai-control-plane/trace/retrieve", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					traceId: "trace-retrieval-1",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(approvedTrace.status).toBe(200);
		const approvedTracePayload = await approvedTrace.json();
		expect(approvedTracePayload).toMatchObject({
			success: true,
			data: {
				approvalLineage: {
					approvalId: "approval-trace-1",
					approvalStatus: "approved",
					decision: "approved",
				},
			},
		});

		const mismatchResponse = await app.handle(
			new Request("http://localhost/api/ai-control-plane/trace/retrieve", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					traceId: "trace-retrieval-1",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20999999999",
				}),
			}),
		);

		expect(mismatchResponse.status).toBe(404);
		const mismatchPayload = await mismatchResponse.json();
		expect(mismatchPayload).toMatchObject({
			success: false,
			code: "TRACE_NOT_FOUND",
		});
	});

	it("returns rejected lineage in trace retrieval while keeping apply fail-closed", async () => {
		const app = createTestApp();

		await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/request", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-trace-rejected-1",
					traceId: "trace-retrieval-rejected-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "ledger.read",
					isMaterialAction: true,
				}),
			}),
		);

		await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/reject", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-trace-rejected-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		const traceResponse = await app.handle(
			new Request("http://localhost/api/ai-control-plane/trace/retrieve", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					traceId: "trace-retrieval-rejected-1",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(traceResponse.status).toBe(200);
		const tracePayload = await traceResponse.json();
		expect(tracePayload).toMatchObject({
			success: true,
			data: {
				approvalLineage: {
					approvalId: "approval-trace-rejected-1",
					approvalStatus: "rejected",
					decision: "rejected",
				},
			},
		});

		const applyRejected = await app.handle(
			new Request("http://localhost/api/ai-control-plane/approval/apply", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-trace-rejected-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(applyRejected.status).toBe(403);
		const applyRejectedPayload = await applyRejected.json();
		expect(applyRejectedPayload).toMatchObject({
			success: false,
			code: "APPROVAL_REJECTED",
		});
	});
});

describe("ai-control-plane injected store isolation", () => {
	it("does not share approvals or traces across module instances", async () => {
		const appA = createTestApp();
		const appB = createTestApp();

		const requestResponse = await appA.handle(
			new Request("http://localhost/api/ai-control-plane/approval/request", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-isolated-1",
					traceId: "trace-isolated-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
					requestedCapability: "advisory.review",
					requestedTool: "ledger.read",
					isMaterialAction: true,
				}),
			}),
		);

		expect(requestResponse.status).toBe(200);

		const appBApplyResponse = await appB.handle(
			new Request("http://localhost/api/ai-control-plane/approval/apply", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					approvalId: "approval-isolated-1",
					agentId: "agent-reconciliation",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(appBApplyResponse.status).toBe(404);
		await expect(appBApplyResponse.json()).resolves.toMatchObject({
			success: false,
			code: "APPROVAL_NOT_FOUND",
		});

		const appBTraceResponse = await appB.handle(
			new Request("http://localhost/api/ai-control-plane/trace/retrieve", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					traceId: "trace-isolated-1",
					tenantId: "tenant-1",
					organizationId: "org-1",
					companyId: "company-1",
					ruc: "20123456789",
				}),
			}),
		);

		expect(appBTraceResponse.status).toBe(404);
		await expect(appBTraceResponse.json()).resolves.toMatchObject({
			success: false,
			code: "TRACE_NOT_FOUND",
		});
	});
});
