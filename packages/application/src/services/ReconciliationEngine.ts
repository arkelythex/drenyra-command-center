/**
 * Reconciliation Engine — Facade.
 * Automatic reconciliation engine that matches bank transactions with accounting entries.
 * Split from 564 lines → types extracted to reconciliation.types.ts.
 */

import type {
	AccountingEntry,
	BankMovement,
	ExtractedData,
	MatchDetails,
	ReconciliationConfig,
	ReconciliationMatch,
	ReconciliationResult,
} from "./reconciliation.types";
import {
	DEFAULT_CONFIG,
	extractDataFromDescription,
	normalizeText,
} from "./reconciliation.types";

export type {
	AccountingEntry,
	BankMovement,
	ExtractedData,
	MatchDetails,
	ReconciliationConfig,
	ReconciliationMatch,
	ReconciliationResult,
	ReconciliationStats,
} from "./reconciliation.types";
export {
	DEFAULT_CONFIG,
	extractDataFromDescription,
	normalizeText,
} from "./reconciliation.types";

/**
 * ReconciliationEngine class.
 */
export class ReconciliationEngine {
	private config: ReconciliationConfig;

	constructor(config: Partial<ReconciliationConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.validateConfig();
	}

	private validateConfig(): void {
		const totalWeight =
			this.config.amountWeight +
			this.config.dateWeight +
			this.config.descriptionWeight +
			this.config.documentWeight;
		if (Math.abs(totalWeight - 100) > 0.01)
			throw new Error(
				`Weight configuration must sum to 100, got ${totalWeight}`,
			);
	}

	reconcile(
		bankMovements: BankMovement[],
		accountingEntries: AccountingEntry[],
	): ReconciliationResult {
		const startTime = Date.now();
		const matches: ReconciliationMatch[] = [];
		const matchedBankIds = new Set<number>();
		const matchedAccountingIds = new Set<string>();

		for (const bankMovement of bankMovements) {
			if (bankMovement.isReconciled) continue;
			let bestMatch: ReconciliationMatch | null = null;
			let bestConfidence = 0;

			for (const entry of accountingEntries) {
				if (matchedAccountingIds.has(entry.id)) continue;
				const matchDetails = this.calculateMatch(bankMovement, entry);
				const confidence = this.calculateConfidence(matchDetails);
				if (
					confidence >= this.config.minConfidence &&
					confidence > bestConfidence
				) {
					bestConfidence = confidence;
					bestMatch = {
						bankMovement,
						accountingEntry: entry,
						confidence,
						matchDetails,
					};
				}
			}

			if (bestMatch) {
				matches.push(bestMatch);
				matchedBankIds.add(bankMovement.id);
				matchedAccountingIds.add(bestMatch.accountingEntry.id);
			}
		}

		const unmatchedBank = bankMovements.filter(
			(m) => !matchedBankIds.has(m.id) && !m.isReconciled,
		);
		const unmatchedAccounting = accountingEntries.filter(
			(e) => !matchedAccountingIds.has(e.id),
		);
		const autoReconciledCount = matches.filter(
			(m) => m.confidence >= this.config.autoReconcileThreshold,
		).length;
		const averageConfidence =
			matches.length > 0
				? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length
				: 0;

		return {
			matches,
			unmatchedBank,
			unmatchedAccounting,
			stats: {
				totalBankMovements: bankMovements.length,
				totalAccountingEntries: accountingEntries.length,
				matchedCount: matches.length,
				autoReconciledCount,
				averageConfidence: Math.round(averageConfidence * 100) / 100,
				processingTimeMs: Date.now() - startTime,
			},
		};
	}

	private calculateMatch(
		bankMovement: BankMovement,
		entry: AccountingEntry,
	): MatchDetails {
		const extractedData = extractDataFromDescription(bankMovement.description);
		return {
			amountScore: this.calculateAmountScore(bankMovement, entry),
			dateScore: this.calculateDateScore(bankMovement.date, entry.date),
			descriptionScore: this.calculateDescriptionScore(
				bankMovement.description,
				entry.description,
				entry.thirdPartyName,
			),
			documentScore: this.calculateDocumentScore(extractedData, entry),
			extractedData,
		};
	}

