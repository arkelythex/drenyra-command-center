/**
 * Duplicate Invoice Strategy — detects potentially duplicate invoices
 *
 * Two detection modes:
 *
 * 1. DEFINITIVE DUPLICATE: Same serie + same numero + same emisor RUC
 *    → Critical severity, 0.99 confidence
 *    → Likely a system error or intentional duplicate emission
 *
 * 2. SUSPICIOUS DUPLICATE: Same emisor + same total amount within a time window
 *    → High severity if emitted within 2 hours (same batch/processing)
 *    → Medium severity if within 7 days (possible billing error)
 *    → No anomaly if window exceeded or amounts differ significantly
 *
 * Edge cases handled:
 *   - Empty invoice array → empty result (no anomalies)
 *   - Single invoice → no anomalies possible (no pair)
 *   - Different emisor → no anomaly
 *   - Credit notes (tipoNota "07" or "08") → typically legitimate, lower confidence
 */

import type { AgentContext } from "../types/agent-context";
import type { Anomaly, AnomalyStrategy } from "./types";

// ─── Constants ─────────────────────────────────────────────────────

/** Window in ms for "rapid re-emission" (2 hours) */
const RAPID_REEMISSION_WINDOW_MS = 2 * 60 * 60 * 1000;

/** Window in ms for "suspicious duplicate" (7 days) */
const SUSPICIOUS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// ─── Input types ──────────────────────────────────────────────────

export interface DuplicateInvoiceCheck {
	id: string;
	serie: string;
	numero: string;
	total: number;
	emisorRuc: string;
	emisionDate: string;
	tipoNota?: string; // "07" = nota de crédito, "08" = nota de débito
	moneda?: string; // "PEN" | "USD"
}

// ─── Strategy factory ─────────────────────────────────────────────

export function createDuplicateInvoiceStrategy(): AnomalyStrategy {
	return {
		id: "duplicate-invoice",
		name: "Duplicate Invoice Detection",
		description:
			"Detects definitively duplicate invoices (same serie+numero+emisor) and suspicious duplicates (same amount+emisor within time window)",
		minSeverity: "medium",

		execute(data: unknown, _context: AgentContext): Anomaly[] {
			if (!Array.isArray(data)) return [];

			const invoices = data as DuplicateInvoiceCheck[];
			if (invoices.length < 2) return [];

			const anomalies: Anomaly[] = [];
			const seen = new Map<string, DuplicateInvoiceCheck>();

			for (const inv of invoices) {
				checkDefinitiveDuplicate(inv, seen, anomalies);
				if (seen.has(makeKey(inv))) continue;

				seen.set(makeKey(inv), inv);
			}

			// Second pass: check all pairs for suspicious duplicates
			const allInvs = Array.from(seen.values());
			for (let i = 0; i < allInvs.length; i++) {
				for (let j = i + 1; j < allInvs.length; j++) {
					checkSuspiciousPair(allInvs[i]!, allInvs[j]!, anomalies);
				}
			}

			return anomalies;
		},
	};
}

// ─── Helper functions ─────────────────────────────────────────────

function makeKey(inv: DuplicateInvoiceCheck): string {
	return `${inv.emisorRuc}:${inv.serie}:${inv.numero}`;
}

function checkDefinitiveDuplicate(
	inv: DuplicateInvoiceCheck,
	seen: Map<string, DuplicateInvoiceCheck>,
	anomalies: Anomaly[],
): void {
	const key = makeKey(inv);
	const existing = seen.get(key);
	if (!existing) return;

	const isCreditNote = inv.tipoNota === "07" || inv.tipoNota === "08";
	anomalies.push({
		id: `dup-definitive-${inv.id}`,
		timestamp: new Date().toISOString(),
		entityType: "invoice",
		entityId: inv.id,
		metric: "definitive_duplicate",
		expectedValue: 1,
		actualValue: 2,
		deviation: 1,
		severity: "critical",
		confidence: 0.99,
		reasoning:
			`Duplicate invoice detected: ${existing.serie}-${existing.numero} ` +
			`from RUC ${inv.emisorRuc}. Both invoices share the same serie+numero+emisor. ` +
			`First: ${existing.id}, duplicate: ${inv.id}.`,
		detectionMethod: "definitive_duplicate_serie_numero",
		context: {
			firstInvoiceId: existing.id,
			duplicateInvoiceId: inv.id,
			serie: inv.serie,
			numero: inv.numero,
			emisorRuc: inv.emisorRuc,
			isCreditNote,
			firstEmisionDate: existing.emisionDate,
			duplicateEmisionDate: inv.emisionDate,
		},
	});
}

function checkSuspiciousPair(
	a: DuplicateInvoiceCheck,
	b: DuplicateInvoiceCheck,
	anomalies: Anomaly[],
): void {
	if (a.emisorRuc !== b.emisorRuc) return;
	if (Math.abs(a.total - b.total) > 1) return;

	const aDate = new Date(a.emisionDate).getTime();
	const bDate = new Date(b.emisionDate).getTime();
	if (Number.isNaN(aDate) || Number.isNaN(bDate)) return;

	const timeDiff = Math.abs(aDate - bDate);
	if (timeDiff > SUSPICIOUS_WINDOW_MS) return;

	const isRapid = timeDiff <= RAPID_REEMISSION_WINDOW_MS;
	const severity = isRapid ? ("high" as const) : ("medium" as const);
	const confidence = isRapid ? 0.85 : 0.65;
	const hoursDiff = (timeDiff / (1000 * 60 * 60)).toFixed(1);

	// Report on the later invoice (avoid double-reporting)
	const later = aDate >= bDate ? a : b;
	const earlier = aDate >= bDate ? b : a;

	anomalies.push({
		id: `dup-suspicious-${later.id}-${earlier.id}`,
		timestamp: new Date().toISOString(),
		entityType: "invoice",
		entityId: later.id,
		metric: "suspicious_duplicate",
		expectedValue: 1,
		actualValue: 2,
		deviation: 1,
		severity,
		confidence,
		reasoning:
			`Suspicious duplicate: ${later.serie}-${later.numero} (${later.id}) has ` +
			`same total S/ ${later.total.toFixed(2)} as invoice ${earlier.serie}-${earlier.numero} ` +
			`(${earlier.id}) from same emisor RUC ${a.emisorRuc}, ` +
			`${hoursDiff}h apart.`,
		detectionMethod: isRapid
			? "suspicious_duplicate_rapid_reemission"
			: "suspicious_duplicate_same_amount",
		context: {
			firstInvoiceId: earlier.id,
			secondInvoiceId: later.id,
			firstSerie: earlier.serie,
			firstNumero: earlier.numero,
			secondSerie: later.serie,
			secondNumero: later.numero,
			emisorRuc: a.emisorRuc,
			total: later.total,
			timeDiffHours: parseFloat(hoursDiff),
			isRapidReemission: isRapid,
		},
	});
}
