import type { AgentContext,
	ApprovalRequest, } from "@drenyra/pi";
import { ApprovalGateEngine,
	ApprovalStore, } from "@drenyra/pi";
import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { resolveAgentContextFromHeaders } from "../drenyra.routes";

function headers(companyId: string, userId: string, role = "ADMIN") {
	return {
		"content-type": "application/json",
		"x-company-id": companyId,
		"x-company-ruc": "20123456786",
		"x-fiscal-period": "2026-05",
		"x-user-id": userId,
		"x-user-role": role,
	};
}

function makeApprovalRequest(id: string, companyId: string): ApprovalRequest {
	return {
		id,
		toolName: "test_tool",
		input: { message: `test for ${companyId}` },
		context: {
			tenantId: companyId,
			userId: `creator-${companyId}`,
			organizationId: companyId,
			companyId,
			ruc: "20123456786",
			traceId: `trace-${id}`,
		} as AgentContext,
		approvalLevel: "gate",
		state: "proposed",
		proposedAt: new Date(),
	};
}

function approvalMatchesContext(
	approval: ApprovalRequest,
	context: { tenantId: string; companyId: string },
): boolean {
	return (
		approval.context.tenantId === context.tenantId &&
		approval.context.companyId === context.companyId
	);
}

function approvalNotFound() {
	return {
		ok: false as const,
		error: "Approval request not found",
		code: "NOT_FOUND",
	};
}

describe("Drenyra approval decision tenant guards", () => {
	const store = new ApprovalStore();
	const gate = new ApprovalGateEngine(store);

	function createTestApp() {
		return new Elysia({ prefix: "/api/drenyra" })
			.post("/approve", async ({ body, headers: reqHeaders, set }) => {
				const contextResolution = resolveAgentContextFromHeaders(reqHeaders);
				if (!contextResolution.ok) {
					set.status = 400;
					return {
						ok: false,
						error: contextResolution.error,
						code: contextResolution.code,
						details: contextResolution.details,
					};
				}

				const reviewerRole = reqHeaders["x-user-role"]?.trim() ?? null;
				if (!reviewerRole) {
					set.status = 400;
					return {
						ok: false,
						error: "Drenyra approval decisions require x-user-role",
						code: "TENANT_CONTEXT_REQUIRED",
						details: { missingHeaders: ["x-user-role"] },
					};
				}

				const b = body as { approvalId: string };
				const approval = store.get(b.approvalId);
				if (
					!approval ||
					!approvalMatchesContext(approval, contextResolution.context)
				) {
					set.status = 404;
					return approvalNotFound();
				}

				const result = await gate.approve(
					b.approvalId,
					contextResolution.context.userId,
					reviewerRole,
				);
				return result;
			})
			.post("/reject", async ({ body, headers: reqHeaders, set }) => {
				const contextResolution = resolveAgentContextFromHeaders(reqHeaders);
				if (!contextResolution.ok) {
					set.status = 400;
					return {
						ok: false,
						error: contextResolution.error,
						code: contextResolution.code,
						details: contextResolution.details,
					};
				}

				const b = body as { approvalId: string; rationale?: string };
				const approval = store.get(b.approvalId);
				if (
					!approval ||
					!approvalMatchesContext(approval, contextResolution.context)
				) {
					set.status = 404;
					return approvalNotFound();
				}

				const result = await gate.reject(
					b.approvalId,
					contextResolution.context.userId,
					b.rationale,
				);
				return result;
			});
	}

	async function postJson(
		path: string,
		body: unknown,
		requestHeaders: Record<string, string>,
	): Promise<Response> {
		const app = createTestApp();
		return app.handle(
			new Request(`http://localhost${path}`, {
				method: "POST",
				headers: requestHeaders,
				body: JSON.stringify(body),
			}),
		);
	}

	it("does not allow another tenant to approve a pending approval by ID", async () => {
		const approvalId = "approval-guard-a-001";
		store.save(makeApprovalRequest(approvalId, "cmp-guard-a"));

		const response = await postJson(
			"/api/drenyra/approve",
			{ approvalId, reviewerId: "attacker", role: "OWNER" },
			headers("cmp-guard-b", "attacker", "OWNER"),
		);
		const payload = await response.json();

		expect(response.status).toBe(404);
		expect(payload.ok).toBe(false);
		expect(payload.code).toBe("NOT_FOUND");
	});

	it("derives approval reviewer identity from headers instead of body fields", async () => {
		const approvalId = "approval-guard-c-001";
		store.save(makeApprovalRequest(approvalId, "cmp-guard-c"));

		const response = await postJson(
			"/api/drenyra/approve",
			{ approvalId, reviewerId: "spoofed-user", role: "OWNER" },
			headers("cmp-guard-c", "trusted-reviewer", "ADMIN"),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.reviewerId).toBe("trusted-reviewer");
		expect(payload.data.reviewerRole).toBe("ADMIN");
		expect(payload.data.reviewerId).not.toBe("spoofed-user");
	});

	it("does not allow another tenant to reject a pending approval by ID", async () => {
		const approvalId = "approval-guard-d-001";
		store.save(makeApprovalRequest(approvalId, "cmp-guard-d"));

		const response = await postJson(
			"/api/drenyra/reject",
			{ approvalId, reviewerId: "attacker", rationale: "cross tenant" },
			headers("cmp-guard-e", "attacker", "OWNER"),
		);
		const payload = await response.json();

		expect(response.status).toBe(404);
		expect(payload.ok).toBe(false);
		expect(payload.code).toBe("NOT_FOUND");
	});
});
