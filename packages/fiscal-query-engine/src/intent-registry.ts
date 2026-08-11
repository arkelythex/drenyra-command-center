/**
 * Fiscal Query Engine — Intent Registry
 *
 * Known intent patterns for classifying fiscal queries.
 * Pattern matching is run FIRST (deterministic, fast, no API cost).
 * AI fallback is used when confidence < 0.4.
 */

import type { IntentKind, IntentPattern } from "./types.ts";

/** All known intent patterns with their keywords and weights. */
export const INTENT_PATTERNS: IntentPattern[] = [
	{
		kind: "igv-consulta",
		keywords: ["igv", "iva", "impuesto general", "impuesto a las ventas"],
		description: "IGV calculation query",
		weight: 1.0,
	},
	{
		kind: "detracciones-consulta",
		keywords: [
			"detraccion",
			"detracción",
			"spot",
			"sistema de pago",
			"código spot",
		],
		description: "Detracciones query",
		weight: 1.0,
	},
	{
		kind: "sire-resumen",
		keywords: [
			"sire",
			"libro",
			"registro de ventas",
			"registro de compras",
			"declaracion mensual",
		],
		description: "SIRE report query",
		weight: 1.0,
	},
	{
		kind: "retenciones-consulta",
		keywords: ["retencion", "retención", "rrt", "registro de retenciones"],
		description: "Retenciones query",
		weight: 1.0,
	},
	{
		kind: "pipeline-run",
		keywords: [
			"analiza",
			"analizá",
			"analizar",
			"procesa",
			"procesá",
			"ejecuta",
			"ejecutá",
			"corre",
			"corré",
			"hacé",
			"contabiliza",
			"contabilizá",
			"declara",
			"declará",
		],
		description: "Pipeline execution request",
		weight: 0.9,
	},
	{
		kind: "factura-lookup",
		keywords: ["factura", "boleta", "comprobante", "documento", "cdr"],
		description: "Invoice/document lookup",
		weight: 0.9,
	},
];

/**
 * Extract a RUC (11 digits) from text.
 */
export function extractRuc(text: string): string | undefined {
	// RUC: exactly 11 digits, optionally with leading/trailing non-digits
	const match = text.match(/\b(\d{11})\b/);
	return match?.[1];
}

/**
 * Extract a period string from text.
 * Supports: "julio 2026", "2026-07", "julio", "último mes", "este mes", "mes pasado"
 */
export function extractPeriodo(text: string): string | undefined {
	const lower = text.toLowerCase();

	// Explicit period: YYYY-MM format
	const explicitYMD = lower.match(/\b(20\d{2})-(\d{2})\b/);
	if (explicitYMD) {
		return `${explicitYMD[1]}-${explicitYMD[2]}`;
	}

	// Explicit period: MM/YYYY format
	const explicitMDY = lower.match(/\b(\d{2})\/(20\d{2})\b/);
	if (explicitMDY) {
		return `${explicitMDY[2]}-${explicitMDY[1]}`;
	}

	// "julio 2026" style — static regex, no dynamic interpolation
	const monthMatch = lower.match(
		/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*(20\d{2})/i,
	);
	if (monthMatch) {
		const monthNames: Record<string, string> = {
			enero: "01",
			febrero: "02",
			marzo: "03",
			abril: "04",
			mayo: "05",
			junio: "06",
			julio: "07",
			agosto: "08",
			septiembre: "09",
			octubre: "10",
			noviembre: "11",
			diciembre: "12",
		};
		const monthKey = monthMatch[1]?.toLowerCase();
		const month = monthKey !== undefined ? monthNames[monthKey] : undefined;
		if (month) {
			return `${monthMatch[2]}-${month}`;
		}
	}

	// Relative periods
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

	if (lower.includes("último mes") || lower.includes("mes pasado")) {
		const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
	}
	if (lower.includes("este mes") || lower.includes("este período")) {
		return `${currentYear}-${currentMonth}`;
	}

	return undefined;
}

/**
 * Extract relevant fiscal keywords from text.
 */
export function extractKeywords(text: string): string[] {
	const lower = text.toLowerCase();
	const found = new Set<string>();

	// Check all known patterns
	for (const pattern of INTENT_PATTERNS) {
		for (const kw of pattern.keywords) {
			if (lower.includes(kw)) {
				found.add(kw);
			}
		}
	}

	// Add entity types
	const entityWords = [
		"factura",
		"boleta",
		"comprobante",
		"cdr",
		"ruc",
		"periodo",
		"período",
	];
	for (const word of entityWords) {
		if (lower.includes(word)) {
			found.add(word);
		}
	}

	return Array.from(found);
}

/**
 * Match text against intent patterns, returning the best match.
 */
export function matchIntentPatterns(text: string): {
	kind: IntentKind;
	confidence: number;
	extracted: { ruc?: string; periodo?: string; keywords: string[] };
} {
	const lower = text.toLowerCase();
	const ruc = extractRuc(text);
	const periodo = extractPeriodo(text);
	const keywords = extractKeywords(text);

	let bestKind: IntentKind = "unknown";
	let bestScore = 0;

	for (const pattern of INTENT_PATTERNS) {
		let matchedCount = 0;
		for (const kw of pattern.keywords) {
			if (lower.includes(kw)) {
				matchedCount++;
			}
		}

		// Score: 0.6 for 1 match, 0.9 for 2, 1.0 for 3+
		let score = 0;
		if (matchedCount > 0) {
			score = Math.min(0.3 + matchedCount * 0.3, 1.0);
		}

		if (score > bestScore) {
			bestScore = score;
			bestKind = pattern.kind;
		}
	}

	// Bonus: if we have RUC + periodo, bump confidence
	if (ruc && periodo) {
		bestScore = Math.min(bestScore + 0.15, 1.0);
	} else if (!ruc || !periodo) {
		bestScore = Math.max(bestScore - 0.1, 0);
	}

	return {
		kind: bestKind,
		confidence: Math.round(bestScore * 100) / 100,
		extracted: {
			...(ruc !== undefined ? { ruc } : {}),
			...(periodo !== undefined ? { periodo } : {}),
			keywords,
		},
	};
}

/**
 * Build clarification suggestions when the query is ambiguous.
 */
export function buildClarification(extracted: {
	ruc?: string;
	periodo?: string;
}): string[] {
	const suggestions: string[] = [];

	if (!extracted.ruc) {
		suggestions.push("Incluí un RUC de 11 dígitos en tu consulta");
		suggestions.push(
			'  Ej: `drenyra consulta "IGV de julio" --ruc 20123456789`',
		);
	}
	if (!extracted.periodo) {
		suggestions.push("Especificá un período (mes y año)");
		suggestions.push('  Ej: `drenyra consulta "IGV de julio 2026"`');
	}

	return suggestions;
}
