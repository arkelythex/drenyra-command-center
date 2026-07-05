/**
 * SIRE Audit Workflow
 *
 * Long-running SIRE compliance audit with parallel subagents.
 * Designed to be called from the SSE route; emits typed step events.
 *
 * Steps:
 *   1. Parallel validation (IGV + RCE + Detraction) via SireReadinessSubagentsService
 *   2. Optional CPE validation (<5s target)
 *   3. SIRE policy check (deferred/live based on company type)
 *   4. PLE generation in SUNAT TXT format (RV/RC)
 *   5. Optional SIRE submission (if !dryRun and !policy.isDeferred)
 */

import { z } from "zod";
import {
	type ValidateCpeOutput,
	validateCpe,
} from "../../cpe-validator/application/commands/validate-cpe.command";
import { evaluateSireSubmissionPolicy } from "../../sire/services/sire-policy-2026.service";
import { SireSubmissionService } from "../../sire/sire-submission.service";
import { generateSirePleFiles } from "./sire-ple-generation.service";
import type { SireAnomaly } from "./sire-readiness-subagents.service";
import { SireReadinessSubagentsService } from "./sire-readiness-subagents.service";

/**
 * SireAuditInputSchema const.
 *
 * @example
 * ```ts
 * console.log(SireAuditInputSchema);
 * ```
 */
export const SireAuditInputSchema = z.object({
	companyId: z.string().min(1),
	period: z
		.string()
		.regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato YYYY-MM requerido"),
	ruc: z.string().length(11),
	organizationId: z.number().int().positive().optional(),
	// Summary data for subagents
	declaredIgvPen: z.number().nonnegative(),
	salesTotalPen: z.number().nonnegative(),
	rvieRecords: z.number().int().nonnegative(),
	rceRecords: z.number().int().nonnegative(),
	pleSalesRecords: z.number().int().nonnegative(),
	plePurchaseRecords: z.number().int().nonnegative(),
	detractionAmountPen: z.number().nonnegative().optional(),
	detractionableBasePen: z.number().nonnegative().optional(),
	cpeValidation: z
		.object({
			cpeNumber: z.string().min(13),
			xmlContent: z.string().min(100),
			issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
			totalAmount: z.number().nonnegative(),
			skipCache: z.boolean().optional(),
		})
		.optional(),
	// Options
	dryRun: z.boolean().default(true),
	companyAnnualIncomePen: z.number().nonnegative().optional(),
	isPrico: z.boolean().optional(),
});

/**
 * SireAuditInput type.
 *
 * @example
 * ```ts
 * const value: SireAuditInput = {} as SireAuditInput;
 * console.log(value);
 * ```
 */
export type SireAuditInput = z.infer<typeof SireAuditInputSchema>;

/**
 * SireAuditStepEvent interface.
 *
 * @example
 * ```ts
 * const value: SireAuditStepEvent = {} as SireAuditStepEvent;
 * console.log(value);
 * ```
 */
export interface SireAuditStepEvent {
	step:
		| "validation"
		| "cpe-validation"
		| "policy-check"
		| "ple-generation"
		| "submission";
	status: "started" | "completed" | "failed" | "skipped";
	durationMs?: number;
	data?: Record<string, unknown>;
}

/**
 * SireAuditResult interface.
 *
 * @example
 * ```ts
 * const value: SireAuditResult = {} as SireAuditResult;
 * console.log(value);
 * ```
 */
export interface SireAuditResult {
	companyId: string;
	period: string;
	overallStatus: "ready" | "manual_review" | "blocked";
	consensusScore: number;
	anomalies: SireAnomaly[];
	policy: { isDeferred: boolean; reason: string; postponedUntil: string };
	pleSummary: {
		salesRecords: number;
		purchaseRecords: number;
		salesTotalPen: number;
		igvTotalPen: number;
	};
	pleFiles: {
		ventas: { filename: string; recordCount: number; bytes: number };
		compras: { filename: string; recordCount: number; bytes: number };
	};
	submission: { attempted: boolean; result?: unknown; skippedReason?: string };
	executionMs: number;
}

/**
 * SireAuditOnStep type.
 *
 * @example
 * ```ts
 * const value: SireAuditOnStep = {} as SireAuditOnStep;
 * console.log(value);
 * ```
 */
export type SireAuditOnStep = (event: SireAuditStepEvent) => void;

// Re-export so callers don't need to import from the service directly
export type { SireAnomaly };

const readinessService = new SireReadinessSubagentsService();

/** Map readiness status to consensus score (0-1 range for Task 1.2 consensus engine) */
function statusToScore(status: "ready" | "manual_review" | "blocked"): number {
	if (status === "ready") return 0.95;
	if (status === "manual_review") return 0.7;
	return 0.3;
}

async function attemptSubmission(
	input: SireAuditInput,
	payloadBase64: string,
	onStep: SireAuditOnStep,
): Promise<SireAuditResult["submission"]> {
	onStep({ step: "submission", status: "started" });
	try {
		const result = await SireSubmissionService.submit({
			companyId: input.companyId,
			period: input.period,
			ledgerType: "ventas",
			payloadFormat: "txt",
			payloadBase64,
		});
		onStep({
			step: "submission",
			status: "completed",
			data: { submissionId: result.submissionId, status: result.status },
		});
		return { attempted: true, result };
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		onStep({ step: "submission", status: "failed", data: { error: msg } });
		return { attempted: true, skippedReason: msg };
	}
}

