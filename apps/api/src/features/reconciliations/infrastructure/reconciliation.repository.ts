import { db } from "@drenyra/persistence/client";
import {
	and,
	asc,
	eq,
	inArray,
	notExists,
	type SQL,
} from "@drenyra/persistence/query";
import {
	bankTransactions,
	bills,
	businessPartners,
	invoices,
} from "@drenyra/persistence/schema";
import { bankAmountToCents, type OpenDocument } from "../domain/bank-matching";

/**
 * Optional metadata accepted when manually reconciling a bank transaction.
 *
 * @example
 * ```ts
 * const input: ReconcileInput = { notes: 'Validated against bank statement' };
 * ```
 */
export interface ReconcileInput {
	bankReference?: string;
	reconciledAmount?: string;
	notes?: string;
	/** Sales invoice this inflow pays. */
	invoiceId?: string;
	/** Purchase bill this outflow pays. */
	billId?: string;
	/** Session user confirming the match. */
	reconciledBy?: string;
}

const OPEN_STATUSES = ["SENT", "OVERDUE"] as const;

/** The movement or the document was reconciled by someone else meanwhile. */
export class ReconcileConflictError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ReconcileConflictError";
	}
}

/** True (SQL) when no reconciled movement of the company already pays the document. */
function notLinked(companyId: string, link: SQL): SQL {
	return notExists(
		db
			.select({ id: bankTransactions.id })
			.from(bankTransactions)
			.where(
				and(
					eq(bankTransactions.companyId, companyId),
					eq(bankTransactions.isReconciled, true),
					link,
				),
			),
	);
}

