/**
 * journalEntryRoutes — tenant scope and error mapping.
 *
 * The company scope guard is replaced by a stub that injects a company
 * context, so the routes are exercised without a real session.
 */

import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const COMPANY = "company-a1";
const scope = { organizationId: "1", companyId: COMPANY };

const executeSpy = vi.fn();
const repo = { findById: vi.fn(), delete: vi.fn() };
let currentCompany: string | undefined = COMPANY;

vi.mock("../../../../shared/plugins", () => ({
	companyScopeGuard: () => (app: Elysia) =>
		app.derive(() => ({
			companyContext: currentCompany
				? { companyId: currentCompany, userId: "user-1" }
				: (undefined as never),
		})),
}));

vi.mock("../../application/_helpers", () => ({
	journalRepository: repo,
	periodRepository: {},
	accountService: {},
	resolveOrganizationId: async () => 1,
	resolveTenantScope: async (companyId: string | undefined) => {
		if (!companyId) throw new Error("Contexto de empresa requerido");
		return { organizationId: "1", companyId };
	},
}));

vi.mock("@drenyra/application/use-cases/journal", () => {
	class UseCase {
		execute = executeSpy;
	}
	return {
		GetJournalEntriesUseCase: UseCase,
		CreateJournalEntryUseCase: UseCase,
		UpdateJournalEntryUseCase: UseCase,
		UpdateJournalEntryStatusUseCase: UseCase,
		DeleteJournalEntryUseCase: UseCase,
	};
});

const { journalEntryRoutes } = await import("../../api/routes");

const ID = "550e8400-e29b-41d4-a716-446655440000";

function req(path: string, method: string, body?: unknown): Request {
	return new Request(`http://localhost/api/journal-entries${path}`, {
		method,
		headers: body ? { "Content-Type": "application/json" } : {},
		body: body ? JSON.stringify(body) : undefined,
	});
}

describe("journalEntryRoutes — tenant scope and errors", () => {
	const app = new Elysia().use(journalEntryRoutes);

	beforeEach(() => {
		vi.clearAllMocks();
		currentCompany = COMPANY;
	});

	it("GET /:id reads inside the caller's scope and returns 404 for foreign ids", async () => {
		repo.findById.mockResolvedValue(null);
		const res = await app.handle(req(`/${ID}`, "GET"));
		expect(res.status).toBe(404);
		expect(repo.findById).toHaveBeenCalledWith(scope, ID);
	});

	it("PATCH /:id passes the scope to the use case", async () => {
		executeSpy.mockResolvedValue({ toJSON: () => ({ id: ID }) });
		const res = await app.handle(req(`/${ID}`, "PATCH", { gloss: "nuevo" }));
		expect(res.status).toBe(200);
		expect(executeSpy.mock.calls[0]?.[0]).toEqual(scope);
		expect(executeSpy.mock.calls[0]?.[1]).toBe(ID);
	});

	it.each([
		["PATCH", `/${ID}`, { gloss: "x" }],
		["DELETE", `/${ID}`, undefined],
		["POST", `/${ID}/mayorizar`, undefined],
		["POST", `/${ID}/declarar`, undefined],
		["POST", `/${ID}/approve`, undefined],
	])(
		"%s %s maps 'Asiento no encontrado' to 404",
		async (method, path, body) => {
			executeSpy.mockRejectedValue(new Error("Asiento no encontrado"));
			const res = await app.handle(req(path, method, body));
			expect(res.status).toBe(404);
		},
	);

	it("POST /:id/reject maps a foreign entry to 404 and does not delete", async () => {
		repo.findById.mockResolvedValue(null);
		const res = await app.handle(req(`/${ID}/reject`, "POST"));
		expect(res.status).toBe(404);
		expect(repo.delete).not.toHaveBeenCalled();
	});

	it("rejects with 403 when the request has no company context", async () => {
		currentCompany = undefined;
		const res = await app.handle(req(`/${ID}`, "DELETE"));
		expect(res.status).toBe(403);
		expect(executeSpy).not.toHaveBeenCalled();
	});
});
