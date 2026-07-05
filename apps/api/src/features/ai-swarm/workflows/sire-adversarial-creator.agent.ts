import type {
	SireAdversarialInput,
	SireCreatorProposal,
} from "./sire-adversarial-audit.types";

const IGV_RATE = 0.18;
const IGV_SOFT_TOLERANCE_PEN = 2;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * runSireCreatorAgent operation.
 *
 * @param input - Input for input.
 * @returns Result of runSireCreatorAgent.
 * @example
 * ```ts
 * const result = runSireCreatorAgent({} as SireAdversarialInput);
 * console.log(result);
 * ```
 */
export function runSireCreatorAgent(
	input: SireAdversarialInput,
): SireCreatorProposal {
	const expectedIgv = Number((input.salesTotalPen * IGV_RATE).toFixed(2));
	const igvGap = Number(
		Math.abs(input.declaredIgvPen - expectedIgv).toFixed(2),
	);
	const rvieGap = Math.abs(input.rvieRecords - input.pleSalesRecords);
	const rceGap = Math.abs(input.rceRecords - input.plePurchaseRecords);
	const hasRecordGap = rvieGap > 0 || rceGap > 0;

	const expectedDetraction =
		typeof input.detractionableBasePen === "number"
			? Number((input.detractionableBasePen * 0.1).toFixed(2))
			: 0;
	const detractionCurrent = input.detractionAmountPen ?? 0;
	const detractionGap = Number(
		Math.abs(detractionCurrent - expectedDetraction).toFixed(2),
	);
	const hasDetractionGap =
		typeof input.detractionableBasePen === "number" && detractionGap > 5;

	const shouldSubmit =
		igvGap <= IGV_SOFT_TOLERANCE_PEN && !hasRecordGap && !hasDetractionGap;

	const reasons = shouldSubmit
		? [
				"IGV dentro de tolerancia operativa.",
				"RVIE/RCE correlativos contra PLE.",
				"Sin brechas SPOT relevantes para bloqueo.",
			]
		: [
				igvGap > IGV_SOFT_TOLERANCE_PEN
					? `IGV fuera de tolerancia (gap S/ ${igvGap.toFixed(2)}).`
					: "IGV consistente.",
				hasRecordGap
					? `Brecha de correlatividad RVIE/RCE detectada (RVIE ${rvieGap}, RCE ${rceGap}).`
					: "Correlatividad RVIE/RCE alineada.",
				hasDetractionGap
					? `SPOT con diferencia de S/ ${detractionGap.toFixed(2)}.`
					: "Sin brecha SPOT material.",
			];

	const confidencePenalty =
		Math.min(igvGap / 100, 0.2) +
		(hasRecordGap ? 0.08 : 0) +
		(hasDetractionGap ? 0.08 : 0);
	const confidenceBase = shouldSubmit ? 0.86 : 0.68;
	const confidence = clamp(
		Number((confidenceBase - confidencePenalty).toFixed(3)),
		0.5,
		0.96,
	);

	const recommendedAdjustments: SireCreatorProposal["recommendedAdjustments"] =
		[];

	if (igvGap > 0) {
		recommendedAdjustments.push({
			field: "igv",
			current: input.declaredIgvPen,
			expected: expectedIgv,
			gap: igvGap,
		});
	}

	if (hasRecordGap) {
		recommendedAdjustments.push({
			field: "rvie_rce",
			current: input.rvieRecords + input.rceRecords,
			expected: input.pleSalesRecords + input.plePurchaseRecords,
			gap: rvieGap + rceGap,
		});
	}

	if (typeof input.detractionableBasePen === "number" && detractionGap > 0) {
		recommendedAdjustments.push({
			field: "detraction",
			current: detractionCurrent,
			expected: expectedDetraction,
			gap: detractionGap,
		});
	}

	return {
		intent: shouldSubmit ? "submit_sire" : "reconcile_first",
		confidence,
		reasons,
		recommendedAdjustments,
	};
}
