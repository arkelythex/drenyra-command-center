/**
 * Get Inter-Company Stats — Query Handler
 *
 * Aggregates transaction data into business metrics:
 * totals, detraction breakdown by profile/rule, estimated time saved.
 */

import type { IInterCompanyTransactionRepository } from "../../domain/inter-company-transaction.repository";

/**
 * InterCompanyStats interface.
 *
 * @example
 * ```ts
 * const value: InterCompanyStats = {} as InterCompanyStats;
 * console.log(value);
 * ```
 */
export interface InterCompanyStats {
	totalTransactions: number;
	totalAmount: number;
	totalIGV: number;
	totalDetraction: number;
	detractionByProfile: Record<
		string,
		{ count: number; totalDetraction: number }
	>;
	detractionByRule: Record<string, { count: number; totalDetraction: number }>;
	timeSaved: { minutes: number; hours: number };
	avgTransactionAmount: number;
}

/**
 * GetStatsHandler class.
 *
 * @example
 * ```ts
 * const value = new GetStatsHandler();
 * console.log(value);
 * ```
 */
export class GetStatsHandler {
	constructor(
		private readonly repository: IInterCompanyTransactionRepository,
	) {}

	async execute(economicGroupId: string): Promise<InterCompanyStats> {
		const txs = await this.repository.findManyByGroup(economicGroupId);

		const totalAmount = txs.reduce((s, tx) => s + parseFloat(tx.amount), 0);
		const totalIGV = txs.reduce(
			(s, tx) => s + parseFloat(tx.igvAmount ?? "0"),
			0,
		);
		const totalDetraction = txs.reduce(
			(s, tx) => s + parseFloat(tx.detractionAmount ?? "0"),
			0,
		);

		const detractionByProfile = txs.reduce<
			Record<string, { count: number; totalDetraction: number }>
		>((acc, tx) => {
			if (!tx.detractionProfile) return acc;
			const key = tx.detractionProfile;
			acc[key] ??= { count: 0, totalDetraction: 0 };
			acc[key].count += 1;
			acc[key].totalDetraction += parseFloat(tx.detractionAmount ?? "0");
			return acc;
		}, {});

		const detractionByRule = txs.reduce<
			Record<string, { count: number; totalDetraction: number }>
		>((acc, tx) => {
			if (!tx.detractionRuleCode) return acc;
			const key = tx.detractionRuleCode;
			acc[key] ??= { count: 0, totalDetraction: 0 };
			acc[key].count += 1;
			acc[key].totalDetraction += parseFloat(tx.detractionAmount ?? "0");
			return acc;
		}, {});

		// 15 minutes saved per automated transaction vs manual process
		const timeSavedMinutes = txs.length * 15;

		return {
			totalTransactions: txs.length,
			totalAmount,
			totalIGV,
			totalDetraction,
			detractionByProfile,
			detractionByRule,
			timeSaved: {
				minutes: timeSavedMinutes,
				hours: Math.round(timeSavedMinutes / 60),
			},
			avgTransactionAmount: txs.length > 0 ? totalAmount / txs.length : 0,
		};
	}
}
