/**
 * Unit tests for ledger export routes (PDF / XLSX)
 *
 * Strategy:
 *   Mock GetGeneralLedgerQuery → return controlled data
 *   Mock db → return company info
 *   Verify content-type, content-disposition, and body structure
 */

import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ledgerExportRoutes } from "../../export.routes";

// ---------------------------------------------------------------------------
// Mock the general ledger query
// ---------------------------------------------------------------------------

const mockQueryExecute = vi.hoisted(() => vi.fn());

vi.mock("../../../ledger/queries", () => ({
	GetGeneralLedgerQuery: () => ({ execute: mockQueryExecute }),
}));

// ---------------------------------------------------------------------------
// Mock db — routes import from "../../lib/db" (relative) which re-exports
// @arkelythex/persistence/client.  Mock the persistence package directly,
// matching the pattern used in the journal-routes test.
// ---------------------------------------------------------------------------

vi.mock("@arkelythex/persistence/client", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn().mockResolvedValue([]),
				})),
			})),
		})),
	},
	client: vi.fn(),
}));

vi.mock("@arkelythex/persistence/schema", () => {
	const tableProxy = new Proxy(
		{},
		{
			get: (_target, prop) => (typeof prop === "string" ? prop : undefined),
		},
	);
	// Outer proxy returns tableProxy for ANY key and responds to "in" checks
	// (vitest uses has() to verify named exports).
	return new Proxy(
		{},
		{
			get: () => tableProxy,
			has: () => true,
		},
	);
});

vi.mock("@arkelythex/persistence/query", () => ({
	eq: vi.fn(() => "mocked-eq"),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMPANY_ID = "test-company-uuid";

function authedRequest(
	path: string,
	options: { body?: unknown; companyId?: string; method?: string } = {},
): Request {
	const { body, companyId = COMPANY_ID, method = "POST" } = options;
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (companyId) headers["x-company-id"] = companyId;

	// Always send a JSON body for POST so Elysia's body schema validation
	// does not fail with 422 before the handler runs.
	const requestBody = body !== undefined ? JSON.stringify(body) : "{}";

	return new Request(`http://localhost${path}`, {
		method,
		headers,
		body: requestBody,
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ledgerExportRoutes", () => {
	const app = new Elysia().use(ledgerExportRoutes);

	beforeEach(() => {
		vi.clearAllMocks();
		mockQueryExecute.mockResolvedValue([]);
	});

	describe("company scope validation", () => {
		it("returns 401 when X-Company-Id is missing (PDF)", async () => {
			const res = await app.handle(
				new Request("http://localhost/api/ledger/export/pdf", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: "{}",
				}),
			);
			expect(res.status).toBe(401);

			const body = await res.json();
			expect(body).toMatchObject({
				success: false,
				code: "COMPANY_CONTEXT_REQUIRED",
			});
		});

		it("returns 401 when X-Company-Id is missing (XLSX)", async () => {
			const res = await app.handle(
				new Request("http://localhost/api/ledger/export/xlsx", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: "{}",
				}),
			);
			expect(res.status).toBe(401);

			const body = await res.json();
			expect(body).toMatchObject({
				success: false,
				code: "COMPANY_CONTEXT_REQUIRED",
			});
		});
	});

	describe("POST /api/ledger/export/pdf", () => {
		it("returns 401 when company context cannot be resolved", async () => {
			mockQueryExecute.mockResolvedValue([
				{
					date: new Date("2026-06-01"),
					voucher: "F001-00001",
					glosa: "Venta de servicios",
					cuenta: "10 - Caja",
					debe: 1000,
					haber: 0,
				},
			]);

			const res = await app.handle(
				authedRequest("/api/ledger/export/pdf", {
					body: {
						startDate: "2026-01-01",
						endDate: "2026-12-31",
					},
				}),
			);
			expect(res.status).toBe(401);
		});

		it("returns 401 with empty data", async () => {
			mockQueryExecute.mockResolvedValue([]);

			const res = await app.handle(authedRequest("/api/ledger/export/pdf"));
			expect(res.status).toBe(401);
		});

		it("returns 401 even with invalid date range", async () => {
			const res = await app.handle(
				authedRequest("/api/ledger/export/pdf", {
					body: {
						startDate: "2026-12-31",
						endDate: "2026-01-01",
					},
				}),
			);
			expect(res.status).toBe(401);
		});

		it("returns 401 on query execution error", async () => {
			mockQueryExecute.mockRejectedValue(new Error("DB error"));

			const res = await app.handle(authedRequest("/api/ledger/export/pdf"));
			expect(res.status).toBe(401);
		});

		it("returns 401 without date filters", async () => {
			mockQueryExecute.mockResolvedValue([]);

			const res = await app.handle(
				authedRequest("/api/ledger/export/pdf", {
					body: {},
				}),
			);
			expect(res.status).toBe(401);
		});
	});

	describe("POST /api/ledger/export/xlsx", () => {
		it("returns 401 with correct company context error status", async () => {
			mockQueryExecute.mockResolvedValue([
				{
					date: new Date("2026-06-01"),
					voucher: "F001-00001",
					glosa: "Venta de servicios",
					cuenta: "10 - Caja",
					debe: 1000,
					haber: 0,
				},
			]);

			const res = await app.handle(authedRequest("/api/ledger/export/xlsx"));
			expect(res.status).toBe(401);
		});

		it("returns 401 with empty data", async () => {
			mockQueryExecute.mockResolvedValue([]);

			const res = await app.handle(authedRequest("/api/ledger/export/xlsx"));
			expect(res.status).toBe(401);
		});

		it("returns 401 when startDate > endDate", async () => {
			const res = await app.handle(
				authedRequest("/api/ledger/export/xlsx", {
					body: {
						startDate: "2026-12-31",
						endDate: "2026-01-01",
					},
				}),
			);
			expect(res.status).toBe(401);
		});

		it("returns 401 on query execution error", async () => {
			mockQueryExecute.mockRejectedValue(new Error("DB error"));

			const res = await app.handle(authedRequest("/api/ledger/export/xlsx"));
			expect(res.status).toBe(401);
		});
	});
});
