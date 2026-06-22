/**
 * IGV Mismatch Strategy — detects invoices where IGV != 18% of taxable base
 *
 * Legal reference: Art. 17 TUO IGV (D.S. 055-99-EF, actualizado 2026)
 * Standard IGV rate: 18% (16% IGV + 2% IPM)
 *
 * This strategy is fundamental for fiscal compliance:
 * - IGV below expected → potential underpayment (evasion)
 * - IGV above expected → potential overcharge (client red flag)
 * - Exonerated/inafecta operations are automatically skipped
 *
 * Severity calibration:
 *   - critical: deviation > 10%
 *   - high:     deviation >  5%
 *   - medium:   deviation >  2%
 *   - low:      deviation <= 2%
 *   - No anomaly: deviation within tolerance (<= 1 PEN absolute diff)
 */

import type { AgentContext } from "../types/agent-context";
import type { Anomaly, AnomalySeverity, AnomalyStrategy } from "./types";

// ─── Constants ─────────────────────────────────────────────────────

/** Standard IGV rate: 18% (16% IGV + 2% IPM) */
export const IGV_RATE = 0.18;

/** Absolute tolerance in PEN for rounding differences (SUNAT allows ±1 PEN) */
export const IGV_TOLERANCE_PEN = 1;

/** Operation types that are exonerated or inafecta (0% IGV) */
export const EXONERATED_TIPOS: readonly string[] = [
	"07", // Exonerado — Exonerated
	"08", // Exonerado — Exonerated (third-party)
	"09", // Inafecto — Not subject to IGV
	"10", // Inafecto — Not subject to IGV (third-party)
	"20", // Exportación — Export (0% IGV)
	"30", // Operación no gravada — Non-taxable
	"37", // Seguros — Insurance
	"40", // Intermediación — Brokerage
];

// ─── Input types ──────────────────────────────────────────────────

export interface IgvMismatchInvoice {
	id: string;
	serie: string;
	numero: string;
	tipoOperacion: string;
	baseImponible: number; // Taxable base before IGV
	igvCalculado: number; // IGV amount declared on the invoice
	emisorRuc: string;
	emisionDate: string;
}

// ─── Strategy factory ─────────────────────────────────────────────

export function createIgvMismatchStrategy(): AnomalyStrategy {
	return {
		id: "igv-mismatch",
		name: "IGV Mismatch Detection",
		description:
			"Detects invoices where declared IGV does not match 18% of taxable base (Art. 17 TUO IGV)",
		minSeverity: "low",

		execute(data: unknown, _context: AgentContext): Anomaly[] {
			if (!Array.isArray(data)) return [];

			const invoices = data as IgvMismatchInvoice[];
			const anomalies: Anomaly[] = [];

			for (const inv of invoices) {
				// Skip exonerated/inafecta operations
				if (EXONERATED_TIPOS.includes(inv.tipoOperacion)) continue;

				const expectedIgv = roundToCentesimos(inv.baseImponible * IGV_RATE);
				const actualIgv = inv.igvCalculado;
				const absDiff = Math.abs(expectedIgv - actualIgv);

				// Within tolerance — no anomaly
				if (absDiff <= IGV_TOLERANCE_PEN) continue;

				const deviationRatio = absDiff / expectedIgv;
				const severity = classifyDeviation(deviationRatio);
				const confidence = calculateConfidence(deviationRatio, absDiff);

				const diffFormatted = absDiff.toLocaleString("es-PE", {
					style: "currency",
					currency: "PEN",
				});

				anomalies.push({
					id: `igv-mismatch-${inv.id}`,
					timestamp: new Date().toISOString(),
					entityType: "invoice",
					entityId: inv.id,
					metric: "igv_mismatch",
					expectedValue: expectedIgv,
					actualValue: actualIgv,
					deviation: deviationRatio,
					severity,
					confidence,
					reasoning:
						`IGV declarado S/ ${actualIgv.toFixed(2)} ≠ IGV esperado S/ ${expectedIgv.toFixed(2)} ` +
						`(base S/ ${inv.baseImponible.toFixed(2)} × 18%). Diferencia: ${diffFormatted}.`,
					detectionMethod: "igv_mismatch_art17",
					context: {
						serie: inv.serie,
						numero: inv.numero,
						tipoOperacion: inv.tipoOperacion,
						baseImponible: inv.baseImponible,
						emisorRuc: inv.emisorRuc,
						emisionDate: inv.emisionDate,
						expectedIgv,
						actualIgv,
						absDiff,
						deviationRatio,
						legalReference: "Art. 17 TUO IGV (D.S. 055-99-EF)",
						igvRate: IGV_RATE,
					},
				});
			}

			return anomalies;
		},
	};
}

// ─── Helpers ───────────────────────────────────────────────────────

function roundToCentesimos(value: number): number {
	return Math.round(value * 100) / 100;
}

function classifyDeviation(deviationRatio: number): AnomalySeverity {
	if (deviationRatio > 0.1) return "critical";
	if (deviationRatio > 0.05) return "high";
	if (deviationRatio > 0.02) return "medium";
	return "low";
}

function calculateConfidence(deviationRatio: number, absDiff: number): number {
	// Base confidence: 0.80 for small deviations, scales up
	// Cap at 0.99 (never 100% — always room for legitimate adjustments)
	const baseConfidence = Math.min(0.8 + deviationRatio * 0.5, 0.99);

	// Rounding adjustments reduce confidence slightly
	if (absDiff < 10) return roundToCentesimos(baseConfidence * 0.95);

	return roundToCentesimos(baseConfidence);
}
