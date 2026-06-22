import { createHash } from "node:crypto";
import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interCompanyRoutes } from "../../api/routes";

vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { resolveSessionContext } from "../../../security/session-context";

const mockResolve = resolveSessionContext as unknown as ReturnType<
	typeof vi.fn
>;

const mockExecute = vi.hoisted(() => vi.fn());

vi.mock("../../infrastructure/inter-company-transaction.repository", () => ({
	interCompanyTransactionRepository: {},
}));

vi.mock(
	"../../application/commands/create-inter-company-transaction.handler",
	() => ({
		CreateInterCompanyTransactionHandler: vi.fn(() => ({
			execute: mockExecute,
		})),
	}),
);

vi.mock("../../application/commands/generate-spot-pdf.handler", () => ({
	GenerateSpotPdfHandler: vi.fn(() => ({
		execute: vi
			.fn()
			.mockResolvedValue({ url: "/fake.pdf", referenceNumber: "SPOT-123" }),
	})),
}));

vi.mock("../../application/queries/get-transactions.handler", () => ({
	GetTransactionsHandler: vi.fn(() => ({
		execute: vi.fn().mockResolvedValue([]),
	})),
}));

vi.mock("../../application/queries/get-stats.handler", () => ({
	GetStatsHandler: vi.fn(() => ({
		execute: vi.fn().mockResolvedValue({ totalTransactions: 0 }),
	})),
}));

vi.mock("../../application/queries/get-detraction-audit.handler", () => ({
	GetDetractionAuditHandler: vi.fn(() => ({
		execute: vi.fn().mockResolvedValue({
			items: [
				{
					id: "ic-1",
					detractionProfile: "TRANSPORT",
					detractionRuleCode: "DETRACCION_SPOT_TRANSPORT",
				},
			],
			total: 1,
			limit: 10,
			offset: 0,
			hasMore: false,
		}),
	})),
}));

describe("inter-company routes (VSA)", () => {
	const app = new Elysia().use(interCompanyRoutes);

	beforeEach(() => {
		mockResolve.mockResolvedValue({
			ok: true,
			context: {
				userId: "test-user",
				authUserId: "test-user",
				legacyUserId: null,
				role: "admin",
				companyId: "test-company",
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("accepts detractionProfile and forwards it", async () => {
		mockExecute.mockResolvedValue({
			interCompany: { id: "ic-1" },
			expense: { id: "tx-expense" },
			income: { id: "tx-income" },
			calculations: {
				subtotal: 1000,
				igv: 180,
				total: 1180,
				hasDetraction: true,
				detraction: 47.2,
				detractionRate: 4,
			},
		});

		const response = await app.handle(
			new Request("http://localhost/api/inter-company", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					economicGroupId: "group-1",
					fromCompanyId: "company-a",
					toCompanyId: "company-b",
					concept: "Servicio logístico",
					amount: 1000,
					taxType: "GRAVADO",
					detractionProfile: "TRANSPORT",
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(mockExecute).toHaveBeenCalledWith(
			expect.objectContaining({
				detractionProfile: "TRANSPORT",
			}),
		);

		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				interCompany: { id: "ic-1" },
			},
		});
	});

	it("returns 422 when detractionProfile is invalid", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/inter-company", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					economicGroupId: "group-1",
					fromCompanyId: "company-a",
					toCompanyId: "company-b",
					concept: "Servicio",
					amount: 1000,
					taxType: "GRAVADO",
					detractionProfile: "INVALID_PROFILE",
				}),
			}),
		);

		expect(response.status).toBe(422);
	});

	it("returns detraction audit and forwards filters", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/inter-company/audit?economicGroupId=group-1&detractionProfile=TRANSPORT&detractionRuleCode=DETRACCION_SPOT_TRANSPORT&dateFrom=2026-01-01&dateTo=2026-12-31&limit=10&offset=0&sortBy=amount&sortDir=asc",
			),
		);

		expect(response.status).toBe(200);

		const payload = await response.json();
		expect(response.headers.get("x-audit-generated-at")).toBeTruthy();
		expect(response.headers.get("x-audit-row-count")).toBe("1");
		const queryFingerprint = response.headers.get("x-audit-query-fingerprint");
		expect(queryFingerprint).toBeTruthy();
		expect(queryFingerprint).toMatch(/^[a-f0-9]{64}$/);
		const headerHash = response.headers.get("x-audit-content-sha256");
		const expectedHash = createHash("sha256")
			.update(JSON.stringify(payload), "utf8")
			.digest("hex");
		expect(headerHash).toBe(expectedHash);
		expect(payload).toMatchObject({
			success: true,
			data: {
				total: 1,
			},
		});
		expect(payload.data.auditFingerprint).toBe(queryFingerprint);
	});

	it("returns 422 for invalid detractionProfile in audit query", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/inter-company/audit?economicGroupId=group-1&detractionProfile=INVALID_PROFILE",
			),
		);

		expect(response.status).toBe(422);
	});

	it("returns 422 for invalid sortBy in audit query", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/inter-company/audit?economicGroupId=group-1&sortBy=invalid",
			),
		);

		expect(response.status).toBe(422);
	});

	it("returns 400 when dateFrom is after dateTo in audit query", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/inter-company/audit?economicGroupId=group-1&dateFrom=2026-12-31&dateTo=2026-01-01",
			),
		);

		expect(response.status).toBe(400);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "INTER_COMPANY_AUDIT_ERROR",
		});
		expect(payload.error).toContain("Invalid date range");
	});
});
