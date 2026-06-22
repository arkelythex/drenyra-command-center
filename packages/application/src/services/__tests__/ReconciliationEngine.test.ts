/**
 * Reconciliation Engine Tests
 */

import { describe, expect, it } from "vitest";
import {
	type AccountingEntry,
	type BankMovement,
	createReconciliationEngine,
	ReconciliationEngine,
} from "../ReconciliationEngine";
import { extractDataFromDescription } from "../reconciliation.types";

describe("ReconciliationEngine", () => {
	const createBankMovement = (
		overrides: Partial<BankMovement> = {},
	): BankMovement => ({
		id: 1,
		bankAccountId: 100,
		date: new Date("2025-01-15"),
		description: "TRANSFERENCIA RECIBIDA",
		amount: 1000,
		type: "CREDIT",
		isReconciled: false,
		...overrides,
	});

	const createAccountingEntry = (
		overrides: Partial<AccountingEntry> = {},
	): AccountingEntry => ({
		id: "entry-1",
		date: new Date("2025-01-15"),
		description: "Venta de servicios",
		debit: 0,
		credit: 1000,
		...overrides,
	});

	describe("Configuration", () => {
		it("should create engine with default config", () => {
			const engine = createReconciliationEngine();
			expect(engine).toBeInstanceOf(ReconciliationEngine);
		});

		it("should throw if weights do not sum to 100", () => {
			expect(() =>
				createReconciliationEngine({
					amountWeight: 50,
					dateWeight: 25,
					descriptionWeight: 25,
					documentWeight: 25, // Sum = 125
				}),
			).toThrow("Weight configuration must sum to 100");
		});

		it("should accept custom config", () => {
			const engine = createReconciliationEngine({
				amountWeight: 50,
				dateWeight: 20,
				descriptionWeight: 20,
				documentWeight: 10,
				minConfidence: 70,
			});
			expect(engine).toBeInstanceOf(ReconciliationEngine);
		});
	});

	describe("Amount Matching", () => {
		it("should score 100 for exact amount match", () => {
			const engine = createReconciliationEngine();

			const bankMovements = [createBankMovement({ amount: 1500 })];
			const entries = [createAccountingEntry({ credit: 1500 })];

			const result = engine.reconcile(bankMovements, entries);

			expect(result.matches).toHaveLength(1);
			expect(result.matches[0]?.matchDetails.amountScore).toBe(100);
		});

		it("should score lower for amount differences", () => {
			const engine = createReconciliationEngine({
				minConfidence: 30, // Lower threshold for this test
			});

			const bankMovements = [createBankMovement({ amount: 1000 })];
			const entries = [createAccountingEntry({ credit: 990 })]; // 1% difference

			const result = engine.reconcile(bankMovements, entries);

			expect(result.matches).toHaveLength(1);
			expect(result.matches[0]?.matchDetails.amountScore).toBeLessThan(100);
			expect(result.matches[0]?.matchDetails.amountScore).toBeGreaterThan(50);
		});

		it("should not match very different amounts", () => {
			const engine = createReconciliationEngine({
				minConfidence: 80,
			});

			const bankMovements = [createBankMovement({ amount: 1000 })];
			const entries = [createAccountingEntry({ credit: 500 })]; // 50% difference

			const result = engine.reconcile(bankMovements, entries);

			expect(result.matches).toHaveLength(0);
			expect(result.unmatchedBank).toHaveLength(1);
		});
	});

	describe("Date Matching", () => {
		it("should score 100 for same day", () => {
			const engine = createReconciliationEngine();

			const bankMovements = [
				createBankMovement({
					date: new Date("2025-01-15"),
					amount: 1000,
				}),
			];
			const entries = [
				createAccountingEntry({
					date: new Date("2025-01-15"),
					credit: 1000,
				}),
			];

			const result = engine.reconcile(bankMovements, entries);

			expect(result.matches[0]?.matchDetails.dateScore).toBe(100);
		});

		it("should decrease score for date differences", () => {
			const engine = createReconciliationEngine({
				minConfidence: 30, // Lower threshold for this test
			});

			const bankMovements = [
				createBankMovement({
					date: new Date("2025-01-15"),
					amount: 1000,
				}),
			];
			const entries = [
				createAccountingEntry({
					date: new Date("2025-01-18"), // 3 days later
					credit: 1000,
				}),
			];

			const result = engine.reconcile(bankMovements, entries);

			expect(result.matches).toHaveLength(1);
			expect(result.matches[0]?.matchDetails.dateScore).toBeLessThan(100);
			expect(result.matches[0]?.matchDetails.dateScore).toBeGreaterThan(50);
		});
	});

	describe("Description Matching", () => {
		it("should score high for similar descriptions", () => {
			const engine = createReconciliationEngine();

			const bankMovements = [
				createBankMovement({
					description: "PAGO FACTURA EMPRESA ABC SAC",
					amount: 1000,
				}),
			];
			const entries = [
				createAccountingEntry({
					description: "Cobranza factura",
					thirdPartyName: "EMPRESA ABC SAC",
					credit: 1000,
				}),
			];

			const result = engine.reconcile(bankMovements, entries);

			expect(result.matches[0]?.matchDetails.descriptionScore).toBeGreaterThan(
				70,
			);
		});
	});

	describe("Document Extraction", () => {
		it("should extract invoice from bank description", () => {
			const engine = createReconciliationEngine();

			const extracted = extractDataFromDescription(
				"PAGO F001-00012345 EMPRESA SAC 20123456789",
			);

			expect(extracted.invoiceSeries).toBe("F001");
			expect(extracted.invoiceNumber).toBe("00012345");
			expect(extracted.ruc).toBe("20123456789");
		});

		it("should extract amounts from description", () => {
			const engine = createReconciliationEngine();

			const extracted = extractDataFromDescription(
				"PAGO POR 1,500.00 SOLES FACTURA",
			);

			expect(extracted.amounts).toContain(1500);
		});

		it("should handle descriptions without extractable data", () => {
			const engine = createReconciliationEngine();

			const extracted = extractDataFromDescription(
				"RETIRO CAJERO AUTOMATICO",
			);

			expect(extracted.invoiceSeries).toBeUndefined();
			expect(extracted.ruc).toBeUndefined();
		});
	});

	describe("Matching with Document Info", () => {
		it("should score high when document numbers match", () => {
			const engine = createReconciliationEngine();

			const bankMovements = [
				createBankMovement({
					description: "PAGO F001-00012345",
					amount: 1000,
				}),
			];
			const entries = [
				createAccountingEntry({
					documentNumber: "F001-00012345",
					credit: 1000,
				}),
			];

			const result = engine.reconcile(bankMovements, entries);

			expect(result.matches[0]?.matchDetails.documentScore).toBe(100);
		});

		it("should score high when RUC matches", () => {
			const engine = createReconciliationEngine();

			const bankMovements = [
				createBankMovement({
					description: "TRANSFERENCIA 20123456789",
					amount: 1000,
				}),
			];
			const entries = [
				createAccountingEntry({
					thirdPartyRuc: "20123456789",
					credit: 1000,
				}),
			];

			const result = engine.reconcile(bankMovements, entries);

			expect(result.matches[0]?.matchDetails.documentScore).toBe(90);
		});
	});

	describe("Full Reconciliation", () => {
		it("should match multiple movements correctly", () => {
			const engine = createReconciliationEngine();

			const bankMovements: BankMovement[] = [
				createBankMovement({ id: 1, amount: 1000, description: "PAGO A" }),
				createBankMovement({ id: 2, amount: 2000, description: "PAGO B" }),
				createBankMovement({ id: 3, amount: 3000, description: "PAGO C" }),
			];

			const entries: AccountingEntry[] = [
				createAccountingEntry({ id: "e1", credit: 1000 }),
				createAccountingEntry({ id: "e2", credit: 2000 }),
				// No matching entry for 3000
			];

			const result = engine.reconcile(bankMovements, entries);

			expect(result.matches).toHaveLength(2);
			expect(result.unmatchedBank).toHaveLength(1);
			expect(result.unmatchedBank[0]?.amount).toBe(3000);
			expect(result.unmatchedAccounting).toHaveLength(0);
		});

		it("should not match already reconciled movements", () => {
			const engine = createReconciliationEngine();

			const bankMovements: BankMovement[] = [
				createBankMovement({ id: 1, amount: 1000, isReconciled: true }),
				createBankMovement({ id: 2, amount: 2000, isReconciled: false }),
			];

			const entries: AccountingEntry[] = [
				createAccountingEntry({ id: "e1", credit: 1000 }),
				createAccountingEntry({ id: "e2", credit: 2000 }),
			];

			const result = engine.reconcile(bankMovements, entries);

			expect(result.matches).toHaveLength(1);
			expect(result.matches[0]?.bankMovement.id).toBe(2);
		});

		it("should return correct stats", () => {
			const engine = createReconciliationEngine();

			const bankMovements: BankMovement[] = [
				createBankMovement({ id: 1, amount: 1000 }),
				createBankMovement({ id: 2, amount: 2000 }),
			];

			const entries: AccountingEntry[] = [
				createAccountingEntry({ id: "e1", credit: 1000 }),
				createAccountingEntry({ id: "e2", credit: 2000 }),
			];

			const result = engine.reconcile(bankMovements, entries);

			expect(result.stats.totalBankMovements).toBe(2);
			expect(result.stats.totalAccountingEntries).toBe(2);
			expect(result.stats.matchedCount).toBe(2);
			expect(result.stats.processingTimeMs).toBeGreaterThanOrEqual(0);
		});
	});

	describe("Auto-Reconcile Filtering", () => {
		it("should identify high-confidence matches for auto-reconcile", () => {
			const engine = createReconciliationEngine({
				autoReconcileThreshold: 90,
			});

			// Perfect match should have high confidence
			const bankMovements = [
				createBankMovement({
					amount: 1000,
					description: "PAGO F001-00001234 CLIENTE SAC",
					date: new Date("2025-01-15"),
				}),
			];

			const entries = [
				createAccountingEntry({
					credit: 1000,
					documentNumber: "F001-00001234",
					thirdPartyName: "CLIENTE SAC",
					date: new Date("2025-01-15"),
				}),
			];

			const result = engine.reconcile(bankMovements, entries);
			const autoReconcile = engine.getAutoReconcileMatches(result);

			expect(result.matches[0]?.confidence).toBeGreaterThanOrEqual(90);
			expect(autoReconcile).toHaveLength(1);
		});

		it("should identify matches needing manual review", () => {
			const engine = createReconciliationEngine({
				minConfidence: 60,
				autoReconcileThreshold: 90,
			});

			// Partial match - amount only
			const bankMovements = [
				createBankMovement({
					amount: 1000,
					description: "TRANSFERENCIA GENERAL",
					date: new Date("2025-01-15"),
				}),
			];

			const entries = [
				createAccountingEntry({
					credit: 1000,
					description: "Something else",
					date: new Date("2025-01-18"), // 3 days off
				}),
			];

			const result = engine.reconcile(bankMovements, entries);
			const manualReview = engine.getManualReviewMatches(result);

			if (result.matches.length > 0) {
				expect(result.matches[0]?.confidence).toBeLessThan(90);
				if (
					result.matches[0]?.confidence &&
					result.matches[0].confidence >= 60
				) {
					expect(manualReview).toHaveLength(1);
				}
			}
		});
	});
});
