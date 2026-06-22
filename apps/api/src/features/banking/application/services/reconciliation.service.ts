/**
 * Reconciliation Service — Facade.
 * Orchestrates auto-reconciliation using matching engine and shadow metrics.
 * Split from 801 lines → 3 modules (types, shadow, matching) + facade.
 */

import { bankTransactions } from "@arkelythex/persistence/schema";
import { db } from "@arkelythex/persistence/client";
import { eq } from "@arkelythex/persistence/query";
import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { ReconciliationWorkerClient } from "../../../../shared/clients/reconciliation-worker.client";
import type { MatchCandidate } from "../../domain/services/matching-strategy";
import {
	AmountDateMatchingStrategy,
	AmountEntityMatchingStrategy,
	FuzzyEntityMatchingStrategy,
	type MatchingStrategy,
	PartialPaymentMatchingStrategy,
	ReferenceMatchingStrategy,
} from "../../domain/services/matching-strategy";
import type {
	RawBankTransaction,
	ReconciliationResult,
	ReconciliationShadowCutoverEvaluation,
	ReconciliationShadowMetricsSnapshot,
} from "./reconciliation.types";
import { MatchingEngine } from "./reconciliation-matching.service";
import { ShadowMetricsService } from "./reconciliation-shadow.service";

const MIN_MATCH_SCORE = 60;
const SHADOW_MODE_ENABLED =
	process.env.ARKELYTHEX_RECONCILIATION_SHADOW_MODE === "1";

export class ReconciliationService {
	private readonly logger = SecureLogger.namespace("ReconciliationService");
	private readonly matchingEngine: MatchingEngine;

	constructor(strategies?: MatchingStrategy[]) {
		const resolvedStrategies = strategies ?? [
			new ReferenceMatchingStrategy(),
			new AmountDateMatchingStrategy(),
			new AmountEntityMatchingStrategy(),
			new FuzzyEntityMatchingStrategy(),
			new PartialPaymentMatchingStrategy(),
		];

		this.matchingEngine = new MatchingEngine(resolvedStrategies);
	}

	static async getShadowMetrics(
		companyId?: string,
	): Promise<ReconciliationShadowMetricsSnapshot> {
		return ShadowMetricsService.getSnapshot(companyId);
	}

	static async evaluateShadowCutover(
		companyId?: string,
		windowRuns = 30,
	): Promise<ReconciliationShadowCutoverEvaluation> {
		return ShadowMetricsService.evaluateCutover(companyId, windowRuns);
	}

	async autoReconcile(
		companyId: string,
		accountId: string,
	): Promise<ReconciliationResult> {
		const transactions = await db.query.bankTransactions
			.findMany({
				where: eq(bankTransactions.isReconciled, false),
			})
			.then((rows) =>
				rows.filter(
					(r) => r.companyId === companyId && r.accountId === accountId,
				),
			);

		if (transactions.length === 0) {
			return { reconciledCount: 0, attemptedCount: 0, matches: [] };
		}

		const reconciledIds = new Set<string>();
		let reconciledCount = 0;
		const matches: ReconciliationResult["matches"] = [];

		for (const tx of transactions as unknown as RawBankTransaction[]) {
			if (reconciledIds.has(tx.id)) continue;

			const match = await this.matchingEngine.findBestMatch(
				tx,
				companyId,
				accountId,
			);
			if (!match || match.score < MIN_MATCH_SCORE) continue;

			const txIds = match.relatedTransactionIds?.length
				? match.relatedTransactionIds
				: [tx.id];

			for (const txId of txIds) {
				if (reconciledIds.has(txId)) continue;
				await this.reconcileAndLink(
					txId,
					match.documentId,
					match.documentType,
					match.score,
					match.criteria,
				);
				matches.push({
					transactionId: txId,
					documentId: match.documentId,
					documentType: match.documentType,
					matchScore: match.score,
					matchCriteria: match.criteria,
				});
				reconciledIds.add(txId);
				reconciledCount += 1;
			}
		}

		const result = {
			reconciledCount,
			attemptedCount: transactions.length,
			matches,
		};

		if (SHADOW_MODE_ENABLED && matches.length > 0) {
			await this.runGoShadowComparison(
				companyId,
				accountId,
				transactions as unknown as RawBankTransaction[],
				matches,
			);
		}

		return result;
	}

