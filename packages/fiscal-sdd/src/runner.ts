/**
 * FiscalSDDRunner — generic, sequential phase pipeline executor.
 *
 * Runs phases one at a time in order. After each phase execution:
 * 1. Runs the phase's gate (if defined)
 * 2. Collects evidence artifacts
 * 3. Passes output to the next phase as input
 *
 * @example
 * ```ts
 * const runner = new FiscalSDDRunner();
 * const result = await runner.runPipeline(myPipeline, initialInput, {
 *   runId: "run-001",
 *   scope: { organizationId: "org-1", companyId: "comp-1", ... },
 * });
 * ```
 */

import type {
	FiscalPhaseDef,
	FiscalSDDPipeline,
	NewEvidenceArtifact,
	PhaseContext,
	PhaseResult,
	PipelineResult,
} from "./types";

/** Error thrown when a phase is blocked by its gate. */
export class PhaseGateBlockedError extends Error {
	constructor(phaseName: string, gateName: string, reasons: string[]) {
		super(
			`Phase "${phaseName}" blocked by gate "${gateName}": ${reasons.join("; ")}`,
		);
		this.name = "PhaseGateBlockedError";
	}
}

/** Error thrown when a phase execution fails. */
export class PhaseExecutionError extends Error {
	constructor(phaseName: string, cause: string) {
		super(`Phase "${phaseName}" execution failed: ${cause}`);
		this.name = "PhaseExecutionError";
	}
}

/**
 * Generic SDD pipeline runner.
 *
 * Executes phases sequentially, passing output of each phase as input
 * to the next phase. Gates validate phase output before proceeding.
 */
export class FiscalSDDRunner {
	/**
	 * Run a complete SDD pipeline.
	 *
	 * @param pipeline - The pipeline definition
	 * @param initialInput - Input for the first phase
	 * @param context - Shared phase context
	 * @returns Complete pipeline result
	 */
	async runPipeline(
		pipeline: FiscalSDDPipeline,
		initialInput: unknown,
		context: Partial<PhaseContext>,
	): Promise<PipelineResult> {
		const startTime = Date.now();
		const phaseResults: PhaseResult[] = [];
		const allEvidenceArtifacts: NewEvidenceArtifact[] = [];
		let blockedAtPhase: string | null = null;
		let currentInput: unknown = initialInput;

		for (const phase of pipeline.phases) {
			const result = await this.runPhase(
				phase,
				currentInput,
				context,
				pipeline.onGateBlocked,
			);

			phaseResults.push(result);
			allEvidenceArtifacts.push(...result.evidenceArtifacts);

			if (result.status === "FAILED" || result.status === "BLOCKED") {
				blockedAtPhase = phase.name;
				break;
			}

			// Pass output as input to next phase
			currentInput = result.output;
		}

		const totalDurationMs = Date.now() - startTime;
		const hasFailure = phaseResults.some((r) => r.status === "FAILED");
		const status = hasFailure
			? "FAILED"
			: blockedAtPhase !== null
				? "BLOCKED"
				: phaseResults.every((r) => r.status === "SUCCESS")
					? "COMPLETED"
					: "FAILED";

		return {
			pipelineId: pipeline.id,
			status,
			phaseResults,
			totalDurationMs,
			blockedAtPhase,
			allEvidenceArtifacts,
		};
	}

	/**
	 * Run a single phase with gate validation.
	 */
	private async runPhase(
		phase: FiscalPhaseDef,
		input: unknown,
		context: Partial<PhaseContext>,
		onGateBlocked: "STOP" | "WARN_CONTINUE" | "ESCALATE",
		_phaseIndex?: number,
	): Promise<PhaseResult> {
		const ctx: PhaseContext = {
			runId: context.runId ?? "unknown",
			scope: context.scope,
			evidenceStore: context.evidenceStore,
			previousPhaseResults: context.previousPhaseResults ?? new Map(),
			metadata: context.metadata ?? {},
		};

		// Store input as evidence artifact
		const inputArtifact: NewEvidenceArtifact = {
			artifactId: `${phase.name}-input-${Date.now()}`,
			phase: phase.name,
			pipelineRunId: context.runId ?? "unknown",
			evidenceKind: "PHASE_INPUT",
			content: input,
			hash: "",
			parentHash: null,
			createdAt: new Date().toISOString(),
		};

		this.storeIfAvailable(ctx, inputArtifact);

		// Execute phase
		let phaseResult: PhaseResult;
		try {
			phaseResult = await phase.execute(input, ctx);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			return {
				status: "FAILED",
				output: null,
				gatesPassed: [],
				evidenceArtifacts: [inputArtifact],
				errors: [errorMsg],
				confidence: 0,
			};
		}

		// Store output as evidence artifact
		const outputHash = simpleHash(JSON.stringify(phaseResult.output));
		const outputArtifact: NewEvidenceArtifact = {
			artifactId: `${phase.name}-output-${Date.now()}`,
			phase: phase.name,
			pipelineRunId: context.runId ?? "unknown",
			evidenceKind: "PHASE_OUTPUT",
			content: phaseResult.output,
			hash: outputHash,
			parentHash: inputArtifact.artifactId,
			createdAt: new Date().toISOString(),
		};

		this.storeIfAvailable(ctx, outputArtifact);

		const evidenceArtifacts: NewEvidenceArtifact[] = [
			inputArtifact,
			outputArtifact,
		];

		// Run phase gate
		if (phase.gate) {
			try {
				const verdict = await phase.gate.validate(
					input,
					phaseResult.output,
					ctx,
				);
				phaseResult.gatesPassed = [verdict];

				// Store gate result as evidence
				const gateArtifact: NewEvidenceArtifact = {
					artifactId: `${phase.name}-gate-${Date.now()}`,
					phase: phase.name,
					pipelineRunId: context.runId ?? "unknown",
					evidenceKind: "GATE_RESULT",
					content: verdict,
					hash: simpleHash(JSON.stringify(verdict)),
					parentHash: outputHash,
					createdAt: new Date().toISOString(),
				};

				this.storeIfAvailable(ctx, gateArtifact);
				evidenceArtifacts.push(gateArtifact);

				if (!verdict.passed && verdict.severity === "BLOCKING") {
					if (onGateBlocked === "STOP") {
						return {
							status: "BLOCKED",
							output: phaseResult.output,
							gatesPassed: [verdict],
							evidenceArtifacts,
							errors: [
								`Gate "${phase.gate.name}" blocked: ${verdict.reasons.join("; ")}`,
							],
							confidence: 0,
						};
					}
					if (onGateBlocked === "WARN_CONTINUE") {
						phaseResult.errors.push(
							`Gate warning: ${verdict.reasons.join("; ")}`,
						);
					}
					// ESCALATE: caller handles
				}
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : String(err);
				phaseResult.errors.push(`Gate threw: ${errorMsg}`);
			}
		}

		return {
			...phaseResult,
			evidenceArtifacts,
		};
	}

	/** Fire-and-forget evidence store. */
	private storeIfAvailable(
		ctx: PhaseContext,
		artifact: NewEvidenceArtifact,
	): void {
		if (!ctx.evidenceStore?.store) return;
		ctx.evidenceStore.store(artifact).catch(() => {
			// Non-blocking
		});
	}
}

/** Simple string hash for evidence artifact IDs. */
function simpleHash(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0;
	}
	return Math.abs(hash).toString(16).padStart(8, "0");
}
