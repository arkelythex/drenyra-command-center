/**
 * Import Bank Transactions Use Case Tests
 */

import { BankAccount } from "@drenyra/domain/entities/BankAccount";
import { BankTransaction } from "@drenyra/domain/entities/BankTransaction";
import type { BankAccountRepository } from "@drenyra/domain/repositories/bank-account.repository";
import type { BankTransactionRepository } from "@drenyra/domain/repositories/bank-transaction.repository";
import { Money } from "@drenyra/domain/value-objects/Money";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ImportBankTransactionsUseCase,
	type ImportTransactionRow,
	parseCsvToImportRows,
} from "../import-bank-transactions.use-case";

describe("ImportBankTransactionsUseCase", () => {
	let useCase: ImportBankTransactionsUseCase;
	let mockTransactionRepo: BankTransactionRepository;
	let mockBankAccountRepo: BankAccountRepository;

	const mockBankAccount = BankAccount.create({
		id: 1,
		organizationId: 100,
		bankName: "BCP",
		accountNumber: "123-456-789",
		accountType: "corriente",
		currency: "PEN",
		initialBalance: Money.fromAmount(0, "PEN"),
		currentBalance: Money.fromAmount(5000, "PEN"),
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		mockTransactionRepo = {
			save: vi.fn().mockImplementation(async (tx) => tx),
			saveMany: vi.fn().mockImplementation(async (txs) => txs),
			update: vi.fn(),
			findById: vi.fn(),
			findByBankAccount: vi.fn().mockResolvedValue({
				data: [],
				total: 0,
				page: 1,
				limit: 50,
				totalPages: 0,
			}),
			findUnreconciled: vi.fn(),
			findByImportBatch: vi.fn(),
			count: vi.fn(),
			getSumByType: vi.fn(),
			delete: vi.fn(),
			deleteByImportBatch: vi.fn(),
			markAsReconciled: vi.fn(),
			unmarkReconciled: vi.fn(),
		};

		mockBankAccountRepo = {
			save: vi.fn(),
			update: vi.fn(),
			findById: vi.fn().mockResolvedValue(mockBankAccount),
			findByOrganization: vi.fn(),
			findByAccountNumber: vi.fn(),
			findDetraccionesAccount: vi.fn(),
			count: vi.fn(),
			getTotalBalancesByCurrency: vi.fn(),
			delete: vi.fn(),
		};

		useCase = new ImportBankTransactionsUseCase(
			mockTransactionRepo,
			mockBankAccountRepo,
		);
	});

	describe("execute", () => {
		it("should import valid transactions", async () => {
			const transactions: ImportTransactionRow[] = [
				{ date: "15/01/2024", description: "DEPOSITO EFECTIVO", amount: 1000 },
				{ date: "16/01/2024", description: "PAGO PROVEEDOR", amount: -500 },
				{
					date: "17/01/2024",
					description: "TRANSFERENCIA RECIBIDA",
					amount: 2000,
				},
			];

			const result = await useCase.execute({
				organizationId: 100,
				bankAccountId: 1,
				transactions,
			});

			expect(result.success).toBe(true);
			expect(result.importedCount).toBe(3);
			expect(result.errors).toHaveLength(0);
			expect(mockTransactionRepo.saveMany).toHaveBeenCalledTimes(1);
		});

		it("should reject non-existent bank account", async () => {
			vi.mocked(mockBankAccountRepo.findById).mockResolvedValue(null);

			const result = await useCase.execute({
				organizationId: 100,
				bankAccountId: 999,
				transactions: [
					{ date: "15/01/2024", description: "TEST", amount: 100 },
				],
			});

			expect(result.success).toBe(false);
			expect(result.errors[0]?.message).toContain("no encontrada");
		});

		it("should skip invalid rows and continue", async () => {
			const transactions: ImportTransactionRow[] = [
				{ date: "15/01/2024", description: "VALID", amount: 1000 },
				{ date: "invalid-date", description: "INVALID DATE", amount: 500 },
				{ date: "17/01/2024", description: "", amount: 300 }, // Empty description
				{ date: "18/01/2024", description: "VALID TOO", amount: 200 },
			];

			const result = await useCase.execute({
				organizationId: 100,
				bankAccountId: 1,
				transactions,
			});

			expect(result.success).toBe(false); // Has errors
			expect(result.importedCount).toBe(2); // 2 valid
			expect(result.errors).toHaveLength(2); // 2 invalid
		});

		it("should skip zero amount transactions", async () => {
			const transactions: ImportTransactionRow[] = [
				{ date: "15/01/2024", description: "ZERO AMOUNT", amount: 0 },
			];

			const result = await useCase.execute({
				organizationId: 100,
				bankAccountId: 1,
				transactions,
			});

			expect(result.importedCount).toBe(0);
			expect(result.errors[0]?.message).toContain("Monto inválido");
		});

		it("should detect duplicates when skipDuplicates is true", async () => {
			// Mock existing transactions
			const existingTx = BankTransaction.createNew({
				bankAccountId: 1,
				transactionDate: new Date("2024-01-15"),
				description: "EXISTING TRANSACTION",
				type: "DEPOSIT",
				amount: Money.fromAmount(1000, "PEN"),
			});

			vi.mocked(mockTransactionRepo.findByBankAccount).mockResolvedValue({
				data: [existingTx],
				total: 1,
				page: 1,
				limit: 50,
				totalPages: 1,
			});

			const transactions: ImportTransactionRow[] = [
				{
					date: "15/01/2024",
					description: "EXISTING TRANSACTION",
					amount: 1000,
				}, // Duplicate
				{ date: "16/01/2024", description: "NEW TRANSACTION", amount: 500 },
			];

			const result = await useCase.execute({
				organizationId: 100,
				bankAccountId: 1,
				transactions,
				skipDuplicates: true,
			});

			expect(result.importedCount).toBe(1);
			expect(result.skippedDuplicates).toBe(1);
		});

		it("should generate batch ID", async () => {
			const transactions: ImportTransactionRow[] = [
				{ date: "15/01/2024", description: "TEST", amount: 100 },
			];

			const result = await useCase.execute({
				organizationId: 100,
				bankAccountId: 1,
				transactions,
			});

			expect(result.batchId).toBeDefined();
			expect(result.batchId).toMatch(/^IMP-\d{14}-[a-z0-9]+$/);
		});

		it("should use custom batch name", async () => {
			const transactions: ImportTransactionRow[] = [
				{ date: "15/01/2024", description: "TEST", amount: 100 },
			];

			const result = await useCase.execute({
				organizationId: 100,
				bankAccountId: 1,
				transactions,
				importBatchName: "CUSTOM-BATCH-001",
			});

			expect(result.batchId).toBe("CUSTOM-BATCH-001");
		});

		it("should infer transaction type from amount sign", async () => {
			const transactions: ImportTransactionRow[] = [
				{ date: "15/01/2024", description: "INCOME", amount: 1000 }, // Positive = DEPOSIT
				{ date: "16/01/2024", description: "EXPENSE", amount: -500 }, // Negative = WITHDRAWAL
			];

			const result = await useCase.execute({
				organizationId: 100,
				bankAccountId: 1,
				transactions,
			});

			expect(result.importedCount).toBe(2);

			const savedTxs = vi.mocked(mockTransactionRepo.saveMany).mock
				.calls[0]?.[0];
			expect(savedTxs?.[0]?.type).toBe("DEPOSIT");
			expect(savedTxs?.[1]?.type).toBe("WITHDRAWAL");
		});
	});

	describe("Date Parsing", () => {
		it("should parse DD/MM/YYYY format", async () => {
			const transactions: ImportTransactionRow[] = [
				{ date: "25/12/2024", description: "NAVIDAD", amount: 100 },
			];

			const result = await useCase.execute({
				organizationId: 100,
				bankAccountId: 1,
				transactions,
			});

			expect(result.importedCount).toBe(1);

			const savedTxs = vi.mocked(mockTransactionRepo.saveMany).mock
				.calls[0]?.[0];
			const savedDate = savedTxs?.[0]?.transactionDate;
			expect(savedDate?.getDate()).toBe(25);
			expect(savedDate?.getMonth()).toBe(11); // December = 11
			expect(savedDate?.getFullYear()).toBe(2024);
		});

		it("should parse YYYY-MM-DD format", async () => {
			const transactions: ImportTransactionRow[] = [
				{ date: "2024-12-25", description: "NAVIDAD", amount: 100 },
			];

			const result = await useCase.execute({
				organizationId: 100,
				bankAccountId: 1,
				transactions,
			});

			expect(result.importedCount).toBe(1);
		});

		it("should accept Date objects", async () => {
			const transactions: ImportTransactionRow[] = [
				{
					date: new Date("2024-01-15"),
					description: "DATE OBJECT",
					amount: 100,
				},
			];

			const result = await useCase.execute({
				organizationId: 100,
				bankAccountId: 1,
				transactions,
			});

			expect(result.importedCount).toBe(1);
		});
	});
});

