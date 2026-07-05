import { createHash } from "node:crypto";
import type {
	ComplianceReproducibilityReport,
	ComplianceRoadmapAction,
	ComplianceRoadmapActionId,
} from "@drenyra/domain";

export function readPeriodTotal(
	rows: Array<{ type: string | null; total: number }>,
	type: "INCOME" | "EXPENSE",
): number {
	const row = rows.find((entry) => entry.type === type);
	return Number(row?.total ?? 0);
}

export function clampScore(value: number): number {
	return Math.max(0, Math.min(100, Number(value.toFixed(1))));
}

export function buildRoadmapFocus(input: {
	blockingIssues: number;
	reproducibility: ComplianceReproducibilityReport;
	pendingSunatInvoices: number;
}): string[] {
	const focus = new Set<string>();
	if (input.blockingIssues > 0) {
		focus.add("Close critical and high-severity compliance findings.");
	}
	if (!input.reproducibility.reproducible) {
		focus.add("Resolve SIRE vs ledger reproducibility mismatches before monthly close.");
	}
	if (input.pendingSunatInvoices > 0) {
		focus.add("Submit pending SUNAT documents and confirm CDR lifecycle evidence.");
	}
	if (focus.size === 0) {
		focus.add("Maintain current controls and monitor drift daily.");
	}
	return Array.from(focus);
}

export function buildRoadmapActions(input: {
	companyId: string;
	period: string;
	recommendedAt: string;
	pendingSunatInvoices: number;
	overdueInvoices: number;
	cashflowGap: number;
	reproducibility: ComplianceReproducibilityReport;
}): ComplianceRoadmapAction[] {
	const actions: ComplianceRoadmapAction[] = [];
	const pushAction = (
		actionId: ComplianceRoadmapActionId,
		title: string,
		description: string,
		impact: string,
		confidence: number,
		automationLevel: "one-click" | "review-required",
	): void => {
		actions.push({
			id: actionId,
			traceId: buildRoadmapTraceId(input.companyId, input.period, actionId),
			recommendedAt: input.recommendedAt,
			title,
			description,
			impact,
			confidence,
			automationLevel,
		});
	};

	if (input.pendingSunatInvoices > 0) {
		pushAction(
			"prepare-sire",
			"Prepare SIRE package with approval gate",
			`${input.pendingSunatInvoices} SUNAT-pending documents detected. Queue a controlled SIRE preparation run.`,
			"Reduces filing risk and shortens monthly close.",
			0.91,
			"one-click",
		);
	}
	if (input.overdueInvoices > 0) {
		pushAction(
			"collect-overdue-invoices",
			"Prioritize overdue collections",
			`${input.overdueInvoices} overdue invoices are dragging fiscal predictability.`,
			"Improves liquidity and lowers late-payment exposure.",
			0.84,
			"review-required",
		);
	}
	if (input.cashflowGap < 0) {
		pushAction(
			"stabilize-cashflow",
			"Stabilize cashflow for current period",
			`Current period cashflow gap is S/ ${Math.abs(input.cashflowGap).toFixed(2)}.`,
			"Helps avoid short-term solvency stress.",
			0.8,
			"review-required",
		);
	}
	if (!input.reproducibility.reproducible) {
		pushAction(
			"resolve-ledger-repro-mismatch",
			"Resolve ledger vs SIRE reproducibility mismatch",
			`Detected variance in records (${input.reproducibility.differences.recordCount}) or totals.`,
			"Restores audit traceability before submission.",
			0.94,
			"review-required",
		);
	}
	if (actions.length === 0) {
		pushAction(
			"stabilize-cashflow",
			"Run periodic copilot health check",
			"No critical blockers detected. Keep automation cadence and monitor anomalies.",
			"Preserves reliability while scaling automation.",
			0.76,
			"review-required",
		);
	}

	return actions;
}

export function buildRoadmapTraceId(
	companyId: string,
	period: string,
	actionId: ComplianceRoadmapActionId,
): string {
	const digest = createHash("sha256")
		.update(`${companyId}:${period}:${actionId}`)
		.digest("hex")
		.slice(0, 16);
	return `rmp_${digest}`;
}
