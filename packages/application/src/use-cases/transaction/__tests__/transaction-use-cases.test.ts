/**
 * Transaction Use Cases Tests
 *
 * Unit tests for ListTransactionsUseCase, GetTransactionUseCase, and DeleteTransactionUseCase
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	Transaction,
	type TransactionEntry,
} from "@arkelythex/domain/entities/Transaction";
import type {
	PaginatedResult,
	TransactionRepository,
} from "@arkelythex/domain/repositories/transaction.repository";
import { Money } from "@arkelythex/domain/value-objects/Money";
import { DeleteTransactionUseCase } from "../delete-transaction.use-case";
import { GetTransactionUseCase } from "../get-transaction.use-case";
import { ListTransactionsUseCase } from "../list-transactions.use-case";

// Helper to create a mock transaction
function createMockTransaction(
	overrides: Partial<{
		id: string;
		status: "DRAFT" | "POSTED" | "VOIDED";
	}> = {},
): Transaction {
	const currency = "PEN" as const;
	const entries: TransactionEntry[] = [
		{
			id: "e1",
			accountCode: "1041",
			accountName: "Caja",
			debit: Money.fromAmount(100, currency),
			credit: Money.zero(currency),
		},
		{
			id: "e2",
			accountCode: "7011",
			accountName: "Ventas",
			debit: Money.zero(currency),
			credit: Money.fromAmount(100, currency),
		},
	];

	return Transaction.create({
		id: overrides.id || "1",
		type: "SALE",
		date: new Date("2025-01-01"),
		description: "Test Transaction",
		referenceNumber: "F001-00000001",
		entries,
		status: overrides.status || "DRAFT",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}

// Mock repository
function createMockRepository(): TransactionRepository {
	return {
		save: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		findById: vi.fn(),
		findByReferenceNumber: vi.fn(),
		findAll: vi.fn(),
		findByAccount: vi.fn(),
		count: vi.fn(),
		getNextReferenceNumber: vi.fn(),
	};
}

describe("ListTransactionsUseCase", () => {
	let useCase: ListTransactionsUseCase;
	let mockRepository: ReturnType<typeof createMockRepository>;

	beforeEach(() => {
		mockRepository = createMockRepository();
		useCase = new ListTransactionsUseCase(mockRepository);
	});

	it("should list transactions successfully", async () => {
		const mockPaginatedResult: PaginatedResult<Transaction> = {
			data: [
				createMockTransaction({ id: "1" }),
				createMockTransaction({ id: "2" }),
			],
			total: 2,
			page: 1,
			limit: 20,
			totalPages: 1,
		};

		mockRepository.findAll = vi.fn().mockResolvedValue(mockPaginatedResult);

		const result = await useCase.execute({
			organizationId: 1,
		});

		expect(result.success).toBe(true);
		expect(result.data?.data).toHaveLength(2);
		expect(result.data?.total).toBe(2);
		expect(mockRepository.findAll).toHaveBeenCalledWith(1, undefined, {
			page: 1,
			limit: 20,
		});
	});

	it("should apply filters when provided", async () => {
		const mockPaginatedResult: PaginatedResult<Transaction> = {
			data: [],
			total: 0,
			page: 1,
			limit: 10,
			totalPages: 0,
		};

		mockRepository.findAll = vi.fn().mockResolvedValue(mockPaginatedResult);

		const filters = {
			status: "DRAFT" as const,
			dateFrom: new Date("2025-01-01"),
			dateTo: new Date("2025-12-31"),
		};

		await useCase.execute({
			organizationId: 1,
			filters,
			pagination: { page: 1, limit: 10 },
		});

		expect(mockRepository.findAll).toHaveBeenCalledWith(1, filters, {
			page: 1,
			limit: 10,
		});
	});

	it("should limit max items per page to 100", async () => {
		const mockPaginatedResult: PaginatedResult<Transaction> = {
			data: [],
			total: 0,
			page: 1,
			limit: 100,
			totalPages: 0,
		};

		mockRepository.findAll = vi.fn().mockResolvedValue(mockPaginatedResult);

		await useCase.execute({
			organizationId: 1,
			pagination: { page: 1, limit: 500 }, // Requesting 500, should be capped at 100
		});

		expect(mockRepository.findAll).toHaveBeenCalledWith(1, undefined, {
			page: 1,
			limit: 100,
		});
	});

	it("should return error for invalid organization ID", async () => {
		const result = await useCase.execute({
			organizationId: 0,
		});

		expect(result.success).toBe(false);
		expect(result.error).toBe("ID de organización inválido");
	});
});

describe("GetTransactionUseCase", () => {
	let useCase: GetTransactionUseCase;
	let mockRepository: ReturnType<typeof createMockRepository>;

	beforeEach(() => {
		mockRepository = createMockRepository();
		useCase = new GetTransactionUseCase(mockRepository);
	});

	it("should get transaction by ID successfully", async () => {
		const mockTransaction = createMockTransaction({ id: "123" });
		mockRepository.findById = vi.fn().mockResolvedValue(mockTransaction);

		const result = await useCase.execute({
			id: "123",
			organizationId: 1,
		});

		expect(result.success).toBe(true);
		expect(result.data?.id).toBe("123");
		expect(mockRepository.findById).toHaveBeenCalledWith("123", 1);
	});

	it("should return error when transaction not found", async () => {
		mockRepository.findById = vi.fn().mockResolvedValue(null);

		const result = await useCase.execute({
			id: "999",
			organizationId: 1,
		});

		expect(result.success).toBe(false);
		expect(result.error).toBe("Transacción 999 no encontrada");
	});

	it("should return error for empty ID", async () => {
		const result = await useCase.execute({
			id: "",
			organizationId: 1,
		});

		expect(result.success).toBe(false);
		expect(result.error).toBe("ID de transacción requerido");
	});

	it("should return error for invalid organization ID", async () => {
		const result = await useCase.execute({
			id: "123",
			organizationId: -1,
		});

		expect(result.success).toBe(false);
		expect(result.error).toBe("ID de organización inválido");
	});
});

describe("DeleteTransactionUseCase", () => {
	let useCase: DeleteTransactionUseCase;
	let mockRepository: ReturnType<typeof createMockRepository>;

	beforeEach(() => {
		mockRepository = createMockRepository();
		useCase = new DeleteTransactionUseCase(mockRepository);
	});

	it("should delete DRAFT transaction successfully", async () => {
		const draftTransaction = createMockTransaction({
			id: "123",
			status: "DRAFT",
		});
		mockRepository.findById = vi.fn().mockResolvedValue(draftTransaction);
		mockRepository.delete = vi.fn().mockResolvedValue(undefined);

		const result = await useCase.execute({
			id: "123",
			organizationId: 1,
			userId: "user-1",
		});

		expect(result.success).toBe(true);
		expect(mockRepository.delete).toHaveBeenCalledWith("123", 1);
	});

	it("should NOT allow deleting POSTED transaction", async () => {
		const postedTransaction = createMockTransaction({
			id: "123",
			status: "POSTED",
		});
		mockRepository.findById = vi.fn().mockResolvedValue(postedTransaction);

		const result = await useCase.execute({
			id: "123",
			organizationId: 1,
			userId: "user-1",
		});

		expect(result.success).toBe(false);
		expect(result.error).toContain(
			"No se puede eliminar una transacción contabilizada",
		);
		expect(mockRepository.delete).not.toHaveBeenCalled();
	});

	it("should return error when transaction not found", async () => {
		mockRepository.findById = vi.fn().mockResolvedValue(null);

		const result = await useCase.execute({
			id: "999",
			organizationId: 1,
			userId: "user-1",
		});

		expect(result.success).toBe(false);
		expect(result.error).toBe("Transacción 999 no encontrada");
	});

	it("should require userId", async () => {
		const result = await useCase.execute({
			id: "123",
			organizationId: 1,
			userId: "",
		});

		expect(result.success).toBe(false);
		expect(result.error).toBe("Usuario no autenticado");
	});
});
