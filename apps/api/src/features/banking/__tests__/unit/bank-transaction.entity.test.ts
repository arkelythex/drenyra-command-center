import { describe, expect, it } from "vitest";
import { BankTransaction } from "../../domain/entities/bank-transaction.entity";
import type { BankTransactionProps } from "../../domain/types";
import { MatchScore } from "../../domain/value-objects/match-score.vo";

function createTransaction(
	overrides: Partial<BankTransactionProps> = {},
): BankTransaction {
	return BankTransaction.create(
		{
			id: "tx-001",
			companyId: "comp-123",
			accountId: "acc-456",
			transactionDate: new Date("2026-01-15"),
			description: "Pago cliente",
			type: "CREDIT",
			amount: "1500.00",
			isReconciled: false,
			importedFrom: "MANUAL",
			createdAt: new Date("2026-01-15T10:00:00Z"),
			...overrides,
		},
		"PEN",
	);
}

describe("BankTransaction entity", () => {
	it("reconcile returns a new instance without mutating the original", () => {
		const tx = createTransaction();

		const reconciled = tx.reconcile("user-123");

		expect(reconciled).not.toBe(tx);
		expect(tx.isReconciled).toBe(false);
		expect(tx.reconciledBy).toBeUndefined();
		expect(reconciled.isReconciled).toBe(true);
		expect(reconciled.reconciledBy).toBe("user-123");
		expect(reconciled.reconciledAt).toBeInstanceOf(Date);
	});

	it("linkToInvoice returns a new instance without mutating the original", () => {
		const tx = createTransaction();
		const matchScore = MatchScore.fromCriteria("REFERENCE");

		const linked = tx.linkToInvoice("inv-123", matchScore);

		expect(linked).not.toBe(tx);
		expect(tx.invoiceId).toBeUndefined();
		expect(tx.matchScore).toBeUndefined();
		expect(linked.invoiceId).toBe("inv-123");
		expect(linked.matchScore?.equals(matchScore)).toBe(true);
	});

	it("preserves linked document and match score across reconcile", () => {
		const tx = createTransaction();
		const matchScore = MatchScore.fromCriteria("AMOUNT_DATE");

		const linked = tx.linkToInvoice("inv-456", matchScore);
		const reconciled = linked.reconcile("user-456");

		expect(reconciled.invoiceId).toBe("inv-456");
		expect(reconciled.matchScore?.equals(matchScore)).toBe(true);
		expect(reconciled.isReconciled).toBe(true);
		expect(linked.isReconciled).toBe(false);
	});

	it("unlink returns a new instance and clears link and reconciliation state", () => {
		const tx = createTransaction({
			isReconciled: true,
			reconciledAt: new Date("2026-01-16T11:00:00Z"),
			reconciledBy: "user-789",
			invoiceId: "inv-789",
		});

		const unlinked = tx.unlink();

		expect(unlinked).not.toBe(tx);
		expect(tx.isReconciled).toBe(true);
		expect(tx.invoiceId).toBe("inv-789");
		expect(unlinked.isReconciled).toBe(false);
		expect(unlinked.reconciledAt).toBeUndefined();
		expect(unlinked.reconciledBy).toBeUndefined();
		expect(unlinked.invoiceId).toBeUndefined();
		expect(unlinked.billId).toBeUndefined();
		expect(unlinked.matchScore).toBeUndefined();
	});
});
