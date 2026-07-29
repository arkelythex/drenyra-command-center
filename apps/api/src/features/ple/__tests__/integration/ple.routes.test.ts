/**
 * PLE Routes — Integration Tests
 *
 * Tests the PLE API routes using Elysia's handle() method,
 * with mocked service layer and tenant context decoration.
 */
import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock PleService ───────────────────────────────────────────────

const {
	mockGenerateBook,
	mockGetBook,
	mockListBooks,
	mockValidateBook,
	mockMarkAsFiled,
	mockGenerateFileName,
} = vi.hoisted(() => ({
	mockGenerateBook: vi.fn(),
	mockGetBook: vi.fn(),
	mockListBooks: vi.fn(),
	mockValidateBook: vi.fn(),
	mockMarkAsFiled: vi.fn(),
	mockGenerateFileName: vi.fn(),
}));

vi.mock("../../ple.service", () => ({
	PleService: {
		generateBook: (...args: unknown[]) => mockGenerateBook(...args),
		getBook: (...args: unknown[]) => mockGetBook(...args),
		listBooks: (...args: unknown[]) => mockListBooks(...args),
		validateBook: (...args: unknown[]) => mockValidateBook(...args),
		markAsFiled: (...args: unknown[]) => mockMarkAsFiled(...args),
		generateFileName: (...args: unknown[]) => mockGenerateFileName(...args),
	},
}));

import { pleRoutes } from "../../ple.routes";

// ─── Test App Factory ──────────────────────────────────────────────

/**
 * Creates a test Elysia app with PLE routes and an injected tenant context.
 *
 * Uses `derive()` to simulate what companyScopeGuard does in production:
 * providing `tenantContext` with companyId, userId, etc.
 */
