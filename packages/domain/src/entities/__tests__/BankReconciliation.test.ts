import { describe, expect, it } from "vitest";
import {
	BankReconciliation,
	type BankReconciliationProps,
	type ReconciliationStatus,
} from "../BankReconciliation";

describe("BankReconciliation Entity", () => {
	const validProps: BankReconciliationProps = {
		id: 1,
		bankAccountId: 100,
		organizationId: 1,
		periodStart: new Date("2024-01-01"),
		periodEnd: new Date("2024-01-31"),
		openingBalance: 10000,
		closingBalanceStatement: 15000,
		closingBalanceBooks: 15000,
		difference: 0,
		status: "DRAFT",
		reconciledTransactionIds: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	describe("create", () => {
		it("should create a valid bank reconciliation from existing data", () => {
			const reconciliation = BankReconciliation.create(validProps);

			expect(reconciliation.id).toBe(1);
			expect(reconciliation.bankAccountId).toBe(100);
			expect(reconciliation.organizationId).toBe(1);
			expect(reconciliation.openingBalance).toBe(10000);
			expect(reconciliation.closingBalanceStatement).toBe(15000);
			expect(reconciliation.status).toBe("DRAFT");
		});

		it("should create reconciliation with all optional fields", () => {
			const propsWithOptionals: BankReconciliationProps = {
				...validProps,
				reconciledByUserId: "user-123",
				notes: "Conciliación mensual",
				completedAt: new Date(),
			};

			const reconciliation = BankReconciliation.create(propsWithOptionals);

			expect(reconciliation.reconciledByUserId).toBe("user-123");
			expect(reconciliation.notes).toBe("Conciliación mensual");
			expect(reconciliation.completedAt).toBeDefined();
		});

		it("should create with transaction IDs", () => {
			const propsWithTransactions: BankReconciliationProps = {
				...validProps,
				reconciledTransactionIds: [1, 2, 3, 4, 5],
			};

			const reconciliation = BankReconciliation.create(propsWithTransactions);

			expect(reconciliation.reconciledTransactionIds).toEqual([1, 2, 3, 4, 5]);
		});
	});

	describe("createNew", () => {
		it("should create a new bank reconciliation with defaults", () => {
			const reconciliation = BankReconciliation.createNew({
				bankAccountId: 100,
				organizationId: 1,
				periodStart: new Date("2024-01-01"),
				periodEnd: new Date("2024-01-31"),
				openingBalance: 10000,
				closingBalanceStatement: 15000,
			});

			expect(reconciliation.id).toBe(0);
			expect(reconciliation.status).toBe("DRAFT");
			expect(reconciliation.closingBalanceBooks).toBe(0);
			expect(reconciliation.difference).toBe(0);
			expect(reconciliation.reconciledTransactionIds).toEqual([]);
			expect(reconciliation.createdAt).toBeDefined();
			expect(reconciliation.updatedAt).toBeDefined();
		});
	});

	describe("Business Rule Validation", () => {
		it("should throw error when period end is before period start", () => {
			expect(() =>
				BankReconciliation.create({
					...validProps,
					periodStart: new Date("2024-01-31"),
					periodEnd: new Date("2024-01-01"),
				}),
			).toThrow("La fecha de fin debe ser posterior a la fecha de inicio");
		});

		it("should accept same start and end date", () => {
			const sameDate = new Date("2024-01-15");
			const reconciliation = BankReconciliation.create({
				...validProps,
				periodStart: sameDate,
				periodEnd: sameDate,
			});

			expect(reconciliation.periodStart).toEqual(sameDate);
			expect(reconciliation.periodEnd).toEqual(sameDate);
		});
	});

	describe("Reconciliation Status", () => {
		const statuses: ReconciliationStatus[] = [
			"DRAFT",
			"COMPLETED",
			"CANCELLED",
		];

		statuses.forEach((status) => {
			it(`should accept status: ${status}`, () => {
				const reconciliation = BankReconciliation.create({
					...validProps,
					status,
				});

				expect(reconciliation.status).toBe(status);
			});
		});
	});

	describe("addTransaction", () => {
		it("should add transaction to draft reconciliation", () => {
			const reconciliation = BankReconciliation.create(validProps);
			const updated = reconciliation.addTransaction(101);

			expect(updated.reconciledTransactionIds).toContain(101);
		});

		it("should not duplicate transaction ID", () => {
			const propsWithTransaction: BankReconciliationProps = {
				...validProps,
				reconciledTransactionIds: [101],
			};

			const reconciliation = BankReconciliation.create(propsWithTransaction);
			const updated = reconciliation.addTransaction(101);

			// Should return same instance or equivalent
			expect(
				updated.reconciledTransactionIds.filter((id) => id === 101).length,
			).toBe(1);
		});

		it("should throw error when adding to completed reconciliation", () => {
			const completedProps: BankReconciliationProps = {
				...validProps,
				status: "COMPLETED",
			};

			const reconciliation = BankReconciliation.create(completedProps);

			expect(() => reconciliation.addTransaction(101)).toThrow(
				"Solo se pueden agregar transacciones a conciliaciones en borrador",
			);
		});

		it("should throw error when adding to cancelled reconciliation", () => {
			const cancelledProps: BankReconciliationProps = {
				...validProps,
				status: "CANCELLED",
			};

			const reconciliation = BankReconciliation.create(cancelledProps);

			expect(() => reconciliation.addTransaction(101)).toThrow(
				"Solo se pueden agregar transacciones a conciliaciones en borrador",
			);
		});

		it("should add multiple transactions", () => {
			const reconciliation = BankReconciliation.create(validProps);
			const updated = reconciliation
				.addTransaction(101)
				.addTransaction(102)
				.addTransaction(103);

			expect(updated.reconciledTransactionIds).toEqual([101, 102, 103]);
		});

		it("should return new instance (immutability)", () => {
			const reconciliation = BankReconciliation.create(validProps);
			const updated = reconciliation.addTransaction(101);

			expect(updated).not.toBe(reconciliation);
			expect(reconciliation.reconciledTransactionIds).toEqual([]);
		});
	});

	describe("removeTransaction", () => {
		it("should remove transaction from draft reconciliation", () => {
			const propsWithTransactions: BankReconciliationProps = {
				...validProps,
				reconciledTransactionIds: [101, 102, 103],
			};

			const reconciliation = BankReconciliation.create(propsWithTransactions);
			const updated = reconciliation.removeTransaction(102);

			expect(updated.reconciledTransactionIds).toEqual([101, 103]);
		});

		it("should handle removing non-existent transaction gracefully", () => {
			const reconciliation = BankReconciliation.create(validProps);
			const updated = reconciliation.removeTransaction(999);

			expect(updated.reconciledTransactionIds).toEqual([]);
		});

		it("should throw error when removing from completed reconciliation", () => {
			const completedProps: BankReconciliationProps = {
				...validProps,
				status: "COMPLETED",
				reconciledTransactionIds: [101],
			};

			const reconciliation = BankReconciliation.create(completedProps);

			expect(() => reconciliation.removeTransaction(101)).toThrow(
				"Solo se pueden remover transacciones de conciliaciones en borrador",
			);
		});
	});

	describe("updateBooksBalance", () => {
		it("should update books balance and calculate difference", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				closingBalanceStatement: 15000,
				closingBalanceBooks: 0,
			});

			const updated = reconciliation.updateBooksBalance(14500);

			expect(updated.closingBalanceBooks).toBe(14500);
			expect(updated.difference).toBe(500); // 15000 - 14500
		});

		it("should calculate negative difference", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				closingBalanceStatement: 15000,
			});

			const updated = reconciliation.updateBooksBalance(15500);

			expect(updated.difference).toBe(-500); // 15000 - 15500
		});

		it("should calculate zero difference when balanced", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				closingBalanceStatement: 15000,
			});

			const updated = reconciliation.updateBooksBalance(15000);

			expect(updated.difference).toBe(0);
		});

		it("should round difference to 2 decimal places", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				closingBalanceStatement: 15000.123,
			});

			const updated = reconciliation.updateBooksBalance(15000);

			expect(updated.difference).toBe(0.12);
		});

		it("should throw error when updating completed reconciliation", () => {
			const completedProps: BankReconciliationProps = {
				...validProps,
				status: "COMPLETED",
			};

			const reconciliation = BankReconciliation.create(completedProps);

			expect(() => reconciliation.updateBooksBalance(15000)).toThrow(
				"Solo se pueden actualizar conciliaciones en borrador",
			);
		});
	});

	describe("complete", () => {
		it("should complete a balanced draft reconciliation", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				difference: 0,
			});

			const completed = reconciliation.complete("user-123");

			expect(completed.status).toBe("COMPLETED");
			expect(completed.reconciledByUserId).toBe("user-123");
			expect(completed.completedAt).toBeDefined();
		});

		it("should complete reconciliation with difference if notes provided", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				difference: 50,
				notes: "Diferencia por comisiones pendientes",
			});

			const completed = reconciliation.complete("user-123");

			expect(completed.status).toBe("COMPLETED");
		});

		it("should throw error when completing with difference and no notes", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				difference: 50,
				notes: undefined,
			});

			expect(() => reconciliation.complete("user-123")).toThrow(
				"Debe explicar la diferencia en las notas antes de completar",
			);
		});

		it("should allow tiny differences without notes (rounding)", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				difference: 0.005, // Less than 0.01
			});

			const completed = reconciliation.complete("user-123");
			expect(completed.status).toBe("COMPLETED");
		});

		it("should throw error when completing already completed reconciliation", () => {
			const completedProps: BankReconciliationProps = {
				...validProps,
				status: "COMPLETED",
			};

			const reconciliation = BankReconciliation.create(completedProps);

			expect(() => reconciliation.complete("user-123")).toThrow(
				"La conciliación ya fue completada o cancelada",
			);
		});

		it("should throw error when completing cancelled reconciliation", () => {
			const cancelledProps: BankReconciliationProps = {
				...validProps,
				status: "CANCELLED",
			};

			const reconciliation = BankReconciliation.create(cancelledProps);

			expect(() => reconciliation.complete("user-123")).toThrow(
				"La conciliación ya fue completada o cancelada",
			);
		});
	});

	describe("cancel", () => {
		it("should cancel a draft reconciliation", () => {
			const reconciliation = BankReconciliation.create(validProps);
			const cancelled = reconciliation.cancel();

			expect(cancelled.status).toBe("CANCELLED");
		});

		it("should cancel a completed reconciliation", () => {
			const completedProps: BankReconciliationProps = {
				...validProps,
				status: "COMPLETED",
			};

			const reconciliation = BankReconciliation.create(completedProps);
			const cancelled = reconciliation.cancel();

			expect(cancelled.status).toBe("CANCELLED");
		});

		it("should throw error when cancelling already cancelled reconciliation", () => {
			const cancelledProps: BankReconciliationProps = {
				...validProps,
				status: "CANCELLED",
			};

			const reconciliation = BankReconciliation.create(cancelledProps);

			expect(() => reconciliation.cancel()).toThrow(
				"La conciliación ya está cancelada",
			);
		});
	});

	describe("addNotes", () => {
		it("should add notes to reconciliation", () => {
			const reconciliation = BankReconciliation.create(validProps);
			const updated = reconciliation.addNotes("Primera nota");

			expect(updated.notes).toBe("Primera nota");
		});

		it("should append notes to existing notes", () => {
			const propsWithNotes: BankReconciliationProps = {
				...validProps,
				notes: "Nota existente",
			};

			const reconciliation = BankReconciliation.create(propsWithNotes);
			const updated = reconciliation.addNotes("Nueva nota");

			expect(updated.notes).toBe("Nota existente\nNueva nota");
		});

		it("should allow adding notes to completed reconciliation", () => {
			const completedProps: BankReconciliationProps = {
				...validProps,
				status: "COMPLETED",
			};

			const reconciliation = BankReconciliation.create(completedProps);
			const updated = reconciliation.addNotes("Nota posterior");

			expect(updated.notes).toBe("Nota posterior");
		});
	});

	describe("isBalanced", () => {
		it("should return true when difference is zero", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				difference: 0,
			});

			expect(reconciliation.isBalanced()).toBe(true);
		});

		it("should return true when difference is within tolerance", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				difference: 0.005,
			});

			expect(reconciliation.isBalanced()).toBe(true);
		});

		it("should return false when difference exceeds tolerance", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				difference: 0.02,
			});

			expect(reconciliation.isBalanced()).toBe(false);
		});

		it("should handle negative differences", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				difference: -0.005,
			});

			expect(reconciliation.isBalanced()).toBe(true);
		});
	});

	describe("toJSON", () => {
		it("should serialize to JSON correctly", () => {
			const reconciliation = BankReconciliation.create(validProps);
			const json = reconciliation.toJSON();

			expect(json.id).toBe(1);
			expect(json.bankAccountId).toBe(100);
			expect(json.organizationId).toBe(1);
			expect(json.openingBalance).toBe(10000);
			expect(json.closingBalanceStatement).toBe(15000);
			expect(json.status).toBe("DRAFT");
			expect(typeof json.periodStart).toBe("string");
			expect(typeof json.periodEnd).toBe("string");
		});

		it("should serialize optional fields when present", () => {
			const propsWithOptionals: BankReconciliationProps = {
				...validProps,
				reconciledByUserId: "user-123",
				notes: "Notas de prueba",
				completedAt: new Date("2024-02-01"),
			};

			const reconciliation = BankReconciliation.create(propsWithOptionals);
			const json = reconciliation.toJSON();

			expect(json.reconciledByUserId).toBe("user-123");
			expect(json.notes).toBe("Notas de prueba");
			expect(typeof json.completedAt).toBe("string");
		});

		it("should serialize transaction IDs", () => {
			const propsWithTransactions: BankReconciliationProps = {
				...validProps,
				reconciledTransactionIds: [1, 2, 3],
			};

			const reconciliation = BankReconciliation.create(propsWithTransactions);
			const json = reconciliation.toJSON();

			expect(json.reconciledTransactionIds).toEqual([1, 2, 3]);
		});
	});

	describe("Getters return copies (immutability)", () => {
		it("should return copy of reconciledTransactionIds", () => {
			const propsWithTransactions: BankReconciliationProps = {
				...validProps,
				reconciledTransactionIds: [1, 2, 3],
			};

			const reconciliation = BankReconciliation.create(propsWithTransactions);
			const ids = reconciliation.reconciledTransactionIds;

			// Modify the returned array
			ids.push(999);

			// Original should be unchanged
			expect(reconciliation.reconciledTransactionIds).toEqual([1, 2, 3]);
		});
	});

	describe("Edge Cases", () => {
		it("should handle zero opening balance", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				openingBalance: 0,
			});

			expect(reconciliation.openingBalance).toBe(0);
		});

		it("should handle negative balance", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				openingBalance: -5000,
				closingBalanceStatement: -3000,
			});

			expect(reconciliation.openingBalance).toBe(-5000);
			expect(reconciliation.closingBalanceStatement).toBe(-3000);
		});

		it("should handle very large transaction counts", () => {
			const manyIds = Array.from({ length: 1000 }, (_, i) => i + 1);
			const reconciliation = BankReconciliation.create({
				...validProps,
				reconciledTransactionIds: manyIds,
			});

			expect(reconciliation.reconciledTransactionIds.length).toBe(1000);
		});

		it("should handle empty notes", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				notes: "",
			});

			// Empty string is falsy, so difference check should still require notes
			expect(reconciliation.notes).toBe("");
		});

		it("should handle decimal balances", () => {
			const reconciliation = BankReconciliation.create({
				...validProps,
				openingBalance: 10000.5,
				closingBalanceStatement: 15000.75,
				closingBalanceBooks: 15000.75,
			});

			expect(reconciliation.openingBalance).toBe(10000.5);
			expect(reconciliation.closingBalanceStatement).toBe(15000.75);
		});
	});
});
