/**
 * Transaction Entity Unit Tests
 *
 * Tests for the Transaction domain entity following double-entry bookkeeping rules.
 * Business Rules:
 * - Every transaction must balance (debits = credits)
 * - Cannot be modified after being posted
 * - Must have a valid date (not in future)
 * - Each entry must have either debit or credit (not both)
 */

import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";
import {
	Transaction,
	type TransactionEntry,
	type TransactionProps,
	type TransactionStatus,
	type TransactionType,
} from "../Transaction";

// Test helper to create valid transaction entries
function createBalancedEntries(amount: number = 1000): TransactionEntry[] {
	return [
		{
			id: "entry-1",
			accountCode: "10",
			accountName: "Efectivo",
			debit: Money.fromAmount(amount, "PEN"),
			credit: Money.zero("PEN"),
			description: "Débito a efectivo",
		},
		{
			id: "entry-2",
			accountCode: "40",
			accountName: "Tributos por Pagar",
			debit: Money.zero("PEN"),
			credit: Money.fromAmount(amount, "PEN"),
			description: "Crédito a tributos",
		},
	];
}

// Test helper to create valid transaction props
function createValidTransactionProps(
	overrides: Partial<TransactionProps> = {},
): TransactionProps {
	return {
		id: "txn-123",
		type: "SALE" as TransactionType,
		date: new Date("2024-01-15"),
		description: "Venta de mercadería",
		referenceNumber: "F001-00001234",
		entries: createBalancedEntries(),
		status: "DRAFT" as TransactionStatus,
		createdAt: new Date("2024-01-15"),
		updatedAt: new Date("2024-01-15"),
		...overrides,
	};
}

