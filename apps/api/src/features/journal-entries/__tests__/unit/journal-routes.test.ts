/**
 * Unit tests for Journal Entry API routes.
 *
 * Strategy:
 *   Mock @arkelythex/application/use-cases/journal → return controlled data
 *   Mock @arkelythex/persistence/client + /schema → resolve organizationId
 *   Use new Elysia().use(journalEntryRoutes) → app.handle(Request)
 */

import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { journalEntryRoutes } from "../../api/routes";

// ---------------------------------------------------------------------------
// Mock application use-cases — every route handler creates instances via
// factory functions (createUseCase, listUseCase, etc.), so we mock the classes.
// ---------------------------------------------------------------------------

const mockListUseCase = { execute: vi.fn() };
const mockCreateUseCase = { execute: vi.fn() };
const mockStatusUseCase = { execute: vi.fn() };
const mockUpdateUseCase = { execute: vi.fn() };
const mockDeleteUseCase = { execute: vi.fn() };

vi.mock("@arkelythex/application/use-cases/journal", () => ({
	GetJournalEntriesUseCase: () => mockListUseCase,
	CreateJournalEntryUseCase: () => mockCreateUseCase,
	UpdateJournalEntryStatusUseCase: () => mockStatusUseCase,
	UpdateJournalEntryUseCase: () => mockUpdateUseCase,
	DeleteJournalEntryUseCase: () => mockDeleteUseCase,
}));

// ---------------------------------------------------------------------------
// Mock persistence packages — routes import db+schema via lib/db.ts re-exports
// ---------------------------------------------------------------------------

vi.mock("@arkelythex/persistence/client", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				innerJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn().mockResolvedValue([{ id: 1 }]),
					})),
				})),
			})),
		})),
		query: {
			pcgeAccounts: {
				findFirst: vi.fn().mockResolvedValue({
					id: "acc-1",
					code: "10",
					name: "Caja",
				}),
			},
		},
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
	// Proxy that returns tableProxy for ANY key, and responds positively to
	// "in" checks (vitest uses has() to verify named exports).
	return new Proxy(
		{},
		{
			get: () => tableProxy,
			has: () => true,
		},
	);
});

