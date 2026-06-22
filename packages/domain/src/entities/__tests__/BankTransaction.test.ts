import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";
import {
	BankTransaction,
	type BankTransactionProps,
	type BankTransactionType,
} from "../BankTransaction";

describe("BankTransaction Entity", () => {
	const validProps: BankTransactionProps = {
		id: 1,
		bankAccountId: 100,
		transactionDate: new Date("2024-01-15"),
		description: "Depósito inicial",
		reference: "DEP-001",
		type: "DEPOSIT",
		amount: Money.fromAmount(1000, "PEN"),
		balanceAfter: Money.fromAmount(1000, "PEN"),
		isReconciled: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	describe("create", () => {
		it("should create a valid bank transaction from existing data", () => {
			const transaction = BankTransaction.create(validProps);

			expect(transaction.id).toBe(1);
			expect(transaction.bankAccountId).toBe(100);
			expect(transaction.description).toBe("Depósito inicial");
			expect(transaction.type).toBe("DEPOSIT");
			expect(transaction.amount.getAmount()).toBe(1000);
			expect(transaction.isReconciled).toBe(false);
		});

		it("should create transaction with all optional fields", () => {
			const propsWithOptionals: BankTransactionProps = {
				...validProps,
				reference: "REF-123",
				balanceAfter: Money.fromAmount(5000, "PEN"),
				reconciledAt: new Date(),
				reconciliationId: 50,
				journalEntryId: "je-001",
				importBatch: "batch-2024-01",
			};

			const transaction = BankTransaction.create(propsWithOptionals);

			expect(transaction.reference).toBe("REF-123");
			expect(transaction.balanceAfter?.getAmount()).toBe(5000);
			expect(transaction.reconciliationId).toBe(50);
			expect(transaction.journalEntryId).toBe("je-001");
			expect(transaction.importBatch).toBe("batch-2024-01");
		});
	});

	describe("createNew", () => {
		it("should create a new bank transaction with defaults", () => {
			const transaction = BankTransaction.createNew({
				bankAccountId: 100,
				transactionDate: new Date("2024-01-15"),
				description: "Nueva transacción",
				type: "WITHDRAWAL",
				amount: Money.fromAmount(500, "PEN"),
			});

			expect(transaction.id).toBe(0); // Default for new
			expect(transaction.bankAccountId).toBe(100);
			expect(transaction.description).toBe("Nueva transacción");
			expect(transaction.type).toBe("WITHDRAWAL");
			expect(transaction.isReconciled).toBe(false);
			expect(transaction.createdAt).toBeDefined();
			expect(transaction.updatedAt).toBeDefined();
		});

		it("should create new transaction with optional fields", () => {
			const transaction = BankTransaction.createNew({
				bankAccountId: 100,
				transactionDate: new Date("2024-01-15"),
				description: "Con opcionales",
				type: "DEPOSIT",
				amount: Money.fromAmount(1000, "PEN"),
				reference: "REF-123",
				balanceAfter: Money.fromAmount(2000, "PEN"),
				importBatch: "batch-001",
			});

			expect(transaction.reference).toBe("REF-123");
			expect(transaction.balanceAfter?.getAmount()).toBe(2000);
			expect(transaction.importBatch).toBe("batch-001");
		});
	});

	describe("Business Rule Validation", () => {
		it("should throw error when bank account ID is missing", () => {
			expect(() =>
				BankTransaction.create({
					...validProps,
					bankAccountId: 0,
				}),
			).toThrow("La cuenta bancaria es requerida");
		});

		it("should throw error when transaction date is missing", () => {
			expect(() =>
				BankTransaction.create({
					...validProps,
					transactionDate: null as unknown as Date,
				}),
			).toThrow("La fecha de transacción es requerida");
		});

		it("should throw error when transaction date is in the future", () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 10);

			expect(() =>
				BankTransaction.create({
					...validProps,
					transactionDate: futureDate,
				}),
			).toThrow("La fecha de transacción no puede ser futura");
		});

		it("should throw error when description is empty", () => {
			expect(() =>
				BankTransaction.create({
					...validProps,
					description: "",
				}),
			).toThrow("La descripción es requerida");
		});

		it("should throw error when description is whitespace only", () => {
			expect(() =>
				BankTransaction.create({
					...validProps,
					description: "   ",
				}),
			).toThrow("La descripción es requerida");
		});

		it("should throw error when amount is zero", () => {
			expect(() =>
				BankTransaction.create({
					...validProps,
					amount: Money.zero("PEN"),
				}),
			).toThrow("El monto no puede ser cero");
		});
	});

	describe("Transaction Types", () => {
		const transactionTypes: BankTransactionType[] = [
			"DEPOSIT",
			"WITHDRAWAL",
			"TRANSFER_IN",
			"TRANSFER_OUT",
			"FEE",
			"INTEREST",
			"CHECK",
			"OTHER",
		];

		transactionTypes.forEach((type) => {
			it(`should accept transaction type: ${type}`, () => {
				const transaction = BankTransaction.create({
					...validProps,
					type,
				});

				expect(transaction.type).toBe(type);
			});
		});
	});

	describe("reconcile", () => {
		it("should reconcile a non-reconciled transaction", () => {
			const transaction = BankTransaction.create(validProps);
			const reconciled = transaction.reconcile(10);

			expect(reconciled.isReconciled).toBe(true);
			expect(reconciled.reconciliationId).toBe(10);
			expect(reconciled.reconciledAt).toBeDefined();
		});

		it("should reconcile with journal entry ID", () => {
			const transaction = BankTransaction.create(validProps);
			const reconciled = transaction.reconcile(10, "je-001");

			expect(reconciled.journalEntryId).toBe("je-001");
		});

		it("should throw error when trying to reconcile already reconciled transaction", () => {
			const reconciledProps: BankTransactionProps = {
				...validProps,
				isReconciled: true,
				reconciledAt: new Date(),
				reconciliationId: 5,
			};

			const transaction = BankTransaction.create(reconciledProps);

			expect(() => transaction.reconcile(10)).toThrow(
				"La transacción ya está conciliada",
			);
		});

		it("should return a new instance (immutability)", () => {
			const transaction = BankTransaction.create(validProps);
			const reconciled = transaction.reconcile(10);

			expect(reconciled).not.toBe(transaction);
			expect(transaction.isReconciled).toBe(false);
			expect(reconciled.isReconciled).toBe(true);
		});
	});

	describe("unreconcile", () => {
		it("should unreconcile a reconciled transaction", () => {
			const reconciledProps: BankTransactionProps = {
				...validProps,
				isReconciled: true,
				reconciledAt: new Date(),
				reconciliationId: 5,
				journalEntryId: "je-001",
			};

			const transaction = BankTransaction.create(reconciledProps);
			const unreconciled = transaction.unreconcile();

			expect(unreconciled.isReconciled).toBe(false);
			expect(unreconciled.reconciledAt).toBeUndefined();
			expect(unreconciled.reconciliationId).toBeUndefined();
			expect(unreconciled.journalEntryId).toBeUndefined();
		});

		it("should throw error when trying to unreconcile non-reconciled transaction", () => {
			const transaction = BankTransaction.create(validProps);

			expect(() => transaction.unreconcile()).toThrow(
				"La transacción no está conciliada",
			);
		});
	});

	describe("isInflow", () => {
		it("should return true for DEPOSIT", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "DEPOSIT",
			});
			expect(transaction.isInflow()).toBe(true);
		});

		it("should return true for TRANSFER_IN", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "TRANSFER_IN",
			});
			expect(transaction.isInflow()).toBe(true);
		});

		it("should return true for INTEREST", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "INTEREST",
			});
			expect(transaction.isInflow()).toBe(true);
		});

		it("should return false for WITHDRAWAL", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "WITHDRAWAL",
			});
			expect(transaction.isInflow()).toBe(false);
		});

		it("should return false for FEE", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "FEE",
			});
			expect(transaction.isInflow()).toBe(false);
		});
	});

	describe("isOutflow", () => {
		it("should return true for WITHDRAWAL", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "WITHDRAWAL",
			});
			expect(transaction.isOutflow()).toBe(true);
		});

		it("should return true for TRANSFER_OUT", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "TRANSFER_OUT",
			});
			expect(transaction.isOutflow()).toBe(true);
		});

		it("should return true for FEE", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "FEE",
			});
			expect(transaction.isOutflow()).toBe(true);
		});

		it("should return true for CHECK", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "CHECK",
			});
			expect(transaction.isOutflow()).toBe(true);
		});

		it("should return false for DEPOSIT", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "DEPOSIT",
			});
			expect(transaction.isOutflow()).toBe(false);
		});
	});

	describe("getSignedAmount", () => {
		it("should return positive amount for inflows", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "DEPOSIT",
			});
			expect(transaction.getSignedAmount()).toBe(1000);
		});

		it("should return negative amount for outflows", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "WITHDRAWAL",
			});
			expect(transaction.getSignedAmount()).toBe(-1000);
		});

		it("should return positive for INTEREST", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "INTEREST",
				amount: Money.fromAmount(50, "PEN"),
			});
			expect(transaction.getSignedAmount()).toBe(50);
		});

		it("should return negative for FEE", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "FEE",
				amount: Money.fromAmount(10, "PEN"),
			});
			expect(transaction.getSignedAmount()).toBe(-10);
		});
	});

	describe("canBeModified", () => {
		it("should return true for non-reconciled transaction", () => {
			const transaction = BankTransaction.create(validProps);
			expect(transaction.canBeModified()).toBe(true);
		});

		it("should return false for reconciled transaction", () => {
			const reconciledProps: BankTransactionProps = {
				...validProps,
				isReconciled: true,
			};
			const transaction = BankTransaction.create(reconciledProps);
			expect(transaction.canBeModified()).toBe(false);
		});
	});

	describe("equals", () => {
		it("should return true for transactions with same ID", () => {
			const transaction1 = BankTransaction.create(validProps);
			const transaction2 = BankTransaction.create(validProps);

			expect(transaction1.equals(transaction2)).toBe(true);
		});

		it("should return false for transactions with different IDs", () => {
			const transaction1 = BankTransaction.create(validProps);
			const transaction2 = BankTransaction.create({ ...validProps, id: 999 });

			expect(transaction1.equals(transaction2)).toBe(false);
		});

		it("should return false for null", () => {
			const transaction = BankTransaction.create(validProps);
			expect(transaction.equals(null)).toBe(false);
		});

		it("should return false for undefined", () => {
			const transaction = BankTransaction.create(validProps);
			expect(transaction.equals(undefined)).toBe(false);
		});
	});

	describe("toJSON", () => {
		it("should serialize to JSON correctly", () => {
			const transaction = BankTransaction.create(validProps);
			const json = transaction.toJSON();

			expect(json.id).toBe(1);
			expect(json.bankAccountId).toBe(100);
			expect(json.description).toBe("Depósito inicial");
			expect(json.type).toBe("DEPOSIT");
			expect(json.isReconciled).toBe(false);
			expect(typeof json.transactionDate).toBe("string");
			expect(typeof json.createdAt).toBe("string");
			expect(typeof json.updatedAt).toBe("string");
		});

		it("should serialize amount as Money JSON", () => {
			const transaction = BankTransaction.create(validProps);
			const json = transaction.toJSON();

			expect(json.amount).toEqual({
				amount: 1000,
				cents: 100000,
				currency: "PEN",
			});
		});

		it("should handle optional fields in JSON", () => {
			const propsWithOptionals: BankTransactionProps = {
				...validProps,
				reconciledAt: new Date("2024-01-20"),
				reconciliationId: 10,
				journalEntryId: "je-001",
				importBatch: "batch-001",
			};

			const transaction = BankTransaction.create(propsWithOptionals);
			const json = transaction.toJSON();

			expect(json.reconciliationId).toBe(10);
			expect(json.journalEntryId).toBe("je-001");
			expect(json.importBatch).toBe("batch-001");
			expect(typeof json.reconciledAt).toBe("string");
		});

		it("should handle undefined optional fields in JSON", () => {
			const transaction = BankTransaction.create(validProps);
			const json = transaction.toJSON();

			expect(json.reconciledAt).toBeUndefined();
			expect(json.reconciliationId).toBeUndefined();
			expect(json.journalEntryId).toBeUndefined();
		});
	});

	describe("Edge Cases", () => {
		it("should handle very large amounts", () => {
			const transaction = BankTransaction.create({
				...validProps,
				amount: Money.fromAmount(999999999.99, "PEN"),
			});

			expect(transaction.amount.getAmount()).toBe(999999999.99);
		});

		it("should handle small decimal amounts", () => {
			const transaction = BankTransaction.create({
				...validProps,
				amount: Money.fromAmount(0.01, "PEN"),
			});

			expect(transaction.amount.getAmount()).toBe(0.01);
		});

		it("should handle USD currency", () => {
			const transaction = BankTransaction.create({
				...validProps,
				amount: Money.fromAmount(100, "USD"),
			});

			expect(transaction.amount.getCurrency()).toBe("USD");
		});

		it("should handle transaction without reference", () => {
			const propsWithoutRef: BankTransactionProps = {
				...validProps,
				reference: undefined,
			};

			const transaction = BankTransaction.create(propsWithoutRef);
			expect(transaction.reference).toBeUndefined();
		});

		it("should handle OTHER transaction type", () => {
			const transaction = BankTransaction.create({
				...validProps,
				type: "OTHER",
			});

			// OTHER is neither explicitly inflow nor outflow
			expect(transaction.isInflow()).toBe(false);
			expect(transaction.isOutflow()).toBe(false);
		});

		it("should accept transaction on current date (today)", () => {
			const today = new Date();
			today.setHours(12, 0, 0, 0);

			const transaction = BankTransaction.create({
				...validProps,
				transactionDate: today,
			});

			expect(transaction.transactionDate).toEqual(today);
		});
	});
});
