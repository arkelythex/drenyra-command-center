import type { ExpedienteKind } from "@drenyra/domain";

/**
 * Builds expediente evidence deep-link for a SIRE diff period.
 */
export function buildExpedienteEvidenceHref(input: {
	period: string;
	kind?: ExpedienteKind | "sire";
	query?: string;
}): string {
	const params = new URLSearchParams({ periodo: input.period });
	if (input.kind && input.kind !== "sire") {
		params.set("kind", input.kind);
	}
	if (input.query) params.set("q", input.query);
	return `/cumplimiento/expedientes?${params.toString()}`;
}

/**
 * Deep-link to the standalone SIRE diff workspace for a fiscal period.
 */
export function buildSireDiffHref(input: { period: string }): string {
	const params = new URLSearchParams({ period: input.period });
	return `/cumplimiento/sire-diff?${params.toString()}`;
}

const VENTAS_SERIES_PREFIXES = new Set(["F", "B"]);

/**
 * Maps a SUNAT document series to the expediente kind used for evidence lookup.
 */
export function resolveSireExpedienteKind(
	documentSeries: string,
): ExpedienteKind {
	const normalized = documentSeries.trim().toUpperCase();
	if (normalized.startsWith("EB")) {
		return "SIRE_VENTAS";
	}
	const prefix = normalized.slice(0, 1);
	if (VENTAS_SERIES_PREFIXES.has(prefix)) {
		return "SIRE_VENTAS";
	}
	return "SIRE_COMPRAS";
}
