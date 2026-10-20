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
			return updated;
		});
	}

	async markUnreconciled(companyId: string, transactionId: string) {
		const [updated] = await db
			.update(bankTransactions)
			.set({
				isReconciled: false,
				reconciledAt: null,
				reconciledBy: null,
				invoiceId: null,
				billId: null,
			})
			.where(
				and(
					eq(bankTransactions.id, transactionId),
					eq(bankTransactions.companyId, companyId),
				),
			)
			.returning();

		return updated;
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
