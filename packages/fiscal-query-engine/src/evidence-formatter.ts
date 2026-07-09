/**
 * Fiscal Query Engine — Evidence Formatter
 *
 * Formats pipeline output into human-readable markdown or structured JSON.
 */

import type { QueryResult } from "./types";

const SEPARATOR = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

/**
 * Format a query result as human-readable markdown text.
 */
export function formatAsText(result: QueryResult): string {
	const lines: string[] = [];

	lines.push("");
	lines.push(SEPARATOR);
	lines.push(`📋 ${getResultTitle(result)}`);
	lines.push(SEPARATOR);
	lines.push(`  RUC: ${result.ruc || "—"}`);
	lines.push(`  Período: ${result.periodo || "—"}`);
	lines.push("");

	// Main result
	if (result.error) {
		lines.push(`⚠ ${result.error}`);
		if (result.sugerencia) {
			lines.push(`  Sugerencia: ${result.sugerencia}`);
		}
	} else {
		// Render known result fields
		const monto = result.resultado["monto"];
		const moneda = result.resultado["moneda"] ?? "PEN";
		if (monto !== undefined) {
			lines.push(
				`  Monto: ${moneda} ${Number(monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
			);
		}
		const confianza = result.confianza;
		lines.push(`  Confianza: ${(confianza * 100).toFixed(0)}%`);
		lines.push("");
	}

	// Confidence bar
	lines.push(renderConfidenceBar(result.confianza));

	// Evidence sources
	if (result.fuentes.length > 0) {
		lines.push("");
		lines.push(`📎 Evidencia (${result.fuentes.length} fuente(s)):`);
		const top = result.fuentes.slice(0, 5);
		for (const fuente of top) {
			const cdr = fuente.cdrHash ? "CDR ✓" : "CDR —";
			lines.push(
				`  • ${fuente.serie}-${String(fuente.numero).padStart(3, "0")} | ${fuente.moneda} ${fuente.monto.toFixed(2)} | ${cdr} | ${fuente.fecha}`,
			);
		}
		if (result.fuentes.length > 5) {
			lines.push(`  ... y ${result.fuentes.length - 5} más`);
		}
	}

	// Evidence artifacts hash
	if (result.evidenceArtifacts.length > 0) {
		lines.push("");
		lines.push(`🔗 Hash: ${result.evidenceArtifacts[0]!.hash.slice(0, 16)}...`);
	}

	lines.push(SEPARATOR);
	lines.push("");

	return lines.join("\n");
}

/**
 * Format a query result as structured JSON.
 */
export function formatAsJson(result: QueryResult): string {
	return JSON.stringify(result, null, 2);
}

/**
 * Get a human-readable title for the result type.
 */
function getResultTitle(result: QueryResult): string {
	const titles: Record<string, string> = {
		"igv-consulta": `IGV estimado para ${result.periodo || "período"}`,
		"detracciones-consulta": `Detracciones — ${result.periodo || "período"}`,
		"sire-resumen": `Resumen SIRE — ${result.periodo || "período"}`,
		"retenciones-consulta": `Retenciones — ${result.periodo || "período"}`,
		"pipeline-run": `Pipeline ejecutado — ${result.periodo || "período"}`,
		"factura-lookup": "Documento encontrado",
		unknown: "Consulta no reconocida",
	};
	return titles[result.tipo] ?? "Resultado de consulta fiscal";
}

/**
 * Render a 20-char confidence bar.
 */
function renderConfidenceBar(confidence: number): string {
	const filled = Math.round(confidence * 20);
	const empty = 20 - filled;
	const bar = "█".repeat(filled) + "░".repeat(empty);
	return `  Confianza: [${bar}] ${(confidence * 100).toFixed(0)}%`;
}