describe("parseCsvToImportRows", () => {
	it("should parse basic CSV", () => {
		const csv = `15/01/2024,DEPOSITO,1000.00
16/01/2024,RETIRO,-500.00`;

		const rows = parseCsvToImportRows(csv, {
			dateColumn: 0,
			descriptionColumn: 1,
			amountColumn: 2,
		});

		expect(rows).toHaveLength(2);
		expect(rows[0]?.description).toBe("DEPOSITO");
		expect(rows[0]?.amount).toBe(1000);
		expect(rows[1]?.amount).toBe(-500);
	});

	it("should skip header row", () => {
		const csv = `Fecha,Descripcion,Monto
15/01/2024,DEPOSITO,1000.00`;

		const rows = parseCsvToImportRows(
			csv,
			{
				dateColumn: 0,
				descriptionColumn: 1,
				amountColumn: 2,
			},
			{ skipHeader: true },
		);

		expect(rows).toHaveLength(1);
		expect(rows[0]?.description).toBe("DEPOSITO");
	});

	it("should handle quoted values", () => {
		const csv = `15/01/2024,"PAGO A PROVEEDOR, S.A.C.","1,500.00"`;

		const rows = parseCsvToImportRows(csv, {
			dateColumn: 0,
			descriptionColumn: 1,
			amountColumn: 2,
		});

		expect(rows).toHaveLength(1);
		expect(rows[0]?.description).toBe("PAGO A PROVEEDOR, S.A.C.");
		expect(rows[0]?.amount).toBe(1500);
	});

	it("should handle semicolon delimiter", () => {
		const csv = `15/01/2024;DEPOSITO;1000.00`;

		const rows = parseCsvToImportRows(
			csv,
			{
				dateColumn: 0,
				descriptionColumn: 1,
				amountColumn: 2,
			},
			{ delimiter: ";" },
		);

		expect(rows).toHaveLength(1);
	});

	it("should include reference column", () => {
		const csv = `15/01/2024,DEPOSITO,1000.00,REF-001`;

		const rows = parseCsvToImportRows(csv, {
			dateColumn: 0,
			descriptionColumn: 1,
			amountColumn: 2,
			referenceColumn: 3,
		});

		expect(rows[0]?.reference).toBe("REF-001");
	});

	it("should include balance column", () => {
		const csv = `15/01/2024,DEPOSITO,1000.00,5000.00`;

		const rows = parseCsvToImportRows(csv, {
			dateColumn: 0,
			descriptionColumn: 1,
			amountColumn: 2,
			balanceColumn: 3,
		});

		expect(rows[0]?.balance).toBe(5000);
	});
});
