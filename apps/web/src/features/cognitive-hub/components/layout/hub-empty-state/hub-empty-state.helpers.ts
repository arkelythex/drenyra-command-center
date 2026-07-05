import type { DiscrepancyScenario } from "../../anomaly/discrepancy-scenario";
import type { DiscrepancyCommitStatus } from "../../anomaly/use-discrepancy-resolution.store";

export interface ScenarioImpact {
	flaggedRows: number;
	updatedRows: number;
	estimatedDelta: number;
}

function parseMoney(value: string): number {
	const parsed = Number(value.replace(/[^\d.-]/g, ""));
	return Number.isFinite(parsed) ? parsed : 0;
}

export function getScenarioImpact(
	scenario: DiscrepancyScenario | null,
): ScenarioImpact {
	if (!scenario) {
		return {
			flaggedRows: 0,
			updatedRows: 0,
			estimatedDelta: 0,
		};
	}

	let estimatedDelta = 0;
	for (const row of scenario.rows) {
		estimatedDelta += Math.abs(
			parseMoney(row.original) - parseMoney(row.corrected),
		);
	}

	return {
		flaggedRows: scenario.rows.filter((row) => row.status === "flagged").length,
		updatedRows: scenario.rows.filter((row) => row.status === "updated").length,
		estimatedDelta,
	};
}

export function getCommitLabel(
	status: DiscrepancyCommitStatus,
	undoSecondsLeft: number,
): string {
	if (status === "pending_undo") {
		return `Pendiente de confirmación (${undoSecondsLeft}s)`;
	}
	if (status === "committed") return "Confirmación registrada en evidencia";
	if (status === "error")
		return "Error de confirmación: requiere revisión humana";
	return "Sin confirmar";
}

export function getCommitTone(status: DiscrepancyCommitStatus): string {
	if (status === "pending_undo") return "text-warning";
	if (status === "committed") return "text-success";
	if (status === "error") return "text-danger";
	return "text-secondary";
}
