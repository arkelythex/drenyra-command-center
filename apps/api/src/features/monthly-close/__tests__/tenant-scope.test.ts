import type { CloseChecklistRepository } from "@drenyra/domain/repositories/close-checklist.repository";
import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveSessionContext } = vi.hoisted(() => ({
	resolveSessionContext: vi.fn(),
}));

vi.mock("../../security/session-context", () => ({ resolveSessionContext }));

import { createMonthlyCloseRoutes } from "../routes";

const OWN = "11111111-1111-4111-8111-111111111111";
const FOREIGN = "22222222-2222-4222-8222-222222222222";
const ACTOR = "33333333-3333-4333-8333-333333333333";
const EVIDENCE = "55555555-5555-4555-8555-555555555555";
const FORGED = "44444444-4444-4444-8444-444444444444";

const checklist = (companyId: string) => ({
	id: `chk-${companyId}`,
	companyId,
	period: "2026-09",
	name: "Cierre",
	status: "PENDING",
	items: [],
});
const item = (checklistId: string) => ({
	id: `item-${checklistId}`,
	checklistId,
	evidenceIds: ["ev-0"],
});
const gate = (companyId: string) => ({ id: `gate-${companyId}`, companyId });

function fakeRepo() {
	const checklists = new Map(
		[checklist(OWN), checklist(FOREIGN)].map((c) => [c.id, c]),
	);
	const items = new Map(
		[item(`chk-${OWN}`), item(`chk-${FOREIGN}`)].map((i) => [i.id, i]),
	);
	const gates = new Map([gate(OWN), gate(FOREIGN)].map((g) => [g.id, g]));
	return {
		save: vi.fn(async (data) => ({ id: "new", ...data })),
		findById: vi.fn(async (id: string) => checklists.get(id) ?? null),
		findByCompanyAndPeriod: vi.fn(async () => []),
		findAllByCompany: vi.fn(async () => []),
		updateStatus: vi.fn(async (id: string) => checklists.get(id) ?? null),
		updateProgress: vi.fn(async () => 0),
		delete: vi.fn(async () => undefined),
		count: vi.fn(async () => 0),
		saveItem: vi.fn(async (data) => ({ id: "new-item", ...data })),
		updateItem: vi.fn(async (id: string, data) => ({
			...(items.get(id) ?? {}),
			...data,
		})),
		findItemById: vi.fn(async (id: string) => items.get(id) ?? null),
		getItemsByChecklistId: vi.fn(async () => []),
		saveGate: vi.fn(),
		findGatesByCompanyAndPeriod: vi.fn(async () => []),
		findGateById: vi.fn(async (id: string) => gates.get(id) ?? null),
		overrideGate: vi.fn(async (id: string) => gates.get(id) ?? null),
		getDashboard: vi.fn(async () => ({})),
	};
}

let repo: ReturnType<typeof fakeRepo>;
let app: { handle: (r: Request) => Promise<Response> };

function call(method: string, path: string, body?: unknown) {
	return app.handle(
		new Request(`http://localhost/api/v1/close${path}`, {
			method,
			headers: { "Content-Type": "application/json" },
			body: body === undefined ? undefined : JSON.stringify(body),
		}),
	);
}

beforeEach(() => {
	repo = fakeRepo();
	app = new Elysia().use(
		createMonthlyCloseRoutes(repo as unknown as CloseChecklistRepository),
	);
	resolveSessionContext.mockResolvedValue({
		ok: true,
		context: {
			userId: "user-1",
			authUserId: "user-1",
			legacyUserId: ACTOR,
			role: "admin",
			companyId: OWN,
		},
	});
});

describe("monthly close: another company's companyId", () => {
	it.each([
		["GET", `/checklists?companyId=${FOREIGN}`, undefined],
		["GET", `/gates?companyId=${FOREIGN}&period=2026-09`, undefined],
		["GET", `/dashboard?companyId=${FOREIGN}&period=2026-09`, undefined],
		["GET", `/periods?companyId=${FOREIGN}`, undefined],
		[
			"POST",
			"/checklists",
			{ companyId: FOREIGN, period: "2026-09", name: "x" },
		],
	])("%s %s is refused", async (method, path, body) => {
		const response = await call(method, path, body);

		expect(response.status).toBe(403);
		expect(repo.save).not.toHaveBeenCalled();
		expect(repo.findAllByCompany).not.toHaveBeenCalled();
		expect(repo.findGatesByCompanyAndPeriod).not.toHaveBeenCalled();
		expect(repo.getDashboard).not.toHaveBeenCalled();
		expect(repo.count).not.toHaveBeenCalled();
	});
});

describe("monthly close: records of another company, by id", () => {
	it("does not show another company's checklist", async () => {
		const response = await call("GET", `/checklists/chk-${FOREIGN}`);
		expect(response.status).toBe(404);
	});

	it("does not change another company's checklist", async () => {
		const response = await call("PATCH", `/checklists/chk-${FOREIGN}`, {
			status: "COMPLETED",
		});
		expect(response.status).toBe(404);
		expect(repo.updateStatus).not.toHaveBeenCalled();
	});

	it("does not add items to another company's checklist", async () => {
		const response = await call("POST", `/checklists/chk-${FOREIGN}/items`, {
			name: "x",
			category: "bank_reconciliation",
		});
		expect(response.status).toBe(404);
		expect(repo.saveItem).not.toHaveBeenCalled();
	});

	it("does not update or attach evidence to another company's item", async () => {
		const patch = await call("PATCH", `/items/item-chk-${FOREIGN}`, {
			status: "COMPLETED",
		});
		const attach = await call("POST", `/items/item-chk-${FOREIGN}/evidence`, {
			evidenceId: EVIDENCE,
		});

		expect(patch.status).toBe(404);
		expect(attach.status).toBe(404);
		expect(repo.updateItem).not.toHaveBeenCalled();
	});

	it("does not override another company's gate", async () => {
		const response = await call("PATCH", `/gates/gate-${FOREIGN}`, {
			status: "WAIVED",
			resolution: "ok",
		});
		expect(response.status).toBe(404);
		expect(repo.overrideGate).not.toHaveBeenCalled();
	});
});

describe("monthly close: own company", () => {
	it("serves its own checklist", async () => {
		const response = await call("GET", `/checklists/chk-${OWN}`);
		expect(response.status).toBe(200);
	});

	it("records the session user as who overrode a gate, not a body field", async () => {
		const response = await call("PATCH", `/gates/gate-${OWN}`, {
			status: "WAIVED",
			resolution: "Revisado con el contador",
			overrideById: FORGED,
		});

		expect(response.status).toBe(200);
		expect(repo.overrideGate).toHaveBeenCalledWith(
			`gate-${OWN}`,
			"WAIVED",
			"Revisado con el contador",
			ACTOR,
		);
	});

	it("records the session user as who completed an item", async () => {
		const response = await call("PATCH", `/items/item-chk-${OWN}`, {
			status: "COMPLETED",
			completedById: FORGED,
		});

		expect(response.status).toBe(200);
		expect(repo.updateItem).toHaveBeenCalledWith(
			`item-chk-${OWN}`,
			expect.objectContaining({ status: "COMPLETED", completedById: ACTOR }),
		);
	});

	it("attaches evidence to the item it was asked for", async () => {
		const response = await call("POST", `/items/item-chk-${OWN}/evidence`, {
			evidenceId: EVIDENCE,
		});

		expect(response.status).toBe(200);
		expect(repo.updateItem).toHaveBeenCalledWith(`item-chk-${OWN}`, {
			evidenceIds: ["ev-0", EVIDENCE],
		});
	});
});