function buildCpeAnomaly(result: ValidateCpeOutput): SireAnomaly {
	const primaryError =
		result.errors[0]?.message ?? result.warnings[0] ?? "CPE no valido";
	const breachType =
		result.breachType ?? result.errors[0]?.code ?? "CPE_INVALID";

	return {
		type: "cpe_breach",
		subagent: "cpe-validator",
		gapPen: 0,
		description: `CPE bloqueado (${breachType}): ${primaryError}`,
	};
}

/**
 * runSireAuditWorkflow operation.
 *
 * @param input - Input for input.
 * @param onStep - Input for onStep.
 * @returns Result of runSireAuditWorkflow.
 * @example
 * ```ts
 * const result = await runSireAuditWorkflow({} as SireAuditInput, {} as SireAuditOnStep);
 * console.log(result);
 * ```
 */
export async function runSireAuditWorkflow(
	input: SireAuditInput,
	onStep: SireAuditOnStep,
): Promise<SireAuditResult> {
	const startedAt = Date.now();

	// Step 1: Parallel validation (3 subagents)
	onStep({ step: "validation", status: "started" });
	const step1Start = Date.now();
	const readiness = await readinessService.runFull(input);
	onStep({
		step: "validation",
		status: "completed",
		durationMs: Date.now() - step1Start,
		data: {
			status: readiness.status,
			anomalies: readiness.anomalies.length,
			checks: readiness.checks.length,
		},
	});

	// Step 2: Optional real-time CPE validation
	let cpeResult: ValidateCpeOutput | undefined;
	const anomalies: SireAnomaly[] = [...readiness.anomalies];
	let overallStatus = readiness.status;

	if (!input.cpeValidation) {
		onStep({
			step: "cpe-validation",
			status: "skipped",
			data: { reason: "cpeValidation-not-provided" },
		});
	} else {
		const cpeStartedAt = Date.now();
		onStep({ step: "cpe-validation", status: "started" });
		cpeResult = await validateCpe({
			companyRuc: input.ruc,
			cpeNumber: input.cpeValidation.cpeNumber,
			xmlContent: input.cpeValidation.xmlContent,
			issueDate: input.cpeValidation.issueDate,
			totalAmount: input.cpeValidation.totalAmount,
			skipCache: input.cpeValidation.skipCache,
		});
		const cpeBlocked = !cpeResult.isValid || cpeResult.breachDetected;
		if (cpeBlocked) {
			overallStatus = "blocked";
			anomalies.push(buildCpeAnomaly(cpeResult));
		}
		onStep({
			step: "cpe-validation",
			status: "completed",
			durationMs: Date.now() - cpeStartedAt,
			data: {
				isValid: cpeResult.isValid,
				breachDetected: cpeResult.breachDetected,
				breachType: cpeResult.breachType,
				withinTarget: cpeResult.withinTarget,
				cacheHit: cpeResult.cacheHit,
			},
		});
	}

	// Step 3: SIRE policy check
	onStep({ step: "policy-check", status: "started" });
	const policy = evaluateSireSubmissionPolicy({
		period: input.period,
		companyAnnualIncomePen: input.companyAnnualIncomePen,
		isPrico: input.isPrico,
	});
	onStep({
		step: "policy-check",
		status: "completed",
		data: {
			isDeferred: policy.isDeferred,
			postponedUntil: policy.postponedUntil,
		},
	});

	// Step 4: Generate PLE files in SUNAT TXT format
	onStep({ step: "ple-generation", status: "started" });
	const pleGeneration = await generateSirePleFiles(input);
	onStep({
		step: "ple-generation",
		status: "completed",
		data: {
			...pleGeneration.summary,
			ventas: {
				filename: pleGeneration.files.ventas.filename,
				recordCount: pleGeneration.files.ventas.recordCount,
				bytes: pleGeneration.files.ventas.bytes,
			},
			compras: {
				filename: pleGeneration.files.compras.filename,
				recordCount: pleGeneration.files.compras.recordCount,
				bytes: pleGeneration.files.compras.bytes,
			},
		},
	});

	// Step 5: Optional SIRE submission
	let submission: SireAuditResult["submission"];

	if (input.dryRun) {
		onStep({
			step: "submission",
			status: "skipped",
			data: { reason: "dryRun=true" },
		});
		submission = { attempted: false, skippedReason: "dryRun=true" };
	} else if (policy.isDeferred) {
		onStep({
			step: "submission",
			status: "skipped",
			data: { reason: policy.reason },
		});
		submission = { attempted: false, skippedReason: policy.reason };
	} else if (overallStatus === "blocked") {
		onStep({
			step: "submission",
			status: "skipped",
			data: { reason: "validation-blocked" },
		});
		submission = {
			attempted: false,
			skippedReason: "Validación bloqueada — resolver anomalías primero",
		};
	} else {
		submission = await attemptSubmission(
			input,
			pleGeneration.files.ventas.payloadBase64,
			onStep,
		);
	}

	return {
		companyId: input.companyId,
		period: input.period,
		overallStatus,
		consensusScore: statusToScore(overallStatus),
		anomalies,
		policy: {
			isDeferred: policy.isDeferred,
			reason: policy.reason,
			postponedUntil: policy.postponedUntil,
		},
		pleSummary: pleGeneration.summary,
		pleFiles: {
			ventas: {
				filename: pleGeneration.files.ventas.filename,
				recordCount: pleGeneration.files.ventas.recordCount,
				bytes: pleGeneration.files.ventas.bytes,
			},
			compras: {
				filename: pleGeneration.files.compras.filename,
				recordCount: pleGeneration.files.compras.recordCount,
				bytes: pleGeneration.files.compras.bytes,
			},
		},
		submission,
		executionMs: Date.now() - startedAt,
	};
}