	private async reconcileAndLink(
		txId: string,
		documentId: string,
		documentType: "INVOICE" | "BILL",
		matchScore: number,
		matchCriteria: MatchCandidate["criteria"],
	): Promise<void> {
		await db
			.update(bankTransactions)
			.set({
				isReconciled: true,
				reconciledAt: new Date(),
				reconciledBy: null,
				...(documentType === "INVOICE"
					? { invoiceId: documentId }
					: { billId: documentId }),
			})
			.where(eq(bankTransactions.id, txId));

		this.logger.info("Transaction reconciled", {
			documentType,
			matchScore,
			matchCriteria,
		});
	}

	private async runGoShadowComparison(
		companyId: string,
		accountId: string,
		transactions: RawBankTransaction[],
		matches: ReconciliationResult["matches"],
	): Promise<void> {
		const startedAt = new Date();
		const toleranceCents = ShadowMetricsService.getToleranceCents();

		try {
			const health = await ReconciliationWorkerClient.healthCheck();
			if (health.status !== "ok") {
				this.logger.warn("Go reconciliation worker unavailable for shadow run");
				await ShadowMetricsService.persistShadowRun({
					companyId,
					accountId,
					status: "FAILED",
					localMatchedCount: matches.length,
					goMatchedCount: 0,
					discrepancyCount: matches.length,
					toleranceCents,
					errorMessage: "GO_WORKER_UNAVAILABLE",
					startedAt,
					completedAt: new Date(),
				});
				return;
			}

			const txById = new Map<string, RawBankTransaction>();
			for (const tx of transactions) txById.set(tx.id, tx);

			const sourceA: Array<{ reference: string; amountCents: number }> = [];
			const sourceB: Array<{ reference: string; amountCents: number }> = [];
			const docAmountCache = new Map<string, number | null>();

			for (const match of matches) {
				const tx = txById.get(match.transactionId);
				if (!tx) continue;

				const reference = this.normalizeReference(tx.reference ?? tx.id);
				const txAmountCents = MatchingEngine.amountToCents(tx.amount);
				sourceA.push({ reference, amountCents: txAmountCents });

				const cacheKey = `${match.documentType}:${match.documentId}`;
				let documentAmountCents = docAmountCache.get(cacheKey);
				if (documentAmountCents === undefined) {
					documentAmountCents = await this.findDocumentAmountCents(
						companyId,
						match.documentId,
						match.documentType,
					);
					docAmountCache.set(cacheKey, documentAmountCents);
				}

				if (documentAmountCents === null) continue;
				sourceB.push({ reference, amountCents: documentAmountCents });
			}

			if (sourceA.length === 0 || sourceB.length === 0) {
				this.logger.info(
					"Go reconciliation shadow skipped due to empty comparison set",
				);
				return;
			}

			const comparison = await ReconciliationWorkerClient.reconcile({
				sourceA,
				sourceB,
				toleranceCents,
			});

			await ShadowMetricsService.persistShadowRun({
				companyId,
				accountId,
				status: "SUCCESS",
				localMatchedCount: matches.length,
				goMatchedCount: comparison.matched,
				discrepancyCount: comparison.totalDiscrepancies,
				toleranceCents,
				errorMessage: null,
				startedAt,
				completedAt: new Date(),
			});

			this.logger.info("Go reconciliation shadow comparison completed", {
				matchedByLocalEngine: matches.length,
				matchedByGoWorker: comparison.matched,
				shadowDiscrepancies: comparison.totalDiscrepancies,
			});
		} catch (error: unknown) {
			await ShadowMetricsService.persistShadowRun({
				companyId,
				accountId,
				status: "FAILED",
				localMatchedCount: matches.length,
				goMatchedCount: 0,
				discrepancyCount: matches.length,
				toleranceCents,
				errorMessage: error instanceof Error ? error.message : String(error),
				startedAt,
				completedAt: new Date(),
			});
			this.logger.error("Go reconciliation shadow comparison failed", {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	private async findDocumentAmountCents(
		companyId: string,
		documentId: string,
		documentType: "INVOICE" | "BILL",
	): Promise<number | null> {
		if (documentType === "INVOICE") {
			const invoice = await db.query.invoices.findFirst({
				where: (t, { and, eq }) =>
					and(eq(t.companyId, companyId), eq(t.id, documentId)),
				columns: { balanceDue: true },
			});
			return invoice?.balanceDue
				? MatchingEngine.amountToCents(invoice.balanceDue)
				: null;
		}

		const bill = await db.query.bills.findFirst({
			where: (t, { and, eq }) =>
				and(eq(t.companyId, companyId), eq(t.id, documentId)),
			columns: { totalAmount: true },
		});
		return bill?.totalAmount
			? MatchingEngine.amountToCents(bill.totalAmount)
			: null;
	}

	private normalizeReference(ref: string): string {
		return ref
			.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
	}
}
