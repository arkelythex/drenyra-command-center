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
	explanation: "bg-blue-500/10 text-blue-500",
	chart: "bg-purple-500/10 text-purple-500",
	table: "bg-cyan-500/10 text-cyan-500",
	action_card: "bg-amber-500/10 text-amber-500",
	simulation: "bg-violet-500/10 text-violet-500",
	comparison: "bg-indigo-500/10 text-indigo-500",
	accounting_diff: "bg-orange-500/10 text-orange-500",
	sheet_diff: "bg-orange-500/10 text-orange-500",
	banking_reconciliation: "bg-emerald-500/10 text-emerald-500",
	bills_payable: "bg-rose-500/10 text-rose-500",
	cashflow_projection: "bg-teal-500/10 text-teal-500",
	tax_summary: "bg-red-500/10 text-red-500",
	payroll_summary: "bg-pink-500/10 text-pink-500",
	dashboard: "bg-sky-500/10 text-sky-500",
	search_result: "bg-gray-500/10 text-gray-500",
	report: "bg-neutral-500/10 text-neutral-500",
	knowledge_graph: "bg-lime-500/10 text-lime-500",
};