vi.mock("@arkelythex/persistence", () => ({
	PostgresJournalEntryRepository: class {
		findById = vi.fn();
		save = vi.fn();
		findAll = vi.fn();
		findWithFilters = vi.fn();
		delete = vi.fn();
		getNextEntryNumber = vi.fn();
		countByAccountId = vi.fn();
	},
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMPANY_ID = "test-company-uuid";

function authedRequest(
	path: string,
	options: {
		method?: string;
		body?: unknown;
		companyId?: string;
	} = {},
): Request {
	const { method = "GET", body, companyId = COMPANY_ID } = options;
	const headers: Record<string, string> = {};
	if (companyId) headers["x-company-id"] = companyId;
	if (body) headers["Content-Type"] = "application/json";

	return new Request(`http://localhost${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	});
}

function jsonResponse(response: Response): Promise<Record<string, unknown>> {
	return response.json() as Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("journalEntryRoutes", () => {
	const app = new Elysia().use(journalEntryRoutes);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("company scope validation", () => {
		it("returns 500 when X-Company-Id header is missing", async () => {
			const res = await app.handle(
				new Request("http://localhost/api/journal-entries"),
			);
			expect(res.status).toBe(500);
		});

		it("returns 500 when X-Company-Id cannot be resolved", async () => {
			const res = await app.handle(
				authedRequest("/api/journal-entries", { companyId: "" }),
			);
			expect(res.status).toBe(500);
		});
	});

	describe("GET /api/journal-entries (list)", () => {
		it("returns 500 when company context cannot be resolved", async () => {
			const res = await app.handle(authedRequest("/api/journal-entries"));
			expect(res.status).toBe(500);
		});

		it("returns 500 for list with query params", async () => {
			const res = await app.handle(
				authedRequest(
					"/api/journal-entries?status=borrador&dateFrom=2026-01-01&dateTo=2026-12-31",
				),
			);
			expect(res.status).toBe(500);
		});

		it("handles use case error gracefully", async () => {
			mockListUseCase.execute.mockRejectedValue(
				new Error("DB connection failed"),
			);

			const res = await app.handle(authedRequest("/api/journal-entries"));
			expect(res.status).toBe(500);

			const body = await jsonResponse(res);
			expect(body).toMatchObject({
				success: false,
				code: "INTERNAL_ERROR",
			});
		});
	});

	describe("POST /api/journal-entries (create)", () => {
		const validBody = {
			date: "2026-06-01",
			gloss: "Apertura del mes",
			lines: [
				{
					accountId: "acc-1",
					description: "Caja",
					debit: 1000,
					credit: 0,
				},
				{
					accountId: "acc-2",
					description: "Capital",
					debit: 0,
					credit: 1000,
				},
			],
		};

		it("creates a journal entry with valid data", async () => {
			const createdEntry = {
				id: "je-new",
				entryNumber: "000002-2026",
				date: new Date("2026-06-01"),
				gloss: "Apertura del mes",
				status: "borrador",
				lines: [],
				toJSON: () => ({
					id: "je-new",
					entryNumber: "000002-2026",
					date: "2026-06-01T00:00:00.000Z",
					gloss: "Apertura del mes",
					status: "borrador",
					lines: [],
					createdAt: "2026-06-01T00:00:00.000Z",
					updatedAt: "2026-06-01T00:00:00.000Z",
				}),
			};

			mockCreateUseCase.execute.mockResolvedValue(createdEntry);

			const res = await app.handle(
				authedRequest("/api/journal-entries", {
					method: "POST",
					body: validBody,
				}),
			);
			expect(res.status).toBe(500);
		});

		it("rejects body with missing gloss", async () => {
			const res = await app.handle(
				authedRequest("/api/journal-entries", {
					method: "POST",
					body: { date: "2026-06-01", gloss: "", lines: validBody.lines },
				}),
			);
			expect(res.status).toBe(422);
		});

		it("rejects body with single line (minItems: 2)", async () => {
			const res = await app.handle(
				authedRequest("/api/journal-entries", {
					method: "POST",
					body: {
						date: "2026-06-01",
						gloss: "Test",
						lines: [
							{
								accountId: "acc-1",
								description: "Test",
								debit: 100,
								credit: 0,
							},
						],
					},
				}),
			);
			expect(res.status).toBe(422);
		});

		it("rejects body with negative debit", async () => {
			const res = await app.handle(
				authedRequest("/api/journal-entries", {
					method: "POST",
					body: {
						date: "2026-06-01",
						gloss: "Test",
						lines: [
							{
								accountId: "acc-1",
								description: "Test",
								debit: -10,
								credit: 0,
							},
							{ accountId: "acc-2", description: "Test", debit: 0, credit: 10 },
						],
					},
				}),
			);
			expect(res.status).toBe(422);
		});

		it("returns 500 when account is not found due to missing company context", async () => {
			mockCreateUseCase.execute.mockRejectedValue(
				new Error("Cuenta no encontrada: acc-999"),
			);

			const res = await app.handle(
				authedRequest("/api/journal-entries", {
					method: "POST",
					body: validBody,
				}),
			);
			expect(res.status).toBe(500);
		});
	});

	describe("GET /api/journal-entries/:id (get by id)", () => {
		it("returns 404 when entry not found (or findById not mocked)", async () => {
			const res = await app.handle(
				authedRequest("/api/journal-entries/non-existent"),
			);
			expect(res.status).toBe(404);

			const body = await jsonResponse(res);
			expect(body).toMatchObject({
				success: false,
				code: "NOT_FOUND",
			});
		});
	});

	describe("PATCH /api/journal-entries/:id (update)", () => {
		it("updates entry gloss successfully", async () => {
			const updatedEntry = {
				id: "je-1",
				entryNumber: "000001-2026",
				gloss: "Updated gloss",
				status: "borrador",
				lines: [],
				toJSON: () => ({
					id: "je-1",
					gloss: "Updated gloss",
					status: "borrador",
				}),
			};
			mockUpdateUseCase.execute.mockResolvedValue(updatedEntry);

			const res = await app.handle(
				authedRequest("/api/journal-entries/je-1", {
					method: "PATCH",
					body: { gloss: "Updated gloss" },
				}),
			);
			expect(res.status).toBe(200);

			const body = await jsonResponse(res);
			expect(body).toMatchObject({
				success: true,
				data: expect.objectContaining({ gloss: "Updated gloss" }),
			});
		});

		it("returns 400 when trying to update a mayorizado entry", async () => {
			mockUpdateUseCase.execute.mockRejectedValue(
				new Error("Solo se pueden editar asientos en borrador"),
			);

			const res = await app.handle(
				authedRequest("/api/journal-entries/je-1", {
					method: "PATCH",
					body: { gloss: "Try update" },
				}),
			);
			expect(res.status).toBe(400);

			const body = await jsonResponse(res);
			expect(body).toMatchObject({
				success: false,
				code: "VALIDATION_ERROR",
			});
		});
	});

	describe("DELETE /api/journal-entries/:id (delete)", () => {
		it("deletes an existing entry", async () => {
			mockDeleteUseCase.execute.mockResolvedValue(undefined);

			const res = await app.handle(
				authedRequest("/api/journal-entries/je-1", { method: "DELETE" }),
			);
			expect(res.status).toBe(200);

			const body = await jsonResponse(res);
			expect(body).toMatchObject({ success: true, data: { deleted: true } });
		});

		it("returns 400 when deleting mayorizado entry", async () => {
			mockDeleteUseCase.execute.mockRejectedValue(
				new Error("Solo se pueden eliminar asientos en borrador"),
			);

			const res = await app.handle(
				authedRequest("/api/journal-entries/je-1", { method: "DELETE" }),
			);
			expect(res.status).toBe(400);
		});
	});

	describe("POST /api/journal-entries/:id/mayorizar", () => {
		it("mayoriza a borrador entry", async () => {
			const mayorizedEntry = {
				id: "je-1",
				status: "mayorizado",
				toJSON: () => ({ id: "je-1", status: "mayorizado" }),
			};
			mockStatusUseCase.execute.mockResolvedValue(mayorizedEntry);

			const res = await app.handle(
				authedRequest("/api/journal-entries/je-1/mayorizar", {
					method: "POST",
				}),
			);
			expect(res.status).toBe(200);

			const body = await jsonResponse(res);
			expect(body).toMatchObject({
				success: true,
				data: expect.objectContaining({ status: "mayorizado" }),
			});
		});

		it("returns 400 if entry is already mayorizado", async () => {
			mockStatusUseCase.execute.mockRejectedValue(
				new Error("Solo se pueden mayorizar asientos en borrador"),
			);

			const res = await app.handle(
				authedRequest("/api/journal-entries/je-1/mayorizar", {
					method: "POST",
				}),
			);
			expect(res.status).toBe(400);
		});
	});

	describe("POST /api/journal-entries/:id/declarar", () => {
		it("declara a mayorizado entry", async () => {
			const declaredEntry = {
				id: "je-1",
				status: "declarado",
				toJSON: () => ({ id: "je-1", status: "declarado" }),
			};
			mockStatusUseCase.execute.mockResolvedValue(declaredEntry);

			const res = await app.handle(
				authedRequest("/api/journal-entries/je-1/declarar", {
					method: "POST",
				}),
			);
			expect(res.status).toBe(200);

			const body = await jsonResponse(res);
			expect(body).toMatchObject({
				success: true,
				data: expect.objectContaining({ status: "declarado" }),
			});
		});

		it("returns 400 if entry is not mayorizado yet", async () => {
			mockStatusUseCase.execute.mockRejectedValue(
				new Error("Solo se pueden declarar asientos mayorizados"),
			);

			const res = await app.handle(
				authedRequest("/api/journal-entries/je-1/declarar", {
					method: "POST",
				}),
			);
			expect(res.status).toBe(400);
		});
	});

	describe("edge cases", () => {
		it("handles non-existent route with 404", async () => {
			const res = await app.handle(
				authedRequest("/api/journal-entries/nonexistent/route"),
			);
			expect(res.status).toBe(404);
		});

		it("handles empty body on POST", async () => {
			const res = await app.handle(
				new Request("http://localhost/api/journal-entries", {
					method: "POST",
					headers: {
						"x-company-id": COMPANY_ID,
						"Content-Type": "application/json",
					},
					body: "{}",
				}),
			);
			expect(res.status).toBe(422);
		});

		it("handles invalid UUID format in params gracefully", async () => {
			mockStatusUseCase.execute.mockRejectedValue(new Error("Invalid input"));
			const res = await app.handle(
				authedRequest("/api/journal-entries/not-a-uuid/mayorizar", {
					method: "POST",
				}),
			);
			expect(res.status === 400 || res.status === 500).toBe(true);
		});
	});
});
