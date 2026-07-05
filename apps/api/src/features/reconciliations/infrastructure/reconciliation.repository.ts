import { db } from "@drenyra/persistence/client";
import { and, eq } from "@drenyra/persistence/query";
import { bankTransactions } from "@drenyra/persistence/schema";

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

	async markReconciled(
		companyId: string,
		transactionId: string,
		_input?: ReconcileInput,
	) {
		const [updated] = await db
			.update(bankTransactions)
			.set({
				isReconciled: true,
				reconciledAt: new Date(),
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

	async markUnreconciled(companyId: string, transactionId: string) {
		const [updated] = await db
			.update(bankTransactions)
			.set({
				isReconciled: false,
				reconciledAt: null,
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
