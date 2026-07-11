import type { HubArtifact } from "@drenyra/shared/artifacts";
import type { CognitiveMessage } from "@/features/cognitive-hub/types/hub.types";

export interface ArtifactFeedEntry {
	artifact: HubArtifact;
	messageTimestamp: Date;
}

export function collectArtifacts(
	messages: CognitiveMessage[],
): ArtifactFeedEntry[] {
	const entries: ArtifactFeedEntry[] = [];
	for (const msg of messages) {
		if (!msg.artifacts || msg.artifacts.length === 0) continue;
		for (const artifact of msg.artifacts) {
			entries.push({ artifact, messageTimestamp: msg.timestamp });
		}
	}
	return entries;
}

export function artifactSummary(artifact: HubArtifact): string {
	switch (artifact.type) {
		case "accounting_diff":
			return `${artifact.payload.diffs.length} cambios propuestos`;
		case "sheet_diff":
			return `${artifact.payload.summary.total} registros (${artifact.payload.summary.updated} actualizados, ${artifact.payload.summary.flagged} flagged)`;
		case "dashboard": {
			const pm = artifact.payload.primaryMetric;
			return `${pm.value} (${pm.trend}) — Score: ${artifact.payload.statusScore}%`;
		}
		case "simulation":
			return `${artifact.payload.entries.length} asientos simulados`;
		case "comparison":
			return `${artifact.payload.scenarios.length} escenarios`;
		case "banking_reconciliation":
			return `${artifact.payload.rows.length} movimientos (Diff: ${artifact.payload.summary.totalDifference})`;
		case "bills_payable":
			return `${artifact.payload.summary.count} cuentas ($${artifact.payload.summary.totalPending} pendiente)`;
		case "cashflow_projection":
			return `${artifact.payload.projections.length} períodos proyectados`;
		case "tax_summary":
			return `${artifact.payload.rows.length} tributos ($${artifact.payload.summary.totalPayable} a pagar)`;
		case "payroll_summary":
			return `${artifact.payload.summary.employeeCount} empleados ($${artifact.payload.summary.totalNetPay} neto)`;
		default:
			return "";
	}
}

export const ARTIFACT_TYPE_COLORS: Record<string, string> = {
	explanation: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
	chart: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
	table: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
	action_card: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
	simulation: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
	comparison: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
	accounting_diff: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
	sheet_diff: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
	banking_reconciliation:
		"bg-[var(--color-success)]/10 text-[var(--color-success)]",
	bills_payable: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
	cashflow_projection:
		"bg-[var(--color-success)]/10 text-[var(--color-success)]",
	tax_summary: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
	payroll_summary: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
	dashboard: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
	search_result: "bg-[var(--text-tertiary)]/10 text-[var(--text-tertiary)]",
	report: "bg-[var(--text-secondary)]/10 text-[var(--text-secondary)]",
	knowledge_graph: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
};
