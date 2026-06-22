/**
 * Compliance Service
 * SUNAT compliance monitoring and issue tracking
 */

import {
	customers,
	invoices,
	transactions,
} from "@arkelythex/persistence/schema";
import { db } from "@arkelythex/persistence/client";
import { and, eq, gte, lte, sql } from "@arkelythex/persistence/query";
import { SIRE_LEDGER_REPRO_RUNBOOK } from "../lib/compliance-runbooks";
import type {
	ComplianceDashboard,
	ComplianceIssue,
	ComplianceReproducibilityReport,
} from "../types/compliance.types";

const PENDING_SUNAT_STATUS_CLAUSE = sql`${invoices.sunatStatus} IS NULL OR ${invoices.sunatStatus} IN ('DRAFT', 'SUBMITTED', 'OBSERVED')`;

export class ComplianceService {
	/**
	 * Get compliance dashboard
	 */
	static async getDashboard(companyId: string): Promise<ComplianceDashboard> {
		const issues = await ComplianceService.scanIssues(companyId);

		const criticalIssues = issues.filter(
			(i) => i.severity === "CRITICAL",
		).length;
		const highIssues = issues.filter((i) => i.severity === "HIGH").length;
		const mediumIssues = issues.filter((i) => i.severity === "MEDIUM").length;
		const lowIssues = issues.filter((i) => i.severity === "LOW").length;

		// Calculate compliance score (100 - penalties)
		let score = 100;
		score -= criticalIssues * 20;
		score -= highIssues * 10;
		score -= mediumIssues * 5;
		score -= lowIssues * 2;
		score = Math.max(0, score);

		let sunatStatus: "COMPLIANT" | "WARNINGS" | "NON_COMPLIANT";
		if (score >= 90) sunatStatus = "COMPLIANT";
		else if (score >= 70) sunatStatus = "WARNINGS";
		else sunatStatus = "NON_COMPLIANT";

		return {
			score,
			totalIssues: issues.length,
			criticalIssues,
			highIssues,
			mediumIssues,
			lowIssues,
			sunatStatus,
			lastAudit: new Date(),
		};
	}

	/**
	 * Scan for compliance issues
	 */
	static async scanIssues(companyId: string): Promise<ComplianceIssue[]> {
		const issues: ComplianceIssue[] = [];

		// Check for invoices without SUNAT status
		const pendingSUNAT = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(invoices)
			.where(
				and(eq(invoices.companyId, companyId), PENDING_SUNAT_STATUS_CLAUSE),
			);

		if (pendingSUNAT[0]?.count > 0) {
			issues.push({
				id: crypto.randomUUID(),
				companyId,
				type: "MISSING_SUNAT",
				severity: "HIGH",
				title: "Invoices pending SUNAT submission",
				description: `${pendingSUNAT[0].count} invoices have not been submitted to SUNAT`,
				createdAt: new Date(),
			});
		}

		// Check for overdue invoices
		const overdue = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(invoices)
			.where(
				and(eq(invoices.companyId, companyId), eq(invoices.status, "OVERDUE")),
			);

		if (overdue[0]?.count > 0) {
			issues.push({
				id: crypto.randomUUID(),
				companyId,
				type: "OVERDUE_INVOICE",
				severity: "MEDIUM",
				title: "Overdue invoices",
				description: `${overdue[0].count} invoices are overdue`,
				createdAt: new Date(),
			});
		}

		// Check for invalid RUCs
		const invalidRUCs = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(customers)
			.where(
				and(
					eq(customers.companyId, companyId),
					sql`LENGTH(${customers.taxId}) != 11`,
				),
			);

		if (invalidRUCs[0]?.count > 0) {
			issues.push({
				id: crypto.randomUUID(),
				companyId,
				type: "INVALID_RUC",
				severity: "LOW",
				title: "Invalid RUC numbers",
				description: `${invalidRUCs[0].count} customers have invalid RUC format`,
				createdAt: new Date(),
			});
		}

		return issues;
	}

	/**
	 * Get issues list
	 */
	static async getIssues(companyId: string): Promise<ComplianceIssue[]> {
		return await ComplianceService.scanIssues(companyId);
	}

	/**
	 * Resolve issue
	 */
	static async resolveIssue(_issueId: string): Promise<void> {
		// In a real implementation, this would update a database record
		// For now, it's a placeholder
	}

	/**
	 * Verify SIRE totals are reproducible from ledger evidence.
	 */
	static async verifySireReproducibility(input: {
		companyId: string;
		year: number;
		month: number;
		totalTolerance?: number;
		igvTolerance?: number;
		recordTolerance?: number;
	}): Promise<ComplianceReproducibilityReport> {
		const {
			companyId,
			year,
			month,
			totalTolerance = 0.01,
			igvTolerance = 0.01,
			recordTolerance = 0,
		} = input;

		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0);

		const sireSummary = await db
			.select({
				count: sql<number>`COUNT(*)`,
				total: sql<number>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
				igv: sql<number>`COALESCE(SUM(CAST(${invoices.igvAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					gte(invoices.issueDate, startDate),
					lte(invoices.issueDate, endDate),
				),
			);

		const ledgerSummary = await db
			.select({
				count: sql<number>`COUNT(*)`,
				total: sql<number>`COALESCE(SUM(CAST(${transactions.totalAmount} AS DECIMAL)), 0)`,
				igv: sql<number>`COALESCE(SUM(CAST(${transactions.igvAmount} AS DECIMAL)), 0)`,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.companyId, companyId),
					eq(transactions.type, "INCOME"),
					gte(transactions.issueDate, startDate),
					lte(transactions.issueDate, endDate),
					sql`${transactions.documentType} IN ('FACTURA', 'BOLETA', 'NOTA_CREDITO', 'NOTA_DEBITO')`,
				),
			);

		const sire = {
			recordCount: Number(sireSummary[0]?.count ?? 0),
			totalAmount: Number(sireSummary[0]?.total ?? 0),
			totalIGV: Number(sireSummary[0]?.igv ?? 0),
		};

		const ledger = {
			recordCount: Number(ledgerSummary[0]?.count ?? 0),
			totalAmount: Number(ledgerSummary[0]?.total ?? 0),
			totalIGV: Number(ledgerSummary[0]?.igv ?? 0),
		};

		const differences = {
			recordCount: Math.abs(sire.recordCount - ledger.recordCount),
			totalAmount: Math.abs(sire.totalAmount - ledger.totalAmount),
			totalIGV: Math.abs(sire.totalIGV - ledger.totalIGV),
		};

		const tolerances = {
			recordCount: recordTolerance,
			totalAmount: totalTolerance,
			totalIGV: igvTolerance,
		};

		const reproducible =
			differences.recordCount <= tolerances.recordCount &&
			differences.totalAmount <= tolerances.totalAmount &&
			differences.totalIGV <= tolerances.totalIGV;

		const coverage: ComplianceReproducibilityReport["coverage"] =
			sire.recordCount === 0 && ledger.recordCount === 0
				? "NO_DATA"
				: sire.recordCount === 0 || ledger.recordCount === 0
					? "PARTIAL_DATA"
					: "COMPLETE_DATA";

		return {
			period: `${year}-${month.toString().padStart(2, "0")}`,
			companyId,
			reproducible,
			coverage,
			sire,
			ledger,
			differences,
			tolerances,
			...(reproducible ? {} : { runbookId: SIRE_LEDGER_REPRO_RUNBOOK.id }),
		};
	}
}
