import type { HubArtifact } from "@/features/cognitive-hub/types/hub.types";

export const STREAMING_STEPS = [
	"Analizando datos...",
	"Consultando ledger...",
	"Generando propuesta...",
] as const;

export const ARTIFACT_TYPE_BADGES = ["sheet_diff", "chart", "dashboard"] as const;

export function getArtifactSummary(artifact: HubArtifact): string {
	switch (artifact.type) {
		case "sheet_diff":
			return `${artifact.payload.summary.total} filas · ${artifact.payload.summary.updated} act. · ${artifact.payload.summary.flagged} flagged`;
		case "accounting_diff":
			return `${artifact.payload.diffs.length} cambios en ${artifact.payload.scope}`;
		case "chart":
			return `Gráfico · ${artifact.payload.data.length} datos`;
		case "dashboard":
			return `📊 ${artifact.payload.primaryMetric.value} · Score: ${artifact.payload.statusScore}%`;
		case "explanation":
			return artifact.content.slice(0, 60) + "...";
		default:
			return artifact.type;
	}
}