function createTestApp(tenantOverrides: Record<string, unknown> = {}) {
	return new Elysia()
		.derive(() => ({
			tenantContext: {
				companyId: "test-company-id",
				userId: "test-user-id",
				organizationId: "test-org-id",
				role: "admin",
				memberships: [],
				...tenantOverrides,
			},
		}))
		.use(pleRoutes);
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("PLE Routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// ─── GET /api/ple/books ────────────────────────────────────────

	describe("GET /api/ple/books", () => {
		it("returns 200 with book list", async () => {
			mockListBooks.mockResolvedValue([
				{
					id: "gen-001",
					bookType: "LE-DIARIO",
					period: "2026-03",
					ruc: "20123456786",
					status: "generated",
					fileContent: null,
					fileSizeBytes: null,
					cdrHash: null,
					generatedAt: "2026-03-15T00:00:00.000Z",
				},
			]);

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books?period=2026-03"),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data).toHaveLength(1);
		});

		it("returns 401 when companyId is missing from context", async () => {
			const app = createTestApp({ companyId: "" });
			const response = await app.handle(
				new Request("http://localhost/api/ple/books"),
			);

			expect(response.status).toBe(401);
			const body = await response.json();
			expect(body.success).toBe(false);
		});
	});

	// ─── POST /api/ple/books/generate ──────────────────────────────

	describe("POST /api/ple/books/generate", () => {
		it("returns 201 with generated book", async () => {
			mockGenerateBook.mockResolvedValue({
				id: "gen-001",
				bookType: "LE-DIARIO",
				period: "2026-03",
				ruc: "20123456786",
				status: "generated",
				fileContent: "mock-content",
				fileSizeBytes: 12,
				cdrHash: null,
				generatedAt: "2026-03-15T00:00:00.000Z",
			});

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/generate", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						period: "2026-03",
						bookType: "LE-DIARIO",
						ruc: "20123456786",
						computeCdr: false,
					}),
				}),
			);

			expect(response.status).toBe(201);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data.id).toBe("gen-001");
		});

		it("returns 500 on generation failure", async () => {
			mockGenerateBook.mockRejectedValue(new Error("Database error"));

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/generate", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						period: "2026-03",
						bookType: "LE-DIARIO",
						ruc: "20123456786",
					}),
				}),
			);

			expect(response.status).toBe(500);
			const body = await response.json();
			expect(body.success).toBe(false);
		});
	});

	// ─── GET /api/ple/books/:id ────────────────────────────────────

	describe("GET /api/ple/books/:id", () => {
		it("returns 200 with book details", async () => {
			mockGetBook.mockResolvedValue({
				id: "gen-001",
				bookType: "LE-DIARIO",
				period: "2026-03",
				ruc: "20123456786",
				status: "generated",
				fileContent: "mock-content",
				fileSizeBytes: 12,
				cdrHash: null,
				generatedAt: "2026-03-15T00:00:00.000Z",
			});

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/gen-001"),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data.id).toBe("gen-001");
		});

		it("returns 404 when book not found", async () => {
			mockGetBook.mockResolvedValue(null);

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/nonexistent"),
			);

			expect(response.status).toBe(404);
		});
	});

	// ─── GET /api/ple/books/:id/download ───────────────────────────

	describe("GET /api/ple/books/:id/download", () => {
		it("returns TXT content with correct headers", async () => {
			mockGetBook.mockResolvedValue({
				id: "gen-001",
				bookType: "LE-DIARIO",
				period: "2026-03",
				ruc: "20123456786",
				status: "generated",
				fileContent: "20123456786|2026-03|LE-DIARIO\nline1\nline2",
				fileSizeBytes: 50,
				cdrHash: null,
				generatedAt: "2026-03-15T00:00:00.000Z",
			});

			mockGenerateFileName.mockReturnValue({
				filename: "20123456786-202603-LE-DIARIO.txt",
				ruc: "20123456786",
				period: "2026-03",
				bookType: "LE-DIARIO",
			});

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/gen-001/download"),
			);

			expect(response.status).toBe(200);
			expect(response.headers.get("content-type")).toContain("text/plain");
			expect(response.headers.get("content-disposition")).toContain(
				"20123456786-202603-LE-DIARIO.txt",
			);
		});

		it("returns 404 when content missing", async () => {
			mockGetBook.mockResolvedValue({
				id: "gen-001",
				bookType: "LE-DIARIO",
				period: "2026-03",
				ruc: "20123456786",
				status: "generated",
				fileContent: null,
				fileSizeBytes: null,
				cdrHash: null,
				generatedAt: "2026-03-15T00:00:00.000Z",
			});

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/gen-001/download"),
			);

			expect(response.status).toBe(404);
		});
	});

	// ─── POST /api/ple/books/:id/validate ──────────────────────────

	describe("POST /api/ple/books/:id/validate", () => {
		it("returns validation result when valid", async () => {
			mockValidateBook.mockResolvedValue({
				valid: true,
				errors: [],
				warnings: [],
			});

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/gen-001/validate", {
					method: "POST",
				}),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data.valid).toBe(true);
		});

		it("returns validation errors when invalid", async () => {
			mockValidateBook.mockResolvedValue({
				valid: false,
				errors: [{ code: "EMPTY_CONTENT", message: "Content is empty" }],
				warnings: [],
			});

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/gen-001/validate", {
					method: "POST",
				}),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.data.valid).toBe(false);
			expect(body.data.errors).toHaveLength(1);
		});

		it("returns 404 when book not found", async () => {
			mockValidateBook.mockRejectedValue(
				new Error("PLE generation not found: nonexistent"),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/nonexistent/validate", {
					method: "POST",
				}),
			);

			expect(response.status).toBe(404);
		});
	});

	// ─── POST /api/ple/books/:id/file ──────────────────────────────

	describe("POST /api/ple/books/:id/file", () => {
		it("marks as filed when validated", async () => {
			mockGetBook.mockResolvedValue({
				id: "gen-001",
				bookType: "LE-DIARIO",
				period: "2026-03",
				ruc: "20123456786",
				status: "validated",
				fileContent: "content",
				fileSizeBytes: 7,
				cdrHash: null,
				generatedAt: "2026-03-15T00:00:00.000Z",
			});

			mockMarkAsFiled.mockResolvedValue({
				id: "gen-001",
				bookType: "LE-DIARIO",
				period: "2026-03",
				ruc: "20123456786",
				status: "filed",
				fileContent: "content",
				fileSizeBytes: 7,
				cdrHash: null,
				generatedAt: "2026-03-15T00:00:00.000Z",
			});

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/gen-001/file", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						sunatTicket: "TICKET-123",
						message: "Filed successfully",
					}),
				}),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(body.data.status).toBe("filed");
		});

		it("rejects filing when not validated", async () => {
			mockGetBook.mockResolvedValue({
				id: "gen-001",
				bookType: "LE-DIARIO",
				period: "2026-03",
				ruc: "20123456786",
				status: "generated",
				fileContent: "content",
				fileSizeBytes: 7,
				cdrHash: null,
				generatedAt: "2026-03-15T00:00:00.000Z",
			});

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/gen-001/file", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({}),
				}),
			);

			expect(response.status).toBe(400);
		});

		it("returns 404 when book not found", async () => {
			mockGetBook.mockResolvedValue(null);

			const app = createTestApp();
			const response = await app.handle(
				new Request("http://localhost/api/ple/books/nonexistent/file", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({}),
				}),
			);

			expect(response.status).toBe(404);
		});
	});
});
