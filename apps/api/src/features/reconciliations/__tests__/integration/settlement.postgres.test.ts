/**
 * Reconciling a bank movement against an invoice or bill pays it: the
 * invoice's paid amount and open balance move by the movement's amount and
 * the document becomes PAID. Undoing the reconciliation puts both back.
 *
 * Opt-in (RUN_DB_TESTS=1) because it needs PostgreSQL.
 */
import { randomUUID } from "node:crypto";
import { db } from "@drenyra/persistence/client";
import { eq } from "@drenyra/persistence/query";
import { bankTransactions, bills, invoices } from "@drenyra/persistence/schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ReconciliationService } from "../../application/services/reconciliation.service";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

const FUTURE_DUE = new Date("2099-12-31");
const PAST_DUE = new Date("2026-01-31");

describeDb("reconciliation settles the document (postgres)", () => {
	const service = new ReconciliationService();
	let companyId: string;

	beforeEach(() => {
		companyId = randomUUID();
	});

	afterEach(async () => {
		await db
			.delete(bankTransactions)
			.where(eq(bankTransactions.companyId, companyId));
		await db.delete(invoices).where(eq(invoices.companyId, companyId));
		await db.delete(bills).where(eq(bills.companyId, companyId));
	});

	async function invoice(paid: string, balance: string, dueDate: Date) {
		const id = randomUUID();
		await db.insert(invoices).values({
			id,
			companyId,
			customerId: randomUUID(),
			invoiceNumber: "F001-90",
			series: "F001",
			correlative: 90,
			issueDate: new Date("2026-01-01"),
			dueDate,
			subtotal: "84.75",
			igvAmount: "15.25",
			totalAmount: "100.00",
			paidAmount: paid,
			balanceDue: balance,
			status: "SENT",
		});
		return id;
	}

	async function bill(dueDate: Date) {
		const id = randomUUID();
		await db.insert(bills).values({
			id,
			companyId,
			vendorId: randomUUID(),
			billNumber: "E001-5",
			issueDate: new Date("2026-01-01"),
			dueDate,
			subtotalAmount: "84.75",
			igvAmount: "15.25",
			totalAmount: "100.00",
			status: "SENT",
		});
		return id;
	}

	async function movement(type: "CREDIT" | "DEBIT", amount: string) {
		const [row] = await db
			.insert(bankTransactions)
			.values({
				companyId,
				accountId: randomUUID(),
				transactionDate: "2026-09-10",
				description: "MOVIMIENTO",
				type,
				amount,
			})
			.returning({ id: bankTransactions.id });
		return row.id;
	}

	async function readInvoice(id: string) {
		const [row] = await db
			.select({
				status: invoices.status,
				paidAmount: invoices.paidAmount,
				balanceDue: invoices.balanceDue,
				paidDate: invoices.paidDate,
			})
			.from(invoices)
			.where(eq(invoices.id, id));
		return row;
	}

	it("pays the invoice's open balance and undoes it", async () => {
		const invoiceId = await invoice("40.00", "60.00", FUTURE_DUE);
		const tx = await movement("CREDIT", "60.0000");

		await service.reconcile(companyId, tx, { invoiceId });

		expect(await readInvoice(invoiceId)).toEqual({
			status: "PAID",
			paidAmount: "100.00",
			balanceDue: "0.00",
			paidDate: new Date("2026-09-10T00:00:00"),
		});

		await service.unreconcile(companyId, tx);

		expect(await readInvoice(invoiceId)).toEqual({
			status: "SENT",
			paidAmount: "40.00",
			balanceDue: "60.00",
			paidDate: null,
		});
	});

	it("reopens an invoice past its due date as OVERDUE", async () => {
		const invoiceId = await invoice("0.00", "100.00", PAST_DUE);
		const tx = await movement("CREDIT", "100.0000");

		await service.reconcile(companyId, tx, { invoiceId });
		await service.unreconcile(companyId, tx);

		expect((await readInvoice(invoiceId))?.status).toBe("OVERDUE");
	});

	it("marks the bill paid and reopens it", async () => {
		const billId = await bill(FUTURE_DUE);
		const tx = await movement("DEBIT", "100.0000");

		await service.reconcile(companyId, tx, { billId });
		const [paid] = await db
			.select({ status: bills.status })
			.from(bills)
			.where(eq(bills.id, billId));
		expect(paid?.status).toBe("PAID");

		await service.unreconcile(companyId, tx);
		const [open] = await db
			.select({ status: bills.status })
			.from(bills)
			.where(eq(bills.id, billId));
		expect(open?.status).toBe("SENT");
	});

	it("leaves documents alone when nothing was linked", async () => {
		const invoiceId = await invoice("0.00", "100.00", FUTURE_DUE);
		const tx = await movement("CREDIT", "100.0000");

		await service.reconcile(companyId, tx, { notes: "sin comprobante" });
		await service.unreconcile(companyId, tx);

		expect((await readInvoice(invoiceId))?.balanceDue).toBe("100.00");
	});
});