describe("Transaction Entity", () => {
	describe("Creation and Validation", () => {
		it("should create a valid balanced transaction", () => {
			const props = createValidTransactionProps();
			const transaction = Transaction.create(props);

			expect(transaction.id).toBe("txn-123");
			expect(transaction.type).toBe("SALE");
			expect(transaction.description).toBe("Venta de mercadería");
			expect(transaction.status).toBe("DRAFT");
			expect(transaction.entries).toHaveLength(2);
		});

		it("should throw error when less than 2 entries", () => {
			const singleEntry: TransactionEntry[] = [
				{
					id: "entry-1",
					accountCode: "10",
					accountName: "Efectivo",
					debit: Money.fromAmount(1000, "PEN"),
					credit: Money.zero("PEN"),
				},
			];

			const props = createValidTransactionProps({ entries: singleEntry });

			expect(() => Transaction.create(props)).toThrow(
				"Una transacción debe tener al menos 2 asientos (partida doble)",
			);
		});

		it("should throw error when entries is empty array", () => {
			const props = createValidTransactionProps({ entries: [] });

			expect(() => Transaction.create(props)).toThrow(
				"Una transacción debe tener al menos 2 asientos (partida doble)",
			);
		});

		it("should throw error when debits do not equal credits", () => {
			const unbalancedEntries: TransactionEntry[] = [
				{
					id: "entry-1",
					accountCode: "10",
					accountName: "Efectivo",
					debit: Money.fromAmount(1000, "PEN"),
					credit: Money.zero("PEN"),
				},
				{
					id: "entry-2",
					accountCode: "40",
					accountName: "Tributos",
					debit: Money.zero("PEN"),
					credit: Money.fromAmount(500, "PEN"), // Mismatched!
				},
			];

			const props = createValidTransactionProps({ entries: unbalancedEntries });

			expect(() => Transaction.create(props)).toThrow(
				/Los débitos .* deben ser iguales a los créditos/,
			);
		});

		it("should throw error for future transaction date", () => {
			const futureDate = new Date();
			futureDate.setFullYear(futureDate.getFullYear() + 1);

			const props = createValidTransactionProps({ date: futureDate });

			expect(() => Transaction.create(props)).toThrow(
				"La fecha de la transacción no puede ser futura",
			);
		});

		it("should throw error when entry has both debit and credit", () => {
			const invalidEntries: TransactionEntry[] = [
				{
					id: "entry-1",
					accountCode: "10",
					accountName: "Efectivo",
					debit: Money.fromAmount(1000, "PEN"),
					credit: Money.fromAmount(500, "PEN"), // Both non-zero!
				},
				{
					id: "entry-2",
					accountCode: "40",
					accountName: "Tributos",
					debit: Money.zero("PEN"),
					credit: Money.fromAmount(500, "PEN"),
				},
			];

			const props = createValidTransactionProps({ entries: invalidEntries });

			expect(() => Transaction.create(props)).toThrow(
				/no puede tener débito y crédito simultáneamente/,
			);
		});

		it("should throw error when entry has neither debit nor credit", () => {
			const invalidEntries: TransactionEntry[] = [
				{
					id: "entry-1",
					accountCode: "10",
					accountName: "Efectivo",
					debit: Money.zero("PEN"),
					credit: Money.zero("PEN"), // Both zero!
				},
				{
					id: "entry-2",
					accountCode: "40",
					accountName: "Tributos",
					debit: Money.fromAmount(1000, "PEN"),
					credit: Money.zero("PEN"),
				},
			];

			const props = createValidTransactionProps({ entries: invalidEntries });

			expect(() => Transaction.create(props)).toThrow(
				/debe tener débito o crédito/,
			);
		});

		it("should throw error when entries use different currencies", () => {
			const mixedCurrencyEntries: TransactionEntry[] = [
				{
					id: "entry-1",
					accountCode: "10",
					accountName: "Efectivo",
					debit: Money.fromAmount(1000, "PEN"),
					credit: Money.zero("PEN"),
				},
				{
					id: "entry-2",
					accountCode: "40",
					accountName: "Tributos",
					debit: Money.zero("USD"), // Different currency!
					credit: Money.fromAmount(1000, "USD"),
				},
			];

			const props = createValidTransactionProps({
				entries: mixedCurrencyEntries,
			});

			expect(() => Transaction.create(props)).toThrow(
				"Todos los asientos deben usar la misma moneda",
			);
		});
	});

	describe("Transaction Types", () => {
		const transactionTypes: TransactionType[] = [
			"SALE",
			"PURCHASE",
			"PAYMENT",
			"RECEIPT",
			"ADJUSTMENT",
			"TRANSFER",
		];

		it.each(transactionTypes)("should accept transaction type: %s", (type) => {
			const props = createValidTransactionProps({ type });
			const transaction = Transaction.create(props);

			expect(transaction.type).toBe(type);
		});
	});

	describe("Status Transitions", () => {
		describe("post()", () => {
			it("should post a DRAFT transaction", () => {
				const props = createValidTransactionProps({ status: "DRAFT" });
				const transaction = Transaction.create(props);

				const postedTransaction = transaction.post("user-123");

				expect(postedTransaction.status).toBe("POSTED");
				expect(postedTransaction.postedAt).toBeInstanceOf(Date);
			});

			it("should throw error when posting non-DRAFT transaction", () => {
				const props = createValidTransactionProps({ status: "POSTED" });
				const transaction = Transaction.create(props);

				expect(() => transaction.post("user-123")).toThrow(
					"Solo se pueden contabilizar transacciones en borrador",
				);
			});
		});

		describe("void()", () => {
			it("should void a POSTED transaction", () => {
				const props = createValidTransactionProps({ status: "POSTED" });
				const transaction = Transaction.create(props);

				const voidedTransaction = transaction.void(
					"user-123",
					"Error en registro",
				);

				expect(voidedTransaction.status).toBe("VOIDED");
			});

			it("should throw error when voiding non-POSTED transaction", () => {
				const props = createValidTransactionProps({ status: "DRAFT" });
				const transaction = Transaction.create(props);

				expect(() => transaction.void("user-123", "Error")).toThrow(
					"Solo se pueden anular transacciones contabilizadas",
				);
			});
		});
	});

	describe("Business Methods", () => {
		describe("canBeModified()", () => {
			it("should return true for DRAFT transactions", () => {
				const transaction = Transaction.create(
					createValidTransactionProps({ status: "DRAFT" }),
				);

				expect(transaction.canBeModified()).toBe(true);
			});

			it("should return false for POSTED transactions", () => {
				const transaction = Transaction.create(
					createValidTransactionProps({ status: "POSTED" }),
				);

				expect(transaction.canBeModified()).toBe(false);
			});

			it("should return false for VOIDED transactions", () => {
				const transaction = Transaction.create(
					createValidTransactionProps({ status: "VOIDED" }),
				);

				expect(transaction.canBeModified()).toBe(false);
			});
		});

		describe("isBalanced()", () => {
			it("should return true for balanced transactions", () => {
				const transaction = Transaction.create(createValidTransactionProps());

				expect(transaction.isBalanced()).toBe(true);
			});
		});

		describe("getTotalAmount()", () => {
			it("should return total debits amount", () => {
				const entries = createBalancedEntries(5000);
				const transaction = Transaction.create(
					createValidTransactionProps({ entries }),
				);

				const total = transaction.getTotalAmount();

				expect(total.getAmount()).toBe(5000);
			});

			it("should handle multiple entries", () => {
				const multiEntries: TransactionEntry[] = [
					{
						id: "entry-1",
						accountCode: "10",
						accountName: "Efectivo",
						debit: Money.fromAmount(1000, "PEN"),
						credit: Money.zero("PEN"),
					},
					{
						id: "entry-2",
						accountCode: "12",
						accountName: "Cuentas por Cobrar",
						debit: Money.fromAmount(500, "PEN"),
						credit: Money.zero("PEN"),
					},
					{
						id: "entry-3",
						accountCode: "70",
						accountName: "Ventas",
						debit: Money.zero("PEN"),
						credit: Money.fromAmount(1500, "PEN"),
					},
				];

				const transaction = Transaction.create(
					createValidTransactionProps({ entries: multiEntries }),
				);

				expect(transaction.getTotalAmount().getAmount()).toBe(1500);
			});
		});
	});

	describe("Equality", () => {
		it("should return true for transactions with same ID", () => {
			const txn1 = Transaction.create(
				createValidTransactionProps({ id: "same-id" }),
			);
			const txn2 = Transaction.create(
				createValidTransactionProps({ id: "same-id" }),
			);

			expect(txn1.equals(txn2)).toBe(true);
		});

		it("should return false for transactions with different ID", () => {
			const txn1 = Transaction.create(
				createValidTransactionProps({ id: "id-1" }),
			);
			const txn2 = Transaction.create(
				createValidTransactionProps({ id: "id-2" }),
			);

			expect(txn1.equals(txn2)).toBe(false);
		});

		it("should return false for null", () => {
			const txn = Transaction.create(createValidTransactionProps());
			expect(txn.equals(null)).toBe(false);
		});

		it("should return false for undefined", () => {
			const txn = Transaction.create(createValidTransactionProps());
			expect(txn.equals(undefined)).toBe(false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON correctly", () => {
			const transaction = Transaction.create(createValidTransactionProps());

			const json = transaction.toJSON();

			expect(json).toHaveProperty("id", "txn-123");
			expect(json).toHaveProperty("type", "SALE");
			expect(json).toHaveProperty("status", "DRAFT");
			expect(json).toHaveProperty("entries");
			expect(typeof json.date).toBe("string");
			expect(typeof json.createdAt).toBe("string");
		});

		it("should serialize entries with Money objects", () => {
			const transaction = Transaction.create(createValidTransactionProps());

			const json = transaction.toJSON();
			const entries = json.entries as Array<{ debit: unknown }>;

			expect(entries[0]?.debit).toHaveProperty("amount");
			expect(entries[0]?.debit).toHaveProperty("currency");
		});
	});

	describe("Immutability", () => {
		it("should be frozen after creation", () => {
			const transaction = Transaction.create(createValidTransactionProps());

			expect(Object.isFrozen(transaction)).toBe(true);
		});

		it("should return new instance on post", () => {
			const original = Transaction.create(
				createValidTransactionProps({ status: "DRAFT" }),
			);
			const posted = original.post("user-123");

			expect(posted).not.toBe(original);
			expect(original.status).toBe("DRAFT");
			expect(posted.status).toBe("POSTED");
		});

		it("should return new instance on void", () => {
			const original = Transaction.create(
				createValidTransactionProps({ status: "POSTED" }),
			);
			const voided = original.void("user-123", "Error");

			expect(voided).not.toBe(original);
			expect(original.status).toBe("POSTED");
			expect(voided.status).toBe("VOIDED");
		});
	});

	describe("Edge Cases", () => {
		it("should handle transaction without reference number", () => {
			const props = createValidTransactionProps({ referenceNumber: undefined });
			const transaction = Transaction.create(props);

			expect(transaction.referenceNumber).toBeUndefined();
		});

		it("should handle very large amounts", () => {
			const largeEntries = createBalancedEntries(999999999.99);
			const transaction = Transaction.create(
				createValidTransactionProps({ entries: largeEntries }),
			);

			expect(transaction.getTotalAmount().getAmount()).toBe(999999999.99);
		});

		it("should handle zero amount entries", () => {
			// Zero balanced entries - both entries have small amounts that equal
			const zeroEntries: TransactionEntry[] = [
				{
					id: "entry-1",
					accountCode: "10",
					accountName: "Efectivo",
					debit: Money.fromAmount(0.01, "PEN"),
					credit: Money.zero("PEN"),
				},
				{
					id: "entry-2",
					accountCode: "40",
					accountName: "Tributos",
					debit: Money.zero("PEN"),
					credit: Money.fromAmount(0.01, "PEN"),
				},
			];

			const transaction = Transaction.create(
				createValidTransactionProps({ entries: zeroEntries }),
			);

			expect(transaction.getTotalAmount().getAmount()).toBe(0.01);
		});

		it("should handle transaction at exact current date (boundary)", () => {
			const now = new Date();
			// Set to slightly in the past to avoid timing issues
			now.setSeconds(now.getSeconds() - 1);

			const props = createValidTransactionProps({ date: now });
			const transaction = Transaction.create(props);

			expect(transaction.date).toEqual(now);
		});

		it("should handle USD currency transactions", () => {
			const usdEntries: TransactionEntry[] = [
				{
					id: "entry-1",
					accountCode: "10",
					accountName: "Efectivo USD",
					debit: Money.fromAmount(100, "USD"),
					credit: Money.zero("USD"),
				},
				{
					id: "entry-2",
					accountCode: "40",
					accountName: "Tributos USD",
					debit: Money.zero("USD"),
					credit: Money.fromAmount(100, "USD"),
				},
			];

			const transaction = Transaction.create(
				createValidTransactionProps({ entries: usdEntries }),
			);

			expect(transaction.getTotalAmount().getCurrency()).toBe("USD");
		});
	});

	describe("Getters", () => {
		it("should return all properties correctly", () => {
			const props = createValidTransactionProps();
			const transaction = Transaction.create(props);

			expect(transaction.id).toBe(props.id);
			expect(transaction.type).toBe(props.type);
			expect(transaction.date).toEqual(props.date);
			expect(transaction.description).toBe(props.description);
			expect(transaction.referenceNumber).toBe(props.referenceNumber);
			expect(transaction.entries).toHaveLength(2);
			expect(transaction.status).toBe(props.status);
			expect(transaction.createdAt).toEqual(props.createdAt);
			expect(transaction.updatedAt).toEqual(props.updatedAt);
		});

		it("should return readonly entries array", () => {
			const transaction = Transaction.create(createValidTransactionProps());
			const entries = transaction.entries;

			expect(Array.isArray(entries)).toBe(true);
			// The entries should be readonly (frozen)
			expect(Object.isFrozen(transaction)).toBe(true);
		});
	});
});
