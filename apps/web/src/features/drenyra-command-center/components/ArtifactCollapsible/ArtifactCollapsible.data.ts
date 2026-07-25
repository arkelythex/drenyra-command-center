import type { HubArtifact } from "../../../cognitive-hub/types/hub.types";

/** Tipos de artifact que pueden generar un caso fiscal */
export const CASE_CREATABLE_TYPES = new Set([
	"sheet_diff",
	"accounting_diff",
	"dashboard",
	"simulation",
	"comparison",
] as const);

export function getCollapsedSummary(artifact: HubArtifact): string | null {
	switch (artifact.type) {
		case "sheet_diff": {
			const { total, updated, flagged } = artifact.payload.summary;
			return `${total} filas | ${updated} actualizadas | ${flagged} flagged`;
		}
		case "accounting_diff": {
			return `${artifact.payload.diffs.length} cambios en ${artifact.payload.scope}`;
		}
		case "chart": {
			return `Gráfico — ${artifact.payload.data.length} datos`;
		}
		case "dashboard": {
			return `📊 ${artifact.payload.primaryMetric.value} | Score: ${artifact.payload.statusScore}%`;
		}
		case "explanation": {
			return artifact.content.length > 80
				? `${artifact.content.slice(0, 80)}...`
				: artifact.content;
		}
		default: {
			return null;
		}
	}
}

export function getNumericKPI(artifact: HubArtifact): string | null {
	switch (artifact.type) {
		case "dashboard": {
			return artifact.payload.primaryMetric.value;
		}
		case "sheet_diff": {
			return `${artifact.payload.summary.updated}/${artifact.payload.summary.total}`;
		}
		case "chart": {
			return `${artifact.payload.data.length}`;
		}
		case "accounting_diff": {
			return `${artifact.payload.diffs.length}`;
		}
		default: {
			return null;
		}
	}
}

function downloadBlob(filename: string, content: string, mimeType: string) {
	const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
	if (/[,"\n\r]/.test(value)) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

function formatDate() {
	return new Date().toISOString().slice(0, 10);
}

export function generateExportContent(artifact: HubArtifact): {
	filename: string;
	content: string;
	mimeType: string;
} {
	const date = formatDate();
	const id = artifact.id.slice(0, 8);

	switch (artifact.type) {
		case "sheet_diff": {
			const p = artifact.payload;
			const header = ["record", "original", "corrected", "status", "reason"];
			const rows = p.rows.map((r) =>
				[r.record, r.original, r.corrected, r.status, r.reason ?? ""]
					.map(escapeCSV)
					.join(","),
			);
			const summary = [
				"",
				`Total: ${p.summary.total}`,
				`Updated: ${p.summary.updated}`,
				`Flagged: ${p.summary.flagged}`,
				"",
			]
				.map(escapeCSV)
				.join(",");
			return {
				filename: `${date}_sheet_diff_${id}.csv`,
				content: [header.join(","), ...rows, summary].join("\n"),
				mimeType: "text/csv",
			};
		}
		case "accounting_diff": {
			const p = artifact.payload;
			const header = ["field", "before", "after", "reason"];
			const rows = p.diffs.map((d) =>
				[d.field, d.before, d.after, d.reason ?? ""].map(escapeCSV).join(","),
			);
			return {
				filename: `${date}_accounting_diff_${id}.csv`,
				content: [header.join(","), ...rows].join("\n"),
				mimeType: "text/csv",
			};
		}
		case "chart": {
			const p = artifact.payload;
			const header = ["label", "value"];
			const rows = p.data.map((v, i) =>
				[p.labels?.[i] ?? String(i), String(v)].map(escapeCSV).join(","),
			);
			return {
				filename: `${date}_chart_${id}.csv`,
				content: [header.join(","), ...rows].join("\n"),
				mimeType: "text/csv",
			};
		}
		case "simulation": {
			const p = artifact.payload;
			const header = ["account", "debit", "credit"];
			const rows = p.entries.map((e) =>
				[e.account, String(e.debit), String(e.credit)].map(escapeCSV).join(","),
			);
			return {
				filename: `${date}_simulation_${id}.csv`,
				content: [header.join(","), ...rows].join("\n"),
				mimeType: "text/csv",
			};
		}
		default: {
			return {
				filename: `${date}_${artifact.type}_${id}.json`,
				content: JSON.stringify(artifact, null, 2),
				mimeType: "application/json",
			};
		}
	}
}

export { downloadBlob };
