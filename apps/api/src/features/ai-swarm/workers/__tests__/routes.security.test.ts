import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Elysia } from "elysia";

const queueMocks = vi.hoisted(() => ({
	enqueue: vi.fn(),
	getStatus: vi.fn(),
	getStatusForCompany: vi.fn(),
	getPending: vi.fn(),
	getPendingForCompany: vi.fn(),
	getStats: vi.fn(),
	getStatsForCompany: vi.fn(),
	cancelTask: vi.fn(),
	cancelTaskForCompany: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
	authorizeAiSurface: vi.fn(),
}));

vi.mock("@drenyra/drenyra-orchestrator", () => ({
	queueManager: queueMocks,
}));

vi.mock("../../../security/ai-surface-access", () => ({
	authorizeAiSurface: authMocks.authorizeAiSurface,
}));

import { aiWorkersRoutes } from "../routes";

const COMPANY_A = "00000000-0000-0000-0000-0000000000a1";
const COMPANY_B = "00000000-0000-0000-0000-0000000000b2";

function createApp() {
	return new Elysia().use(aiWorkersRoutes);
}

function authHeaders(companyId = COMPANY_A): HeadersInit {
	return {
		cookie: "better-auth.session_token=test-session",
		"x-auth-user-id": "auth-user-1",
		"x-user-role": "admin",
		"x-company-id": companyId,
	};
}

function allowAiSurface(companyId = COMPANY_A): void {
	authMocks.authorizeAiSurface.mockResolvedValue({
		ok: true,
		context: {
			authUserId: "auth-user-1",
			companyId,
			legacyUserId: "legacy-user-1",
			operation: "cognitive:state:read",
			organizationId: 1001,
			role: "admin",
			userId: "auth-user-1",
		},
	});
}

describe("aiWorkersRoutes tenant isolation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		allowAiSurface();
		queueMocks.getStatsForCompany.mockResolvedValue({
			pending: 1,
			processing: 0,
			completed: 0,
			failed: 0,
			total: 1,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("rejects enqueue when request body company does not match the authenticated AI surface tenant", async () => {
		const app = createApp();

		const response = await app.handle(
			new Request("http://localhost/api/ai-workers/enqueue", {
				method: "POST",
				headers: {
					...authHeaders(COMPANY_A),
					"content-type": "application/json",
				},
				body: JSON.stringify({
					companyId: COMPANY_B,
					userId: "00000000-0000-0000-0000-000000000101",
					type: "ocr-processing",
					payload: { documentId: "doc-1" },
				}),
			}),
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({
			code: "TENANT_SCOPE_VIOLATION",
		});
		expect(queueMocks.enqueue).not.toHaveBeenCalled();
	});

	it("lists only tasks for the authenticated company even when no company filter is supplied", async () => {
		queueMocks.getPendingForCompany.mockResolvedValue([
			{ id: "task-a", companyId: COMPANY_A, status: "pending", type: "ocr-processing" },
		]);
		const app = createApp();

		const response = await app.handle(
			new Request("http://localhost/api/ai-workers/list", {
				headers: authHeaders(COMPANY_A),
			}),
		);

		expect(response.status).toBe(200);
		expect(queueMocks.getPendingForCompany).toHaveBeenCalledWith(COMPANY_A, 50, 0);
		expect(queueMocks.getPending).not.toHaveBeenCalled();
		const payload = await response.json();
		expect(payload.data.tasks).toEqual([
			expect.objectContaining({ id: "task-a", companyId: COMPANY_A }),
		]);
	});

	it("rejects list requests that ask for a different company", async () => {
		const app = createApp();

		const response = await app.handle(
			new Request(`http://localhost/api/ai-workers/list?companyId=${COMPANY_B}`, {
				headers: authHeaders(COMPANY_A),
			}),
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({
			code: "TENANT_SCOPE_VIOLATION",
		});
		expect(queueMocks.getPendingForCompany).not.toHaveBeenCalled();
	});

	it("uses company-scoped task lookup for task status", async () => {
		queueMocks.getStatusForCompany.mockResolvedValue(null);
		const app = createApp();

		const response = await app.handle(
			new Request("http://localhost/api/ai-workers/status/task-b", {
				headers: authHeaders(COMPANY_A),
			}),
		);

		expect(response.status).toBe(404);
		expect(queueMocks.getStatusForCompany).toHaveBeenCalledWith("task-b", COMPANY_A);
		expect(queueMocks.getStatus).not.toHaveBeenCalled();
	});

	it("uses company-scoped cancellation to avoid cross-tenant task mutation", async () => {
		const app = createApp();

		const response = await app.handle(
			new Request("http://localhost/api/ai-workers/task-a", {
				method: "DELETE",
				headers: authHeaders(COMPANY_A),
			}),
		);

		expect(response.status).toBe(200);
		expect(queueMocks.cancelTaskForCompany).toHaveBeenCalledWith("task-a", COMPANY_A);
		expect(queueMocks.cancelTask).not.toHaveBeenCalled();
	});
});
