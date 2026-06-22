/**
 * SIRE Detraction Subagent
 *
 * Validates SPOT detraction consistency for a given period.
 * Extracted from sire-readiness-subagents to keep files under 200 lines.
 *
 * Rule: RS 183-2004/SUNAT — tasa promedio SPOT 10% para servicios >S/ 700.
 *  Shared input type — must match SireReadinessInput (declared in service to avoid circular deps)
 * @example
 * ```ts
 * const value: SireReadinessDetractionInput = {} as SireReadinessDetractionInput;
 * console.log(value);
 * ```
 */

export interface SireReadinessDetractionInput {
	period: string;
	declaredIgvPen: number;
	detractionAmountPen?: number;
	detractionableBasePen?: number;
}

/**
 *  Subagent result shape — re-used by IGV and RCE subagents as well
 * @example
 * ```ts
 * const value: SubagentResult = {} as SubagentResult;
 * console.log(value);
 * ```
 */

export interface SubagentResult {
	subagent: "igv-subagent" | "rce-subagent" | "detraction-validator";
	status: "pass" | "warn" | "fail";
	confidence: number;
	message: string;
	evidence: Record<string, unknown>;
}

/** Tasa promedio SPOT para servicios (RS 183-2004/SUNAT) */
const SPOT_RATE_SERVICES = 0.1;
const DETRACTION_TOLERANCE_PEN = 5;

/**
 * SireAnomaly interface.
 *
 * @example
 * ```ts
 * const value: SireAnomaly = {} as SireAnomaly;
 * console.log(value);
 * ```
 */
export interface SireAnomaly {
	type: "igv_mismatch" | "rce_gap" | "detraction_gap" | "cpe_breach";
	subagent: string;
	gapPen: number;
	description: string;
}

/**
 * runDetractionValidator operation.
 *
 * @param input - Input for input.
 * @returns Result of runDetractionValidator.
 * @example
 * ```ts
 * const result = await runDetractionValidator({} as SireReadinessDetractionInput);
 * console.log(result);
 * ```
 */
export async function runDetractionValidator(
	input: SireReadinessDetractionInput,
): Promise<SubagentResult> {
	// Si no hay base imponible sujeta a SPOT, no aplica detracción
	if (input.detractionableBasePen === undefined) {
		return {
			subagent: "detraction-validator",
			status: "pass",
			confidence: 1.0,
			message:
				"Detracción SPOT no aplica para este período (sin base declarada).",
			evidence: { applicable: false },
		};
	}

	const expectedDetraction = Number(
		(input.detractionableBasePen * SPOT_RATE_SERVICES).toFixed(2),
	);

	if (input.detractionAmountPen === undefined) {
		return {
			subagent: "detraction-validator",
			status: "warn",
			confidence: 0.7,
			message: "Base SPOT declarada pero monto de detracción no informado.",
			evidence: {
				detractionableBasePen: input.detractionableBasePen,
				expectedDetractionPen: expectedDetraction,
				spotRate: SPOT_RATE_SERVICES,
			},
		};
	}

	const gap = Number(
		Math.abs(input.detractionAmountPen - expectedDetraction).toFixed(2),
	);
	const hasGap = gap > DETRACTION_TOLERANCE_PEN;

	return {
		subagent: "detraction-validator",
		status: hasGap ? "warn" : "pass",
		confidence: hasGap ? 0.73 : 0.93,
		message: hasGap
			? `Detracción SPOT inconsistente para período ${input.period}.`
			: `Detracción SPOT consistente para período ${input.period}.`,
		evidence: {
			expectedDetractionPen: expectedDetraction,
			declaredDetractionPen: input.detractionAmountPen,
			detractionableBasePen: input.detractionableBasePen,
			gapPen: gap,
			tolerancePen: DETRACTION_TOLERANCE_PEN,
			spotRate: SPOT_RATE_SERVICES,
		},
	};
}

function readEvidenceNumber(
	evidence: Record<string, unknown>,
	key: string,
): number {
	const val = evidence[key];
	return typeof val === "number" ? val : 0;
}

function toIgvAnomaly(
	check: SubagentResult,
	declaredIgvPen: number,
): SireAnomaly {
	const gapPen = readEvidenceNumber(check.evidence, "gapPen");
	return {
		type: "igv_mismatch",
		subagent: check.subagent,
		gapPen,
		description: `IGV declarado S/ ${declaredIgvPen} difiere del calculado 18%. Gap: S/ ${gapPen}.`,
	};
}

function toRceAnomaly(check: SubagentResult): SireAnomaly {
	const rvieGap = readEvidenceNumber(check.evidence, "rvieGap");
	const rceGap = readEvidenceNumber(check.evidence, "rceGap");
	return {
		type: "rce_gap",
		subagent: check.subagent,
		gapPen: 0,
		description: `RVIE gap: ${rvieGap} registros, RCE gap: ${rceGap} registros. Requiere conciliación manual.`,
	};
}

function toDetractionAnomaly(check: SubagentResult): SireAnomaly {
	const gapPen = readEvidenceNumber(check.evidence, "gapPen");
	return {
		type: "detraction_gap",
		subagent: check.subagent,
		gapPen,
		description: `Detracción SPOT inconsistente. Gap: S/ ${gapPen}. Tasa SPOT esperada: ${SPOT_RATE_SERVICES * 100}%.`,
	};
}

/**
 * buildAnomalies operation.
 *
 * @param checks - Input for checks.
 * @param input - Input for input.
 * @returns Result of buildAnomalies.
 * @example
 * ```ts
 * const result = buildAnomalies([], {} as Pick);
 * console.log(result);
 * ```
 */
export function buildAnomalies(
	checks: SubagentResult[],
	input: Pick<SireReadinessDetractionInput, "declaredIgvPen">,
): SireAnomaly[] {
	const anomalies: SireAnomaly[] = [];

	for (const check of checks) {
		if (check.status === "pass") continue;
		if (check.subagent === "igv-subagent")
			anomalies.push(toIgvAnomaly(check, input.declaredIgvPen));
		if (check.subagent === "rce-subagent") anomalies.push(toRceAnomaly(check));
		if (check.subagent === "detraction-validator")
			anomalies.push(toDetractionAnomaly(check));
	}

	return anomalies;
}
