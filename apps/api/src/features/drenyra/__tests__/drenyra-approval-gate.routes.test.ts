import type { AgentContext, ApprovalRequest } from "@drenyra/pi";
import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { createApprovalGateRoutes } from "../approval-gate.routes";

const baseContext: AgentContext = {
	tenantId: "company-gate-001",
	organizationId: "company-gate-001",
	companyId: "company-gate-001",
	userId: "creator-gate-001",
	ruc: "20123456789",
	traceId: "trace-gate-001",
};

function approval(overrides: Partial<ApprovalRequest> = {}): ApprovalRequest {
	return {
		id: "approval-gate-001",
		toolName: "invoice_create",
		input: { documentId: "doc-1" },
		context: baseContext,
		approvalLevel: "gate",
		state: "proposed",
		proposedAt: new Date("2026-05-26T10:00:00.000Z"),
		governanceResult: {
			valid: false,
			reasons: ["Needs approval"],
			evidenceRefs: ["ev-1"],
		},
		...overrides,
	};
}

function headers(userId = "reviewer-gate-001", role = "ADMIN") {
	return {
		"content-type": "application/json",
		"x-company-id": baseContext.companyId,
		"x-user-id": userId,
		"x-user-role": role,
	};
}

function createTestApp(seed = approval()) {
	const store = new Map<string, ApprovalRequest>([[seed.id, seed]]);
	return new Elysia({ prefix: "/api/drenyra" }).use(
		createApprovalGateRoutes({
			approvalStore: {
				get(id) {
					return store.get(id);
				},
				listByContext(context) {
					return [...store.values()].filter(
						(item) =>
							item.context.tenantId === context.tenantId &&
							item.context.companyId === context.companyId,
					);
				},
			},
			approvalGate: {
				async approve(approvalId, reviewerId, reviewerRole) {
					const item = store.get(approvalId);
					if (!item)
						return { ok: false, error: "not found", code: "NOT_FOUND" };
					item.state = "approved";
					item.reviewerId = reviewerId;
					item.reviewerRole = reviewerRole;
					return { ok: true, data: item };
				},
				async reject(approvalId, reviewerId, rationale) {
					const item = store.get(approvalId);
					if (!item)
						return { ok: false, error: "not found", code: "NOT_FOUND" };
					item.state = "rejected";
					item.reviewerId = reviewerId;
					item.rationale = rationale;
					return { ok: true, data: item };
				},
			},
		}),
	);
}

describe("Drenyra approval gate routes", () => {
	it("lists approvals scoped to request tenant context", async () => {
		const response = await createTestApp().handle(
			new Request("http://localhost/api/drenyra/approvals", {
				headers: headers(),
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.approvals).toHaveLength(1);
		expect(payload.approvals[0]).toMatchObject({
			id: "approval-gate-001",
			module: "invoice",
			summary: "Needs approval",
			companyId: baseContext.companyId,
			ruc: baseContext.ruc,
		});
	});

	it("requires reviewer role for approve decisions", async () => {
		const response = await createTestApp().handle(
			new Request("http://localhost/api/drenyra/approve", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-company-id": baseContext.companyId,
					"x-user-id": "reviewer-gate-001",
				},
				body: JSON.stringify({
					approvalId: "approval-gate-001",
					reviewerId: "body-reviewer",
					role: "ADMIN",
				}),
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.code).toBe("TENANT_CONTEXT_REQUIRED");
		expect(payload.details.missingHeaders).toContain("x-user-role");
	});

	it("uses trusted header identity when approving", async () => {
		const response = await createTestApp().handle(
			new Request("http://localhost/api/drenyra/approve", {
				method: "POST",
				headers: headers("trusted-reviewer", "OWNER"),
				body: JSON.stringify({
					approvalId: "approval-gate-001",
					reviewerId: "spoofed-reviewer",
					role: "ADMIN",
				}),
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data.state).toBe("approved");
		expect(payload.data.reviewerId).toBe("trusted-reviewer");
		expect(payload.data.reviewerRole).toBe("OWNER");
	});

	it("uses trusted header identity when rejecting", async () => {
		const response = await createTestApp().handle(
			new Request("http://localhost/api/drenyra/reject", {
				method: "POST",
				headers: headers("reject-reviewer"),
				body: JSON.stringify({
					approvalId: "approval-gate-001",
					reviewerId: "spoofed-reviewer",
					rationale: "missing CDR",
				}),
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data.state).toBe("rejected");
		expect(payload.data.reviewerId).toBe("reject-reviewer");
		expect(payload.data.rationale).toBe("missing CDR");
	});
});
