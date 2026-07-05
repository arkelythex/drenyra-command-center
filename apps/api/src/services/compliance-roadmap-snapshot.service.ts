import { invoices, transactions } from "@drenyra/persistence/schema";
import { db } from "@drenyra/persistence/client";
import { and, eq, gte, lte, sql } from "@drenyra/persistence/query";
import type {
	ComplianceRoadmapAction,
	ComplianceRoadmapActionId,
	ComplianceRoadmapSnapshot,
} from "@drenyra/domain";
import {
	buildRoadmapActions,
	buildRoadmapFocus,
	clampScore,
	readPeriodTotal,
} from "./compliance-roadmap-snapshot.helpers";
import { ComplianceService } from "./compliance.service";

const PENDING_SUNAT_STATUS_CLAUSE = sql`${invoices.sunatStatus} IS NULL OR ${invoices.sunatStatus} IN ('DRAFT', 'SUBMITTED', 'OBSERVED')`;

export class ComplianceRoadmapSnapshotService {
	static async getRoadmapMvpSnapshot(input: {
		companyId: string;
		year: number;
		month: number;
	}): Promise<ComplianceRoadmapSnapshot> {
		const { companyId, year, month } = input;
		const period = `${year}-${month.toString().padStart(2, "0")}`;
		const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
		const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

		const [
			dashboard,
			issues,
			reproducibility,
			periodTotals,
			overdueRows,
			pendingSunatRows,
		] = await Promise.all([
			ComplianceService.getDashboard(companyId),
			ComplianceService.scanIssues(companyId),
			ComplianceService.verifySireReproducibility({ companyId, year, month }),
			db
				.select({
					type: transactions.type,
					total: sql<number>`COALESCE(SUM(CAST(${transactions.totalAmount} AS DECIMAL)), 0)`,
				})
				.from(transactions)
				.where(
					and(
						eq(transactions.companyId, companyId),
						gte(transactions.issueDate, startDate),
						lte(transactions.issueDate, endDate),
					),
				)
				.groupBy(transactions.type),
			db
				.select({ count: sql<number>`COUNT(*)` })
				.from(invoices)
				.where(
					and(
						eq(invoices.companyId, companyId),
						eq(invoices.status, "OVERDUE"),
					),
				),
			db
				.select({ count: sql<number>`COUNT(*)` })
				.from(invoices)
				.where(
					and(eq(invoices.companyId, companyId), PENDING_SUNAT_STATUS_CLAUSE),
				),
		]);

		const periodIncome = readPeriodTotal(periodTotals, "INCOME");
		const periodExpense = readPeriodTotal(periodTotals, "EXPENSE");
		const cashflowGap = Number((periodIncome - periodExpense).toFixed(2));
		const overdueInvoices = Number(overdueRows[0]?.count ?? 0);
		const pendingSunatInvoices = Number(pendingSunatRows[0]?.count ?? 0);

		const blockingIssues = issues.filter(
			(issue) => issue.severity === "CRITICAL" || issue.severity === "HIGH",
		).length;
		const reproducibilityPenalty = !reproducibility.reproducible
			? reproducibility.coverage === "NO_DATA"
				? 16
				: 12
			: 0;
		const reliabilityScore = clampScore(
			dashboard.score -
				reproducibilityPenalty -
				Math.max(0, blockingIssues - 1) * 2,
		);

		let insightScore = 100;
		if (cashflowGap < 0) insightScore -= 20;
		insightScore -= Math.min(overdueInvoices * 4, 20);
		insightScore -= Math.min(pendingSunatInvoices * 3, 18);
		if (!reproducibility.reproducible) insightScore -= 15;

		const generatedAt = new Date().toISOString();
		const recommendedActions = buildRoadmapActions({
			companyId,
			period,
			recommendedAt: generatedAt,
			pendingSunatInvoices,
			overdueInvoices,
			cashflowGap,
			reproducibility,
		});

		const nextFocus = buildRoadmapFocus({
			blockingIssues,
			reproducibility,
			pendingSunatInvoices,
		});

		return {
			companyId,
			period,
			generatedAt,
			phase1: {
				objective: "Most reliable accounting operation in Peru",
				reliabilityScore,
				sunatStatus: dashboard.sunatStatus,
				blockingIssues,
				openIssues: issues.length,
				ledgerReproducible: reproducibility.reproducible,
				reproducibilityCoverage: reproducibility.coverage,
				differences: reproducibility.differences,
				nextFocus,
			},
			phase2: {
				objective: "Accounting copilot with actionable automation",
				insightScore: clampScore(insightScore),
				periodIncome,
				periodExpense,
				cashflowGap,
				overdueInvoices,
				pendingSunatInvoices,
				recommendedActions,
			},
		};
	}

	static findRoadmapRecommendation(input: {
		snapshot: ComplianceRoadmapSnapshot;
		actionId: ComplianceRoadmapActionId;
		traceId: string;
	}): ComplianceRoadmapAction {
		const action = input.snapshot.phase2.recommendedActions.find(
			(candidate) => candidate.id === input.actionId,
		);
		if (!action) throw new Error("ROADMAP_ACTION_NOT_AVAILABLE");
		if (action.traceId !== input.traceId) throw new Error("ROADMAP_TRACE_MISMATCH");
		return action;
	}
}
