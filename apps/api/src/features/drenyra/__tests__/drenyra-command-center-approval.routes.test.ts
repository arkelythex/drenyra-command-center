import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	DecideApprovalInput,
	DrenyraActorContext,
	DrenyraFiscalCommandCenterService,
} from "@arkelythex/application/drenyra";
import type { ApprovalRequest } from "@arkelythex/domain/drenyra";
import { createDrenyraCommandCenterApprovalRoutes } from "../command-center-approval.routes";

const fiscalContext: DrenyraActorContext = {
	companyId: "company-approval",
	companyRuc: "20601234567",
	organizationId: "org-approval",
	period: "2026-05",
	userId: "reviewer-1",
};

const approveApprovalRequest = vi.fn<
	(context: DrenyraActorContext, approvalId: string, input: DecideApprovalInput) => Promise<ApprovalRequest>
>();
const rejectApprovalRequest = vi.fn<
	(context: DrenyraActorContext, approvalId: string, input: DecideApprovalInput) => Promise<ApprovalRequest>
>();

function approval(overrides: Partial<ApprovalRequest> = {}): ApprovalRequest {
	return {
		id: "approval-1",
		caseId: "case-1",
		scope: {
			companyId: fiscalContext.companyId,
			companyRuc: fiscalContext.companyRuc,
			countryCode: "PE",
			organizationId: fiscalContext.organizationId,
			period: fiscalContext.period,
		},
		status: "APPROVED",
		title: "Approve fiscal action",
		description: "Fiscal action needs review",
		autonomyLevel: "PREPARE_WITH_APPROVAL",
		requestedBy: "agent-1",
		requestedAt: "2026-05-27T00:00:00.000Z",
		decidedBy: fiscalContext.userId,
		decidedAt: "2026-05-27T00:01:00.000Z",
		decisionReason: "Scoped approval",
		diff: { before: {}, after: {}, summary: "Approve proposal" },
		metadata: {},
		...overrides,
	};
}

function createApp(contextOk = true) {
	const commandCenter = {
		approveApprovalRequest,
		rejectApprovalRequest,
	} as unknown as DrenyraFiscalCommandCenterService;
	return new Elysia().use(
		createDrenyraCommandCenterApprovalRoutes(commandCenter, () =>
			contextOk ? { ok: true, context: fiscalContext } : { ok: false, missingHeaders: ["x-company-ruc"] },
		),
	);
}

async function postDecision(path: string, body: DecideApprovalInput = {}, contextOk = true): Promise<Response> {
	return createApp(contextOk).handle(
		new Request(`http://localhost${path}`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
}

describe("Drenyra command-center approval routes", () => {
	beforeEach(() => {
		approveApprovalRequest.mockReset();
		rejectApprovalRequest.mockReset();
	});

	it("approves with trusted fiscal context and decision reason", async () => {
		approveApprovalRequest.mockResolvedValueOnce(approval());

		const response = await postDecision("/approvals/approval-1/approve", {
			decisionReason: "Reviewed evidence",
		});
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(approveApprovalRequest).toHaveBeenCalledWith(fiscalContext, "approval-1", {
			decisionReason: "Reviewed evidence",
		});
		expect(payload.success).toBe(true);
		expect(payload.data.status).toBe("APPROVED");
	});

	it("rejects without calling the service when fiscal scope is missing", async () => {
		const response = await postDecision("/approvals/approval-1/reject", {}, false);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(rejectApprovalRequest).not.toHaveBeenCalled();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("TENANT_CONTEXT_REQUIRED");
		expect(payload.details.missingHeaders).toEqual(["x-company-ruc"]);
	});

	it("maps already-decided approval errors to conflict envelopes", async () => {
		approveApprovalRequest.mockRejectedValueOnce(new Error("APPROVAL_ALREADY_DECIDED"));

		const response = await postDecision("/approvals/approval-1/approve");
		const payload = await response.json();

		expect(response.status).toBe(409);
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("CONFLICT");
	});

	it("maps missing approval reject errors to not-found envelopes", async () => {
		rejectApprovalRequest.mockRejectedValueOnce(new Error("APPROVAL_REQUEST_NOT_FOUND"));

		const response = await postDecision("/approvals/missing/reject", {
			decisionReason: "Out of scope",
		});
		const payload = await response.json();

		expect(response.status).toBe(404);
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("NOT_FOUND");
	});
});
