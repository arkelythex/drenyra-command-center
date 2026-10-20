import {
	type BankDirection,
	bankAmountToCents,
	rankMatches,
} from "../../domain/bank-matching";
import {
	type ReconcileInput,
	type ReconciliationRepository,
	reconciliationRepository,
} from "../../infrastructure/reconciliation.repository";

/** The document to link is not one the movement can pay (other company, amount or direction). */
export class ReconcileRejectedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ReconcileRejectedError";
	}
}

type BankTransactionRow = {
	id: string;
	description: string;
	reference: string | null;
	transactionDate: string;
	type: string;
	amount: string;
};

type ReconciliationRepoContract = Pick<
	ReconciliationRepository,
	| "findPending"
	| "findReconciled"
	| "markReconciled"
	| "markUnreconciled"
	| "findAllByCompany"
	| "findById"
	| "findOpenDocuments"
>;

/**
 * Application service orchestrating reconciliation use cases over the repository contract.
 *
 * @example
 * ```ts
 * const service = new ReconciliationService();
 * ```
 */
export class ReconciliationService {
	constructor(
		private readonly repository: ReconciliationRepoContract = reconciliationRepository,
	) {}

	async getPending(companyId: string, limit = 10) {
		return this.repository.findPending(
			companyId,
			this.normalizeLimit(limit, 10),
		);
	}

	/**
	 * Marks the movement reconciled. When it links an invoice or bill, that
	 * document must be one of the current proposals (same company, direction
	 * and exact open amount); otherwise {@link ReconcileRejectedError}.
	 */
	async reconcile(
		companyId: string,
		transactionId: string,
		reconciliationData?: ReconcileInput,
	) {
		const linkedId =
			reconciliationData?.invoiceId ?? reconciliationData?.billId;
		if (linkedId) {
			const proposals = await this.findMatches(companyId, transactionId);
			if (!proposals) return null;
			const kind = reconciliationData?.invoiceId ? "INVOICE" : "BILL";
			const proposed = proposals.matches.some(
				(match) => match.documentId === linkedId && match.kind === kind,
			);
			if (!proposed) {
				throw new ReconcileRejectedError(
					"El comprobante no corresponde a este movimiento (empresa, sentido o monto).",
				);
			}
		}
		return this.repository.markReconciled(
			companyId,
			transactionId,
			reconciliationData,
		);
	}

	async getReconciled(companyId: string, limit = 50) {
		return this.repository.findReconciled(
			companyId,
			this.normalizeLimit(limit, 50),
		);
	}

	async unreconcile(companyId: string, transactionId: string) {
		return this.repository.markUnreconciled(companyId, transactionId);
	}

	/** Counts and totals in integer cents (magnitudes); corrupt amounts are counted apart. */
	async getStats(companyId: string) {
		const allTransactions = await this.repository.findAllByCompany(companyId);
		let invalidAmounts = 0;
		const totals = { reconciled: 0, pending: 0 };
		const counts = { reconciled: 0, pending: 0 };

		for (const tx of allTransactions) {
			const bucket = tx.reconciledAt !== null ? "reconciled" : "pending";
			counts[bucket] += 1;
			try {
				totals[bucket] += bankAmountToCents(String(tx.amount), "CREDIT");
			} catch {
				invalidAmounts += 1;
			}
		}

		return {
			total: allTransactions.length,
			reconciled: { count: counts.reconciled, amountCents: totals.reconciled },
			pending: { count: counts.pending, amountCents: totals.pending },
			invalidAmounts,
			percentage:
				allTransactions.length > 0
					? (counts.reconciled / allTransactions.length) * 100
					: 0,
		};
	}

	/** Open invoices (money in) or bills (money out) this movement may pay, best first. */
	async findMatches(companyId: string, transactionId: string) {
		const transaction = (await this.repository.findById(
			companyId,
			transactionId,
		)) as BankTransactionRow | null | undefined;
		if (!transaction) {
			return null;
		}

		const amountCents = bankAmountToCents(
			transaction.amount,
			transaction.type as BankDirection,
		);
		const documents = await this.repository.findOpenDocuments(
			companyId,
			amountCents > 0 ? "INVOICE" : "BILL",
		);
		const matches = rankMatches(
			{
				id: transaction.id,
				description: transaction.description,
				reference: transaction.reference,
				transactionDate: transaction.transactionDate,
				amountCents,
			},
			documents,
		);

		return {
			transactionId,
			amountCents,
			matches,
			confidence: matches[0]?.score ?? 0,
		};
	}

	private normalizeLimit(limit: number, fallback: number): number {
		if (!Number.isFinite(limit)) return fallback;
		const normalized = Math.trunc(limit);
		if (normalized < 1) return fallback;
		if (normalized > 200) return 200;
		return normalized;
	}
}
