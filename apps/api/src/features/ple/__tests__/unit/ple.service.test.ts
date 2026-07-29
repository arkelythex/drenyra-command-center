/**
 * PLE Service — Unit Tests
 *
 * Tests for the PLE application service using simplified db mocking.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Thenable helper ───────────────────────────────────────────────

/** Creates an awaitable wrapper for mock return values */
function asThenable<T>(value: T): T {
	const proxy = new Proxy(value as object, {
		get(target, prop) {
			if (prop === "then") {
				return (resolve: (v: T) => unknown) => resolve(value);
			}
			return Reflect.get(target, prop);
		},
	});
	return proxy as T;
}

// ─── Nested query builder mock ─────────────────────────────────────

function createSelectMock<T>(rows: T[]) {
	const resolved = asThenable(rows);
	const base = new Proxy(
		{
			from: vi.fn(() => base),
			where: vi.fn(() => base),
			orderBy: vi.fn(() => resolved),
			limit: vi.fn(() => resolved),
			innerJoin: vi.fn(() => base),
			leftJoin: vi.fn(() => base),
			groupBy: vi.fn(() => base),
		},
		{
			get(target, prop) {
				if (prop === "then") {
					return (resolve: (v: T[]) => unknown) => resolve(rows);
				}
				return Reflect.get(target, prop);
			},
		},
	);
	return base;
}

function createInsertMock<T>(rows: T[]) {
	const resolved = asThenable(rows);
	const base = new Proxy(
		{
			values: vi.fn(() => base),
			onConflictDoUpdate: vi.fn(() => base),
			returning: vi.fn(() => resolved),
		},
		{
			get(target, prop) {
				if (prop === "then") {
					return (resolve: (v: T[]) => unknown) => resolve(rows);
				}
				return Reflect.get(target, prop);
			},
		},
	);
	return base;
}

function createUpdateMock<T>(rows: T[]) {
	const resolved = asThenable(rows);
	const base = new Proxy(
		{
			set: vi.fn(() => base),
			where: vi.fn(() => base),
			returning: vi.fn(() => resolved),
		},
		{
			get(target, prop) {
				if (prop === "then") {
					return (resolve: (v: T[]) => unknown) => resolve(rows);
				}
				return Reflect.get(target, prop);
			},
		},
	);
	return base;
}

// ─── Mock modules ──────────────────────────────────────────────────

const mockDb = vi.hoisted(() => ({
	select: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
}));

vi.mock("@drenyra/persistence/client", () => ({
	db: mockDb,
}));

vi.mock("@drenyra/persistence/query", () => ({
	eq: vi.fn((_a: unknown, _b: unknown) => ({ type: "eq" })),
	and: vi.fn((..._args: unknown[]) => ({ type: "and" })),
	desc: vi.fn((_col: unknown) => ({ type: "desc" })),
	sql: vi.fn((_strings: TemplateStringsArray, ..._values: unknown[]) => ({
		type: "sql",
	})),
}));

vi.mock("../../ple-generator.service", () => ({
	PleGeneratorService: {
		generateBook: vi.fn().mockReturnValue("mock-txt-content"),
		generateCdrHash: vi
			.fn()
			.mockReturnValue(
				"abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
			),
		generateFileName: vi.fn().mockReturnValue({
			filename: "20123456786-202603-LE-DIARIO.txt",
			ruc: "20123456786",
			period: "2026-03",
			bookType: "LE-DIARIO",
		}),
	},
}));

vi.mock("@drenyra/persistence/schema", () => ({
	pleGenerations: {
		companyId: { name: "company_id" },
		bookType: { name: "book_type" },
		period: { name: "period" },
		id: { name: "id" },
		status: { name: "status" },
		fileContent: { name: "file_content" },
		fileSizeBytes: { name: "file_size_bytes" },
		cdrHash: { name: "cdr_hash" },
		validationErrors: { name: "validation_errors" },
		sunatResponse: { name: "sunat_response" },
		generatedBy: { name: "generated_by" },
		generatedAt: { name: "generated_at" },
		validatedAt: { name: "validated_at" },
		filedAt: { name: "filed_at" },
		createdAt: { name: "created_at" },
		updatedAt: { name: "updated_at" },
	},
}));

vi.mock("../../ple-validator.service", () => ({
	PleValidator: {
		validate: vi.fn(),
	},
}));

import { PleService } from "../../ple.service";
import { PleGeneratorService } from "../../ple-generator.service";
import { PleValidator } from "../../ple-validator.service";

// ─── Test data ─────────────────────────────────────────────────────

const validInput = {
	companyId: "test-company-id",
	period: "2026-03",
	bookType: "LE-DIARIO" as const,
	ruc: "20123456786",
};

