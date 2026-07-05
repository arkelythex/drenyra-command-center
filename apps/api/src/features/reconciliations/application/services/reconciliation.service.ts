import {
	type ReconcileInput,
	type ReconciliationRepository,
	reconciliationRepository,
} from "../../infrastructure/reconciliation.repository";

type ReconciliationRepoContract = Pick<
	ReconciliationRepository,
	| "findPending"
	| "findReconciled"
	| "markReconciled"
	| "markUnreconciled"
	| "findAllByCompany"
	| "findById"
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

	async reconcile(
		companyId: string,
		transactionId: string,
		reconciliationData?: ReconcileInput,
	) {
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

	async getStats(companyId: string) {
		const allTransactions = await this.repository.findAllByCompany(companyId);
		const reconciled = allTransactions.filter((tx) => tx.reconciledAt !== null);
		const pending = allTransactions.filter((tx) => tx.reconciledAt === null);

		const reconciledTotal = reconciled.reduce(
			(sum, tx) => sum + this.parseAmount(tx.amount),
			0,
		);
		const pendingTotal = pending.reduce(
			(sum, tx) => sum + this.parseAmount(tx.amount),
			0,
		);

		return {
			total: allTransactions.length,
			reconciled: {
				count: reconciled.length,
				amount: reconciledTotal,
			},
			pending: {
				count: pending.length,
				amount: pendingTotal,
			},
			percentage:
				allTransactions.length > 0
					? (reconciled.length / allTransactions.length) * 100
					: 0,
		};
	}

	async findMatches(companyId: string, transactionId: string) {
		const transaction = await this.repository.findById(
			companyId,
			transactionId,
		);
		if (!transaction) {
			return null;
		}

		return {
			transactionId,
			matches: [],
			confidence: 0,
		};
	}

	private parseAmount(raw: string): number {
		const amount = Number.parseFloat(raw);
		return Number.isFinite(amount) ? amount : 0;
	}

	private normalizeLimit(limit: number, fallback: number): number {
		if (!Number.isFinite(limit)) return fallback;
		const normalized = Math.trunc(limit);
		if (normalized < 1) return fallback;
		if (normalized > 200) return 200;
		return normalized;
	}
}
