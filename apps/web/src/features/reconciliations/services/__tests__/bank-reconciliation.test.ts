import { describe, expect, it } from "vitest";
import {
	type BankTransactionDto,
	bankAmountCents,
	type MatchesDto,
	summarize,
	toTransaction,
} from "../bank-reconciliation";

const row = (
	overrides: Partial<BankTransactionDto> = {},
): BankTransactionDto => ({
	id: "tx-1",
	transactionDate: "2025-01-14",
	description: "TRANSFERENCIA RECIBIDA - ENTERPRISE",
	reference: "F001-1234",
	type: "CREDIT",
	amount: "15000.0000",
	isReconciled: false,
	...overrides,
});

const matches: MatchesDto = {
	transactionId: "tx-1",
	amountCents: 1500000,
	confidence: 100,
	matches: [
		{
			documentId: "inv-1",
			kind: "INVOICE",
			number: "F001-1234",
			partnerName: "ENTERPRISE CORP",
			amountCents: 1500000,
			score: 100,
			reasons: [
				"Monto exacto: S/ 15000.00",
				"La referencia menciona F001-1234",
			],
			dayDistance: 0,
		},
	],
};

describe("bankAmountCents", () => {
	it("reads the API decimal exactly and signs it by direction", () => {
		expect(bankAmountCents("450.5000", "DEBIT")).toBe(-45050);
		expect(bankAmountCents("15000.0000", "CREDIT")).toBe(1500000);
		expect(bankAmountCents("0.29", "CREDIT")).toBe(29);
	});

	it("rejects fractions of a cent and garbage", () => {
		expect(() => bankAmountCents("1.0050", "CREDIT")).toThrow();
		expect(() => bankAmountCents("abc", "CREDIT")).toThrow();
	});
});

describe("toTransaction", () => {
	it("marks reconciled movements as matched", () => {
		const tx = toTransaction(row({ isReconciled: true }));
		expect(tx).toMatchObject({
			id: "tx-1",
			date: "14 ENE",
			amountCents: 1500000,
			amount: 15000,
			status: "matched",
			confidence: 100,
			candidates: [],
		});
	});

	it("accepts the Date that Eden Treaty makes of an ISO date", () => {
		expect(
			toTransaction(row({ transactionDate: new Date("2025-01-14") })).date,
		).toBe("14 ENE");
	});

	it("keeps a pending movement in review until its matches are loaded", () => {
		expect(toTransaction(row())).toMatchObject({
			status: "needs_review",
			confidence: 0,
			candidates: [],
		});
	});

	it("turns API proposals into candidates with their evidence", () => {
		const tx = toTransaction(row(), matches);
		expect(tx.status).toBe("suggested");
		expect(tx.confidence).toBe(100);
		expect(tx.candidates).toEqual([
			{
				id: "inv-1",
				documentKind: "INVOICE",
				ledgerEntryId: "F001-1234",
				vendor: "ENTERPRISE CORP",
				amount: 15000,
				amountCents: 1500000,
				score: 100,
				rationale:
					"Monto exacto: S/ 15000.00. La referencia menciona F001-1234.",
				sourceRecords: [
					"Movimiento bancario 14 ENE · F001-1234",
					"Factura F001-1234 · ENTERPRISE CORP",
				],
				impact: "Marca el movimiento como conciliado con la factura F001-1234.",
				proposedDiff: [
					"bank_transactions.invoice_id → F001-1234",
					"bank_transactions.is_reconciled → true",
				],
			},
		]);
	});

	it("rates weak or missing proposals for review", () => {
		const weak = {
			...matches,
			confidence: 60,
			matches: matches.matches.map((m) => ({ ...m, score: 60 })),
		};
		expect(toTransaction(row(), weak).status).toBe("needs_review");
		expect(
			toTransaction(row(), { ...matches, confidence: 0, matches: [] }).status,
		).toBe("unmatched");
	});
});

describe("summarize", () => {
	it("adds exposure in cents and rates the share reconciled", () => {
		const txs = [
			toTransaction(row({ id: "a", isReconciled: true })),
			toTransaction(row({ id: "b", amount: "0.10", type: "DEBIT" })),
			toTransaction(row({ id: "c", amount: "0.20" })),
		];
		expect(summarize(txs)).toEqual({
			unresolvedCount: 2,
			unresolvedExposureCents: 30,
			reconciledRate: 33,
			requiresHumanDecision: true,
		});
		expect(summarize([])).toEqual({
			unresolvedCount: 0,
			unresolvedExposureCents: 0,
			reconciledRate: 100,
			requiresHumanDecision: false,
		});
	});
});
