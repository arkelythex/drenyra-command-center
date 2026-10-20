/**
 * One invoice is paid by one bank movement: once a movement is reconciled
 * against it, the invoice is no longer proposed nor accepted for another one,
 * even when two reconciles race.
 *
 * Opt-in (RUN_DB_TESTS=1) because it needs PostgreSQL.
 */
import { randomUUID } from "node:crypto";
import { db } from "@drenyra/persistence/client";
import { eq } from "@drenyra/persistence/query";
import { bankTransactions, invoices } from "@drenyra/persistence/schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	ReconcileRejectedError,
	ReconciliationService,
} from "../../application/services/reconciliation.service";
import { ReconcileConflictError } from "../../infrastructure/reconciliation.repository";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeDb("reconciliation links each invoice once (postgres)", () => {
	const service = new ReconciliationService();
	let companyId: string;
	let invoiceId: string;

	beforeEach(async () => {
		companyId = randomUUID();
		invoiceId = randomUUID();
		await db.insert(invoices).values({
			id: invoiceId,
			companyId,
			customerId: randomUUID(),
			invoiceNumber: "F001-77",
			series: "F001",
			correlative: 77,
			issueDate: new Date("2026-09-01"),
			dueDate: new Date("2026-09-30"),
			subtotal: "84.75",
			igvAmount: "15.25",
			totalAmount: "100.00",
			balanceDue: "100.00",
			status: "SENT",
		});
	});

	afterEach(async () => {
		await db
			.delete(bankTransactions)
			.where(eq(bankTransactions.companyId, companyId));
		await db.delete(invoices).where(eq(invoices.companyId, companyId));
	});

	async function credit(amount = "100.0000"): Promise<string> {
		const [row] = await db
			.insert(bankTransactions)
			.values({
				companyId,
				accountId: randomUUID(),
				transactionDate: "2026-09-10",
				description: "ABONO F001-77",
				type: "CREDIT",
				amount,
			})
			.returning({ id: bankTransactions.id });
		return row.id;
	}

	it("stops proposing and accepting an invoice already reconciled", async () => {
		const first = await credit();
		const second = await credit();

		const before = await service.findMatches(companyId, second);
		expect(before?.matches.map((m) => m.documentId)).toContain(invoiceId);

		await service.reconcile(companyId, first, { invoiceId });

		const after = await service.findMatches(companyId, second);
		expect(after?.matches.map((m) => m.documentId)).not.toContain(invoiceId);
		await expect(
			service.reconcile(companyId, second, { invoiceId }),
		).rejects.toBeInstanceOf(ReconcileRejectedError);
	});

	it("lets only one of two racing reconciles link the invoice", async () => {
		const first = await credit();
		const second = await credit();

		const results = await Promise.allSettled([
			service.reconcile(companyId, first, { invoiceId }),
			service.reconcile(companyId, second, { invoiceId }),
		]);

		expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
		const rejected = results.find((r) => r.status === "rejected");
		// Whichever check sees the other one first refuses it.
		expect(
			rejected?.reason instanceof ReconcileConflictError ||
				rejected?.reason instanceof ReconcileRejectedError,
		).toBe(true);
		const linked = await db
			.select({ id: bankTransactions.id })
			.from(bankTransactions)
			.where(eq(bankTransactions.invoiceId, invoiceId));
		expect(linked).toHaveLength(1);
	});

	it("refuses to relink a movement that is already reconciled", async () => {
		const first = await credit();
		await service.reconcile(companyId, first, { invoiceId });

		await expect(
			service.reconcile(companyId, first, { invoiceId }),
		).rejects.toBeInstanceOf(ReconcileRejectedError);
	});

	it("rejects a sub-cent movement instead of failing", async () => {
		const odd = await credit("100.0050");

		await expect(service.findMatches(companyId, odd)).rejects.toBeInstanceOf(
			ReconcileRejectedError,
		);
	});
});