function isoDate(value: Date): string {
	return value.toISOString().slice(0, 10);
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Row lock on the document being paid; serializes racing reconciles of it. */
async function lockDocument(
	tx: Tx,
	companyId: string,
	input: ReconcileInput,
): Promise<void> {
	if (input.invoiceId) {
		await tx
			.select({ id: invoices.id })
			.from(invoices)
			.where(
				and(
					eq(invoices.id, input.invoiceId),
					eq(invoices.companyId, companyId),
				),
			)
			.for("update");
		return;
	}
	await tx
		.select({ id: bills.id })
		.from(bills)
		.where(
			and(eq(bills.id, input.billId as string), eq(bills.companyId, companyId)),
		)
		.for("update");
}

type DocumentLink = { invoiceId?: string | null; billId?: string | null };

/** Integer cents → `"123.45"` for numeric(12,2) columns. */
function centsText(cents: number): string {
	if (!Number.isSafeInteger(cents) || cents < 0) {
		throw new ReconcileConflictError(
			"El saldo del comprobante quedaría negativo.",
		);
	}
	return `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

/** Status of a document that is open again: overdue once its due date has passed. */
function reopenedStatus(dueDate: Date): "SENT" | "OVERDUE" {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return dueDate < today ? "OVERDUE" : "SENT";
}

/**
 * Applies (`sign` 1) or reverses (`sign` -1) a bank movement's payment on the
 * linked document, inside the caller's transaction (document already locked).
 * Invoices move paid amount and open balance in cents; bills only change status.
 */
async function settleDocument(
	tx: Tx,
	companyId: string,
	link: DocumentLink,
	amountCents: number,
	paidOn: string,
	sign: 1 | -1,
): Promise<void> {
	if (link.invoiceId) {
		const where = and(
			eq(invoices.id, link.invoiceId),
			eq(invoices.companyId, companyId),
		);
		const [invoice] = await tx
			.select({
				status: invoices.status,
				dueDate: invoices.dueDate,
				paidAmount: invoices.paidAmount,
				balanceDue: invoices.balanceDue,
			})
			.from(invoices)
			.where(where);
		if (!invoice) return;
		const paid =
			bankAmountToCents(invoice.paidAmount, "CREDIT") + sign * amountCents;
		const balance =
			bankAmountToCents(invoice.balanceDue, "CREDIT") - sign * amountCents;
		const settled = balance === 0;
		const status = settled
			? "PAID"
			: invoice.status === "PAID"
				? reopenedStatus(invoice.dueDate)
				: invoice.status;
		await tx
			.update(invoices)
			.set({
				paidAmount: centsText(paid),
				balanceDue: centsText(balance),
				status,
				paidDate: settled ? new Date(`${paidOn}T00:00:00`) : null,
				updatedAt: new Date(),
			})
			.where(where);
		return;
	}
	if (!link.billId) return;
	const where = and(eq(bills.id, link.billId), eq(bills.companyId, companyId));
	const [bill] = await tx
		.select({ status: bills.status, dueDate: bills.dueDate })
		.from(bills)
		.where(where);
	if (!bill) return;
	const status =
		sign === 1
			? "PAID"
			: bill.status === "PAID"
				? reopenedStatus(bill.dueDate)
				: bill.status;
	await tx.update(bills).set({ status, updatedAt: new Date() }).where(where);
}

/** Positive cents of a stored movement amount. */
function movementCents(amount: string): number {
	return Math.abs(bankAmountToCents(amount, "CREDIT"));
}

/**
 * Data-access adapter for reconciliation reads and state transitions.
 *
 * @example
 * ```ts
 * const repo = new ReconciliationRepository();
 * ```
 */
export class ReconciliationRepository {
	async findPending(companyId: string, limit = 10) {
		return await db.query.bankTransactions.findMany({
			where: and(
				eq(bankTransactions.companyId, companyId),
				eq(bankTransactions.isReconciled, false),
			),
			orderBy: [
				asc(bankTransactions.transactionDate),
				asc(bankTransactions.createdAt),
				asc(bankTransactions.id),
			],
			limit,
		});
	}

	async findReconciled(companyId: string, limit = 50) {
		return await db.query.bankTransactions.findMany({
			where: and(
				eq(bankTransactions.companyId, companyId),
				eq(bankTransactions.isReconciled, true),
			),
			limit,
		});
	}

	/**
	 * Marks the movement reconciled. When it links an invoice or bill, the
	 * document row is locked so two movements cannot both pay it, and the
	 * movement must still be pending; otherwise {@link ReconcileConflictError}.
	 */
	async markReconciled(
		companyId: string,
		transactionId: string,
		input?: ReconcileInput,
	) {
		const values = {
			isReconciled: true,
			reconciledAt: new Date(),
			...(input?.invoiceId ? { invoiceId: input.invoiceId } : {}),
			...(input?.billId ? { billId: input.billId } : {}),
			...(input?.reconciledBy ? { reconciledBy: input.reconciledBy } : {}),
		};
		const ownTransaction = and(
			eq(bankTransactions.id, transactionId),
			eq(bankTransactions.companyId, companyId),
		);

		if (!input?.invoiceId && !input?.billId) {
			const [updated] = await db
				.update(bankTransactions)
				.set(values)
				.where(ownTransaction)
				.returning();
			return updated;
		}

		return await db.transaction(async (tx) => {
			await lockDocument(tx, companyId, input);
			const link = input.invoiceId
				? eq(bankTransactions.invoiceId, input.invoiceId)
				: eq(bankTransactions.billId, input.billId as string);
			const [taken] = await tx
				.select({ id: bankTransactions.id })
				.from(bankTransactions)
				.where(
					and(
						eq(bankTransactions.companyId, companyId),
						eq(bankTransactions.isReconciled, true),
						link,
					),
				)
				.limit(1);
			if (taken) {
				throw new ReconcileConflictError(
					"El comprobante ya fue conciliado con otro movimiento.",
				);
			}
			const [updated] = await tx
				.update(bankTransactions)
				.set(values)
				.where(and(ownTransaction, eq(bankTransactions.isReconciled, false)))
				.returning();
			if (!updated) {
				throw new ReconcileConflictError("El movimiento ya está conciliado.");
			}
			await settleDocument(
				tx,
				companyId,
				input,
				movementCents(updated.amount),
				updated.transactionDate,
				1,
			);
			return updated;
		});
	}

	/** Undoes the reconciliation and reverses the payment it applied to the linked document. */
	async markUnreconciled(companyId: string, transactionId: string) {
		const ownTransaction = and(
			eq(bankTransactions.id, transactionId),
			eq(bankTransactions.companyId, companyId),
		);
		return await db.transaction(async (tx) => {
			const [current] = await tx
				.select({
					isReconciled: bankTransactions.isReconciled,
					invoiceId: bankTransactions.invoiceId,
					billId: bankTransactions.billId,
					amount: bankTransactions.amount,
					transactionDate: bankTransactions.transactionDate,
				})
				.from(bankTransactions)
				.where(ownTransaction)
				.for("update");
			if (!current) return undefined;
			const link = {
				...(current.invoiceId ? { invoiceId: current.invoiceId } : {}),
				...(current.billId ? { billId: current.billId } : {}),
			};
			if (current.isReconciled && (link.invoiceId || link.billId)) {
				await lockDocument(tx, companyId, link);
				await settleDocument(
					tx,
					companyId,
					link,
					movementCents(current.amount),
					current.transactionDate,
					-1,
				);
			}
			const [updated] = await tx
				.update(bankTransactions)
				.set({
					isReconciled: false,
					reconciledAt: null,
					reconciledBy: null,
					invoiceId: null,
					billId: null,
				})
				.where(ownTransaction)
				.returning();
			return updated;
		});
	}

	async findAllByCompany(companyId: string) {
		return await db.query.bankTransactions.findMany({
			where: eq(bankTransactions.companyId, companyId),
		});
	}

	/** Issued, unpaid invoices (open balance) or bills of the company, amounts in cents. */
	async findOpenDocuments(
		companyId: string,
		kind: OpenDocument["kind"],
	): Promise<OpenDocument[]> {
		if (kind === "INVOICE") {
			const rows = await db
				.select({
					id: invoices.id,
					number: invoices.invoiceNumber,
					partnerName: businessPartners.legalName,
					issueDate: invoices.issueDate,
					dueDate: invoices.dueDate,
					open: invoices.balanceDue,
				})
				.from(invoices)
				.leftJoin(
					businessPartners,
					eq(invoices.customerId, businessPartners.id),
				)
				.where(
					and(
						eq(invoices.companyId, companyId),
						inArray(invoices.status, [...OPEN_STATUSES]),
						notLinked(companyId, eq(bankTransactions.invoiceId, invoices.id)),
					),
				);
			return rows
				.map((row) => ({
					kind,
					id: row.id,
					number: row.number,
					partnerName: row.partnerName ?? "",
					issueDate: isoDate(row.issueDate),
					dueDate: isoDate(row.dueDate),
					openCents: bankAmountToCents(row.open, "CREDIT"),
				}))
				.filter((doc) => doc.openCents > 0);
		}

		const rows = await db
			.select({
				id: bills.id,
				number: bills.billNumber,
				partnerName: businessPartners.legalName,
				issueDate: bills.issueDate,
				dueDate: bills.dueDate,
				open: bills.totalAmount,
			})
			.from(bills)
			.leftJoin(businessPartners, eq(bills.vendorId, businessPartners.id))
			.where(
				and(
					eq(bills.companyId, companyId),
					inArray(bills.status, [...OPEN_STATUSES]),
					notLinked(companyId, eq(bankTransactions.billId, bills.id)),
				),
			);
		return rows.map((row) => ({
			kind,
			id: row.id,
			number: row.number,
			partnerName: row.partnerName ?? "",
			issueDate: isoDate(row.issueDate),
			dueDate: isoDate(row.dueDate),
			openCents: bankAmountToCents(row.open, "CREDIT"),
		}));
	}

	async findById(companyId: string, transactionId: string) {
		return await db.query.bankTransactions.findFirst({
			where: and(
				eq(bankTransactions.companyId, companyId),
				eq(bankTransactions.id, transactionId),
			),
		});
	}
}

/**
 * Default reconciliation repository instance used by the feature services.
 *
 * @example
 * ```ts
 * await reconciliationRepository.findPending('cmp_1', 10);
 * ```
 */
export const reconciliationRepository = new ReconciliationRepository();