	private calculateConfidence(details: MatchDetails): number {
		return Math.round(
			details.amountScore * (this.config.amountWeight / 100) +
				details.dateScore * (this.config.dateWeight / 100) +
				details.descriptionScore * (this.config.descriptionWeight / 100) +
				details.documentScore * (this.config.documentWeight / 100),
		);
	}

	private calculateAmountScore(
		bankMovement: BankMovement,
		entry: AccountingEntry,
	): number {
		const bankAmount = Math.abs(bankMovement.amount);
		const entryAmount =
			bankMovement.type === "CREDIT" ? entry.credit : entry.debit;
		if (entryAmount === 0) return 0;
		const diff = Math.abs(bankAmount - entryAmount);
		if (diff <= this.config.amountTolerance) return 100;
		const percentDiff = (diff / bankAmount) * 100;
		if (percentDiff <= 0.1) return 95;
		if (percentDiff <= 0.5) return 85;
		if (percentDiff <= 1) return 70;
		if (percentDiff <= 2) return 50;
		if (percentDiff <= 5) return 30;
		return 0;
	}

	private calculateDateScore(bankDate: Date, entryDate: Date): number {
		const daysDiff = Math.abs(
			(bankDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		if (daysDiff === 0) return 100;
		if (daysDiff <= 1) return 95;
		if (daysDiff <= 2) return 85;
		if (daysDiff <= 3) return 70;
		if (daysDiff <= 5) return 50;
		if (daysDiff <= this.config.dateToleranceDays) return 30;
		return 0;
	}

	private calculateDescriptionScore(
		bankDesc: string,
		entryDesc: string,
		thirdPartyName?: string,
	): number {
		const normalizedBank = normalizeText(bankDesc);
		const normalizedEntry = normalizeText(entryDesc);
		const normalizedThirdParty = thirdPartyName
			? normalizeText(thirdPartyName)
			: "";
		let maxScore = 0;

		if (
			normalizedBank.includes(normalizedEntry) ||
			normalizedEntry.includes(normalizedBank)
		)
			maxScore = Math.max(maxScore, 80);
		if (normalizedThirdParty && normalizedBank.includes(normalizedThirdParty))
			maxScore = Math.max(maxScore, 90);

		const bankWords = new Set(normalizedBank.split(/\s+/));
		const entryWords = new Set(normalizedEntry.split(/\s+/));
		let matchingWords = 0;
		for (const word of entryWords) {
			if (word.length > 2 && bankWords.has(word)) matchingWords++;
		}
		const wordOverlapScore =
			entryWords.size > 0 ? (matchingWords / entryWords.size) * 100 : 0;
		return Math.round(Math.max(maxScore, wordOverlapScore));
	}

	private calculateDocumentScore(
		extracted: ExtractedData,
		entry: AccountingEntry,
	): number {
		let score = 0;
		if (
			extracted.invoiceNumber &&
			entry.documentNumber?.includes(extracted.invoiceNumber)
		)
			score = Math.max(score, 100);
		if (
			extracted.invoiceSeries &&
			entry.documentNumber?.startsWith(extracted.invoiceSeries)
		)
			score = Math.max(score, 70);
		if (
			extracted.ruc &&
			entry.thirdPartyRuc &&
			entry.thirdPartyRuc === extracted.ruc
		)
			score = Math.max(score, 90);
		if (extracted.amounts && extracted.amounts.length > 0) {
			const entryTotal = entry.debit || entry.credit;
			for (const amount of extracted.amounts) {
				if (Math.abs(amount - entryTotal) < 0.01) {
					score = Math.max(score, 80);
					break;
				}
			}
		}
		return score;
	}

	getAutoReconcileMatches(result: ReconciliationResult): ReconciliationMatch[] {
		return result.matches.filter(
			(m) => m.confidence >= this.config.autoReconcileThreshold,
		);
	}

	getManualReviewMatches(result: ReconciliationResult): ReconciliationMatch[] {
		return result.matches.filter(
			(m) =>
				m.confidence >= this.config.minConfidence &&
				m.confidence < this.config.autoReconcileThreshold,
		);
	}
}

export function createReconciliationEngine(
	config: Partial<ReconciliationConfig> = {},
): ReconciliationEngine {
	return new ReconciliationEngine(config);
}
