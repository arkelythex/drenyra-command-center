import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { resolveSessionContext } = vi.hoisted(() => ({
	resolveSessionContext: vi.fn(),
}));

vi.mock("../../../security/session-context", () => ({ resolveSessionContext }));

import {
	ReconcileRejectedError,
	ReconciliationService,
} from "../../application/services/reconciliation.service";
import { reconciliationsModule } from "../../index";

const app = new Elysia().use(reconciliationsModule);

function request(path: string, init?: RequestInit) {
	return app.handle(new Request(`http://localhost${path}`, init));
}

function post(path: string, body: unknown) {
	return request(path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("reconciliations tenant scope", () => {
	beforeEach(() => {
		resolveSessionContext.mockResolvedValue({
			ok: true,
			context: {
				userId: "user-1",
				authUserId: "user-1",
				legacyUserId: null,
				role: "admin",
				companyId: "cmp-1",
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it.each([
		"/api/reconciliations/pending?companyId=cmp-2",
		"/api/reconciliations/reconciled?companyId=cmp-2",
		"/api/reconciliations/stats?companyId=cmp-2",
		"/api/reconciliations/tx-1/matches?companyId=cmp-2",
	])("refuses to read another company's bank data: %s", async (path) => {
		const pending = vi.spyOn(ReconciliationService.prototype, "getPending");
		const response = await request(path);

		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({
			success: false,
			code: "COMPANY_SCOPE_MISMATCH",
		});
		expect(pending).not.toHaveBeenCalled();
	});

	it.each([
		"/api/reconciliations/tx-1/reconcile",
		"/api/reconciliations/tx-1/unreconcile",
	])("refuses to change another company's transactions: %s", async (path) => {
		const reconcile = vi.spyOn(ReconciliationService.prototype, "reconcile");
		const unreconcile = vi.spyOn(
			ReconciliationService.prototype,
			"unreconcile",
		);
		const response = await post(path, { companyId: "cmp-2" });

		expect(response.status).toBe(403);
		expect(reconcile).not.toHaveBeenCalled();
		expect(unreconcile).not.toHaveBeenCalled();
	});

	it("serves the session's own company", async () => {
		vi.spyOn(ReconciliationService.prototype, "getPending").mockResolvedValue(
			[],
		);
		const response = await request(
			"/api/reconciliations/pending?companyId=cmp-1",
		);

		expect(response.status).toBe(200);
	});
});

describe("reconcile with a linked document", () => {
	beforeEach(() => {
		resolveSessionContext.mockResolvedValue({
			ok: true,
			context: {
				userId: "user-1",
				authUserId: "user-1",
				legacyUserId: "33333333-3333-4333-8333-333333333333",
				role: "admin",
				companyId: "cmp-1",
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("answers 422 when the document is not a proposed match", async () => {
		vi.spyOn(ReconciliationService.prototype, "reconcile").mockRejectedValue(
			new ReconcileRejectedError("no corresponde"),
		);
		const response = await post("/api/reconciliations/tx-1/reconcile", {
			companyId: "cmp-1",
			invoiceId: "44444444-4444-4444-8444-444444444444",
		});

		expect(response.status).toBe(422);
		expect(await response.json()).toMatchObject({ code: "MATCH_REJECTED" });
	});

	it("records who confirmed the match", async () => {
		const spy = vi
			.spyOn(ReconciliationService.prototype, "reconcile")
			.mockResolvedValue({ id: "tx-1" } as never);
		const response = await post("/api/reconciliations/tx-1/reconcile", {
			companyId: "cmp-1",
			invoiceId: "44444444-4444-4444-8444-444444444444",
		});

		expect(response.status).toBe(200);
		expect(spy).toHaveBeenCalledWith("cmp-1", "tx-1", {
			companyId: "cmp-1",
			invoiceId: "44444444-4444-4444-8444-444444444444",
			reconciledBy: "33333333-3333-4333-8333-333333333333",
		});
	});
});
