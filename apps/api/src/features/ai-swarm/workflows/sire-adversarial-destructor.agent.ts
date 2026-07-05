import type { InvoiceData } from "../config/types";
import { runSunatAiParitySubagent } from "../rules/peru-2026/sunat-ai-parity-subagent";
import type {
	SireAdversarialInput,
	SireDestructorChallenge,
} from "./sire-adversarial-audit.types";
import type { SireAnomaly } from "./sire-readiness-subagents.service";

function toSyntheticInvoice(input: SireAdversarialInput): InvoiceData {
	const issueDate = `${input.period}-01`;
	const total = Number((input.salesTotalPen + input.declaredIgvPen).toFixed(2));
	return {
		id: `SIRE-${input.companyId}-${input.period}`,
		ruc: input.ruc,
		serie: "SIR1",
		numero: "00000001",
		fecha: issueDate,
		moneda: "PEN",
		subtotal: input.salesTotalPen,
		igv: input.declaredIgvPen,
		total,
		items: [
			{
				descripcion:
					typeof input.detractionableBasePen === "number" &&
					input.detractionableBasePen > 0
						? "Servicio sujeto a detraccion"
						: "Venta gravada",
				cantidad: 1,
				precioUnitario: input.salesTotalPen,
				subtotal: input.salesTotalPen,
			},
		],
	};
}

function maxSeverity(
	current: SireDestructorChallenge["severity"],
	next: SireDestructorChallenge["severity"],
): SireDestructorChallenge["severity"] {
	const order: Record<SireDestructorChallenge["severity"], number> = {
		low: 1,
		medium: 2,
		high: 3,
		critical: 4,
	};
	return order[next] > order[current] ? next : current;
}

function severityFromAnomaly(
	anomaly: SireAnomaly,
): SireDestructorChallenge["severity"] {
	if (anomaly.type === "cpe_breach") return "critical";
	if (anomaly.type === "igv_mismatch" && anomaly.gapPen >= 200)
		return "critical";
	if (anomaly.type === "igv_mismatch") return "high";
	if (anomaly.type === "rce_gap") return "high";
	if (anomaly.type === "detraction_gap" && anomaly.gapPen >= 50) return "high";
	if (anomaly.type === "detraction_gap") return "medium";
	return "medium";
}

function confidenceFromSeverity(
	severity: SireDestructorChallenge["severity"],
): number {
	if (severity === "critical") return 0.95;
	if (severity === "high") return 0.88;
	if (severity === "medium") return 0.79;
	return 0.65;
}

/**
 * runSireDestructorAgent operation.
 *
 * @param input - Input for input.
 * @param anomalies - Input for anomalies.
 * @returns Result of runSireDestructorAgent.
 * @example
 * ```ts
 * const result = runSireDestructorAgent({} as SireAdversarialInput, []);
 * console.log(result);
 * ```
 */
export function runSireDestructorAgent(
	input: SireAdversarialInput,
	anomalies: SireAnomaly[],
): SireDestructorChallenge {
	const parity = runSunatAiParitySubagent(toSyntheticInvoice(input));
	let severity: SireDestructorChallenge["severity"] = "low";
	const blockers: string[] = [];
	const warnings: string[] = [];

	for (const anomaly of anomalies) {
		const anomalySeverity = severityFromAnomaly(anomaly);
		severity = maxSeverity(severity, anomalySeverity);
		if (anomalySeverity === "critical" || anomalySeverity === "high") {
			blockers.push(anomaly.description);
			continue;
		}
		warnings.push(anomaly.description);
	}

	for (const alert of parity.alerts) {
		if (alert.severity === "critical") {
			severity = maxSeverity(severity, "critical");
			blockers.push(alert.message);
			continue;
		}

		if (alert.severity === "warning") {
			severity = maxSeverity(severity, "medium");
			warnings.push(alert.message);
			continue;
		}

		if (alert.severity === "info") {
			warnings.push(alert.message);
		}
	}

	return {
		severity,
		confidence: confidenceFromSeverity(severity),
		blockers: [...new Set(blockers)],
		warnings: [...new Set(warnings)],
		parityAlerts: parity.alerts.map((alert) => alert.code),
	};
}