function mockGenRow(overrides: Record<string, unknown> = {}) {
	return {
		id: "gen-001",
		companyId: validInput.companyId,
		bookType: "LE-DIARIO",
		period: "2026-03",
		ruc: "20123456786",
		status: "generated",
		fileContent: "mock-txt-content",
		fileSizeBytes: 16,
		cdrHash: null,
		validationErrors: null,
		sunatResponse: null,
		generatedBy: null,
		generatedAt: new Date("2026-03-15T00:00:00Z"),
		validatedAt: null,
		filedAt: null,
		createdAt: new Date("2026-03-15T00:00:00Z"),
		updatedAt: new Date("2026-03-15T00:00:00Z"),
		...overrides,
	};
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("PleService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("generateBook", () => {
		it("generates a PLE book and persists it", async () => {
			mockDb.insert.mockReturnValue(createInsertMock([mockGenRow()]));

			const result = await PleService.generateBook(validInput);

			expect(result).toBeDefined();
			expect(result.id).toBe("gen-001");
			expect(result.status).toBe("generated");
			expect(PleGeneratorService.generateBook).toHaveBeenCalled();
		});

		it("computes and stores CDR hash when enabled", async () => {
			mockDb.insert.mockReturnValue(
				createInsertMock([
					mockGenRow({
						cdrHash:
							"abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
					}),
				]),
			);

			const result = await PleService.generateBook({
				...validInput,
				computeCdr: true,
			});

			expect(result.cdrHash).toBeDefined();
			expect(result.cdrHash).toHaveLength(64);
		});

		it("does not compute CDR hash when not requested", async () => {
			mockDb.insert.mockReturnValue(
				createInsertMock([mockGenRow({ cdrHash: null })]),
			);

			await PleService.generateBook(validInput);

			expect(PleGeneratorService.generateCdrHash).not.toHaveBeenCalled();
		});
	});

	describe("getBook", () => {
		it("returns a generation by ID", async () => {
			mockDb.select.mockReturnValue(createSelectMock([mockGenRow()]));

			const result = await PleService.getBook("gen-001");

			expect(result).toBeDefined();
			expect(result?.id).toBe("gen-001");
		});

		it("returns null when book not found", async () => {
			mockDb.select.mockReturnValue(createSelectMock([]));

			const result = await PleService.getBook("nonexistent");

			expect(result).toBeNull();
		});
	});

	describe("listBooks", () => {
		it("returns generations for a company and period", async () => {
			mockDb.select.mockReturnValue(
				createSelectMock([
					mockGenRow({ id: "gen-001" }),
					mockGenRow({ id: "gen-002", bookType: "LE-MAYOR" }),
				]),
			);

			const result = await PleService.listBooks({
				companyId: validInput.companyId,
				period: "2026-03",
			});

			expect(result).toHaveLength(2);
		});

		it("returns empty array when no books found", async () => {
			mockDb.select.mockReturnValue(createSelectMock([]));

			const result = await PleService.listBooks({
				companyId: validInput.companyId,
				period: "2099-01",
			});

			expect(result).toHaveLength(0);
		});
	});

	describe("validateBook", () => {
		it("validates and returns valid result", async () => {
			mockDb.select.mockReturnValue(
				createSelectMock([
					mockGenRow({ fileContent: "valid\ncontent" }),
				]),
			);

			(PleValidator.validate as ReturnType<typeof vi.fn>).mockReturnValue({
				valid: true,
				errors: [],
				warnings: [],
			});

			mockDb.update.mockReturnValue(createUpdateMock([{ id: "gen-001" }]));

			const result = await PleService.validateBook("gen-001");

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("marks as validation_failed when content is invalid", async () => {
			mockDb.select.mockReturnValue(
				createSelectMock([
					mockGenRow({ id: "gen-002", fileContent: "" }),
				]),
			);

			(PleValidator.validate as ReturnType<typeof vi.fn>).mockReturnValue({
				valid: false,
				errors: [{ code: "EMPTY_CONTENT", message: "Empty" }],
				warnings: [],
			});

			mockDb.update.mockReturnValue(createUpdateMock([{ id: "gen-002" }]));

			const result = await PleService.validateBook("gen-002");

			expect(result.valid).toBe(false);
			expect(result.errors).toHaveLength(1);
		});

		it("throws when book not found", async () => {
			mockDb.select.mockReturnValue(createSelectMock([]));

			await expect(
				PleService.validateBook("nonexistent"),
			).rejects.toThrow(/not found/i);
		});
	});

	describe("generateCdrHash", () => {
		it("delegates to PleGeneratorService", () => {
			const hash = PleService.generateCdrHash("content");

			expect(hash).toHaveLength(64);
			expect(PleGeneratorService.generateCdrHash).toHaveBeenCalledWith(
				"content",
			);
		});
	});

	describe("generateFileName", () => {
		it("delegates to PleGeneratorService", () => {
			const result = PleService.generateFileName(
				"20123456786",
				"2026-03",
				"LE-DIARIO",
			);

			expect(result.filename).toBe("20123456786-202603-LE-DIARIO.txt");
			expect(PleGeneratorService.generateFileName).toHaveBeenCalledWith(
				"20123456786",
				"2026-03",
				"LE-DIARIO",
			);
		});
	});
});
