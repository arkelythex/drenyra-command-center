/**
 * SIRE Filing Compliance Strategy — Monitors CPE submission deadlines to SUNAT
 *
 * Legal reference: Resolución de Superintendencia N° 000155-2021/SUNAT
 * Electronic invoices must be submitted to SUNAT within 7 calendar days
 * from the emission date. After submission, SUNAT returns a CDR (Comprobante
 * de Recepción) that proves the transaction was registered.
 *
 * Severity calibration:
 *   - critical: overdue > 30 days (potential SUNAT fine / fiscal risk)
 *   - high:     overdue >  7 days (past SUNAT filing deadline)
 *   - medium:   overdue > 24 hours (past 7-day window but < 7 days overdue)
 *   - low:      issued today or yesterday (processing delay, monitor)
 *   - No anomaly: submitted on time or within 7-day window
 */

import type { AgentContext } from "../types/agent-context";
import type { Anomaly, AnomalySeverity, AnomalyStrategy } from "./types";

// ─── Constants ─────────────────────────────────────────────────────

/** SUNAT 7-day deadline for electronic invoice submission */
export const SIRE_DEADLINE_DAYS = 7;

/** Days after deadline for critical classification */
export const CRITICAL_OVERDUE_DAYS = 30;

/** Minimum confidence when CDR is confirmed received */
export const CDR_CONFIRMED_BOOST = 0.05;

// ─── Input types ──────────────────────────────────────────────────

export interface SireFilingRecord {
	id: string;
	serie: string;
	numero: string;
	tipoDocumento: string;
	emisorRuc: string;
	receptorRuc?: string;
	emisionDate: string; // ISO date string
	filingDate: string | null; // ISO date string or null if not filed
	total: number;
	cdrReceived: boolean;
	cdrDate?: string | null; // ISO date string when CDR was received
}

// ─── Strategy factory ─────────────────────────────────────────────

export function createSireFilingStrategy(
	options: { deadlineDays?: number; criticalOverdueDays?: number } = {},
): AnomalyStrategy {
	const deadlineDays = options.deadlineDays ?? SIRE_DEADLINE_DAYS;
	const criticalOverdueDays = options.criticalOverdueDays ?? CRITICAL_OVERDUE_DAYS;

	return {
		id: "sire-filing",
		name: "SIRE Filing Compliance",
		description:
			"Monitors CPE submission deadlines to SUNAT (R.S. 000155-2021/SUNAT). Alerts on overdue invoices past the 7-day filing window.",
		minSeverity: "low",

		execute(data: unknown, _context: AgentContext): Anomaly[] {
			if (!Array.isArray(data)) return [];

			const records = data as SireFilingRecord[];
			const now = new Date();
			const anomalies: Anomaly[] = [];

			for (const record of records) {
				const emissionDate = new Date(record.emisionDate);
				if (isNaN(emissionDate.getTime())) continue;

				// If filing exists and CDR received — compliant
				if (record.filingDate && record.cdrReceived) continue;

				const daysSinceEmission = daysBetween(emissionDate, now);
				const deadlineDate = addDays(emissionDate, deadlineDays);
				const daysOverdue = daysBetween(deadlineDate, now);

				// Within the 7-day window — not yet overdue
				if (daysSinceEmission <= deadlineDays) continue;

				const severity = classifySireSeverity(daysOverdue, criticalOverdueDays);
				const confidence = calculateSireConfidence(
					daysOverdue,
					record.cdrReceived,
					record.filingDate,
				);

				const overdueType = record.filingDate
					? "cdr_pending"
					: "not_filed";

				const reasoning = buildReasoning(record, daysOverdue, overdueType);

				anomalies.push({
					id: `sire-filing-${record.id}`,
					timestamp: now.toISOString(),
					entityType: "cpe",
					entityId: record.id,
					metric: "sire_filing_overdue",
					expectedValue: 0,
					actualValue: daysOverdue,
					deviation: daysOverdue,
					severity,
					confidence,
					reasoning,
					detectionMethod: "sire_filing_deadline",
					context: {
						serie: record.serie,
						numero: record.numero,
						tipoDocumento: record.tipoDocumento,
						emisorRuc: record.emisorRuc,
						emisionDate: record.emisionDate,
						filingDate: record.filingDate,
						cdrReceived: record.cdrReceived,
						daysSinceEmission,
						daysOverdue,
						deadlineDays,
						overdueType,
						total: record.total,
						legalReference:
							"R.S. 000155-2021/SUNAT — Plazo de 7 días para envío de CPE a SUNAT",
					},
				});
			}

			return anomalies;
		},
	};
}

// ─── Helpers ───────────────────────────────────────────────────────

function daysBetween(from: Date, to: Date): number {
	return Math.floor(
		(to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
	);
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

function classifySireSeverity(
	daysOverdue: number,
	criticalThreshold: number,
): AnomalySeverity {
	if (daysOverdue >= criticalThreshold) return "critical";
	if (daysOverdue >= 7) return "high";
	return "medium";
}

function calculateSireConfidence(
	daysOverdue: number,
	cdrReceived: boolean,
	filingDate: string | null,
): number {
	// Filed but no CDR -> lower confidence (could be SUNAT delay)
	if (filingDate && !cdrReceived) {
		return roundToCentesimos(Math.min(0.7 + daysOverdue * 0.01, 0.92));
	}

	// Not filed -> higher confidence as days pass
	const baseConfidence = Math.min(0.85 + daysOverdue * 0.005, 0.98);
	return roundToCentesimos(baseConfidence);
}

function buildReasoning(
	record: SireFilingRecord,
	daysOverdue: number,
	overdueType: string,
): string {
	const docDesc = `${record.tipoDocumento} ${record.serie}-${String(record.numero).padStart(8, "0")}`;

	if (overdueType === "cdr_pending") {
		return (
			`${docDesc}: Enviado a SUNAT pero sin CDR de recepción (${daysOverdue} días de retraso). ` +
			`El comprobante podría no estar registrado en SUNAT.`
		);
	}

	return (
		`${docDesc}: No enviado a SUNAT (${daysOverdue} días de retraso). ` +
		`Venció el plazo de 7 días calendario según R.S. 000155-2021/SUNAT. ` +
		`Monto: S/ ${record.total.toFixed(2)}. Sujeto a multa si supera 30 días.`
	);
}

function roundToCentesimos(value: number): number {
	return Math.round(value * 100) / 100;
}
