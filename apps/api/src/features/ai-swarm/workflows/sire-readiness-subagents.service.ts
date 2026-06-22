import {
	buildAnomalies,
	runDetractionValidator,
	type SubagentResult,
} from "./sire-detraction-subagent";

export type { SireAnomaly, SubagentResult } from "./sire-detraction-subagent";

/**
 * SireReadinessInput interface.
 *
 * @example
 * ```ts
 * const value: SireReadinessInput = {} as SireReadinessInput;
 * console.log(value);
 * ```
 */
export interface SireReadinessInput {
	companyId: string;
	period: string; // YYYY-MM
	declaredIgvPen: number;
	salesTotalPen: number;
	rvieRecords: number;
	rceRecords: number;
	pleSalesRecords: number;
	plePurchaseRecords: number;
	// Detraction fields (optional — only for services subject to SPOT)
	detractionAmountPen?: number; // Total detracciones declaradas en el período
	detractionableBasePen?: number; // Base imponible sujeta a SPOT (servicios >S/700)
}

/**
 * ReadinessStatus type.
 *
 * @example
 * ```ts
 * const value: ReadinessStatus = {} as ReadinessStatus;
 * console.log(value);
 * ```
 */
export type ReadinessStatus = "ready" | "manual_review" | "blocked";

const TARGET_MS = 5_000;
const IGV_TOLERANCE_PEN = 2;

async function runIgvSubagent(
	input: SireReadinessInput,
): Promise<SubagentResult> {
	const expectedIgv = Number((input.salesTotalPen * 0.18).toFixed(2));
	const gap = Number(Math.abs(input.declaredIgvPen - expectedIgv).toFixed(2));
	const failed = gap > IGV_TOLERANCE_PEN;

	return {
		subagent: "igv-subagent",
		status: failed ? "fail" : "pass",
		confidence: failed ? 0.75 : 0.95,
		message: failed
			? `IGV inconsistente para periodo ${input.period}.`
			: `IGV consistente para periodo ${input.period}.`,
		evidence: {
			expectedIgvPen: expectedIgv,
			declaredIgvPen: input.declaredIgvPen,
			gapPen: gap,
			tolerancePen: IGV_TOLERANCE_PEN,
		},
	};
}

async function runRceSubagent(
	input: SireReadinessInput,
): Promise<SubagentResult> {
	const rvieGap = input.rvieRecords - input.pleSalesRecords;
	const rceGap = input.rceRecords - input.plePurchaseRecords;
	const hasGap = rvieGap !== 0 || rceGap !== 0;

	return {
		subagent: "rce-subagent",
		status: hasGap ? "warn" : "pass",
		confidence: hasGap ? 0.72 : 0.94,
		message: hasGap
			? "RVIE/RCE requiere conciliación manual con PLE."
			: "RVIE/RCE alineado con PLE.",
		evidence: {
			rvieGap,
			rceGap,
			rvieRecords: input.rvieRecords,
			rceRecords: input.rceRecords,
			pleSalesRecords: input.pleSalesRecords,
			plePurchaseRecords: input.plePurchaseRecords,
		},
	};
}

function resolveStatus(results: SubagentResult[]): ReadinessStatus {
	if (results.some((result) => result.status === "fail")) return "blocked";
	if (results.some((result) => result.status === "warn"))
		return "manual_review";
	return "ready";
}

/**
 * SireReadinessSubagentsService class.
 *
 * @example
 * ```ts
 * const value = new SireReadinessSubagentsService();
 * console.log(value);
 * ```
 */
export class SireReadinessSubagentsService {
	async run(input: SireReadinessInput): Promise<{
		companyId: string;
		period: string;
		status: ReadinessStatus;
		checks: SubagentResult[];
		execution: {
			targetMs: number;
			durationMs: number;
			withinTarget: boolean;
			mode: "parallel-subagents";
		};
	}> {
		const startedAt = Date.now();
		const checks = await Promise.all([
			runIgvSubagent(input),
			runRceSubagent(input),
		]);
		const durationMs = Date.now() - startedAt;

		return {
			companyId: input.companyId,
			period: input.period,
			status: resolveStatus(checks),
			checks,
			execution: {
				targetMs: TARGET_MS,
				durationMs,
				withinTarget: durationMs <= TARGET_MS,
				mode: "parallel-subagents",
			},
		};
	}

	async runFull(input: SireReadinessInput): Promise<{
		companyId: string;
		period: string;
		status: ReadinessStatus;
		checks: SubagentResult[];
		anomalies: import("./sire-detraction-subagent").SireAnomaly[];
		execution: {
			targetMs: number;
			durationMs: number;
			withinTarget: boolean;
			mode: "parallel-subagents";
		};
	}> {
		const startedAt = Date.now();
		const checks = await Promise.all([
			runIgvSubagent(input),
			runRceSubagent(input),
			runDetractionValidator(input),
		]);
		const durationMs = Date.now() - startedAt;

		return {
			companyId: input.companyId,
			period: input.period,
			status: resolveStatus(checks),
			checks,
			anomalies: buildAnomalies(checks, {
				declaredIgvPen: input.declaredIgvPen,
			}),
			execution: {
				targetMs: TARGET_MS,
				durationMs,
				withinTarget: durationMs <= TARGET_MS,
				mode: "parallel-subagents",
			},
		};
	}
}
