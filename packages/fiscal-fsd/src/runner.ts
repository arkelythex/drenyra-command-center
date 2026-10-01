/**
 * FiscalFSDRunner — generic, sequential phase pipeline executor.
 *
 * Runs phases one at a time in order. After each phase execution:
 * 1. Runs the phase's gate (if defined)
 * 2. Collects evidence artifacts
 * 3. Passes output to the next phase as input
 *
 * @example
 * ```ts
 * const runner = new FiscalFSDRunner();
 * const result = await runner.runPipeline(myPipeline, initialInput, {
 *   runId: "run-001",
 *   scope: { organizationId: "org-1", companyId: "comp-1", ... },
 * });
 * ```
 */

import type {
	FiscalFSDPipeline,
	FiscalPhaseDef,
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
 * Generic FSD pipeline runner.
 *
 * Executes phases sequentially, passing output of each phase as input
 * to the next phase. Gates validate phase output before proceeding.
 */
export class FiscalFSDRunner {
	/**
	 * Run a complete FSD pipeline.
	 *
	 * @param pipeline - The pipeline definition
	 * @param initialInput - Input for the first phase
	 * @param context - Shared phase context
	 * @returns Complete pipeline result
	 */
	async runPipeline(
		pipeline: FiscalFSDPipeline,
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
		const ctx = this.buildContext(context);
		const runId = context.runId ?? "unknown";

		// Store input as evidence artifact
		const inputArtifact = this.makeArtifact({
			phase: phase.name,
			runId,
			suffix: "input",
			kind: "PHASE_INPUT",
			content: input,
			hash: "",
			parentHash: null,
		});
		this.storeIfAvailable(ctx, inputArtifact);

		// Execute phase
		let phaseResult: PhaseResult;
		try {
			phaseResult = await phase.execute(input, ctx);
		} catch (err) {
			return this.failedPhaseResult(err, inputArtifact);
		}

		// Store output as evidence artifact
		const outputHash = simpleHash(JSON.stringify(phaseResult.output));
		const outputArtifact = this.makeArtifact({
			phase: phase.name,
			runId,
			suffix: "output",
			kind: "PHASE_OUTPUT",
			content: phaseResult.output,
			hash: outputHash,
			parentHash: inputArtifact.artifactId,
		});
		this.storeIfAvailable(ctx, outputArtifact);

		const evidenceArtifacts: NewEvidenceArtifact[] = [
			inputArtifact,
			outputArtifact,
		];

		// Run phase gate
		if (phase.gate) {
			const blocked = await this.applyGate({
				phase,
				gate: phase.gate,
				input,
				phaseResult,
				ctx,
				runId,
				outputHash,
				evidenceArtifacts,
				onGateBlocked,
			});
			if (blocked) return blocked;
		}

		return {
			...phaseResult,
			evidenceArtifacts,
		};
	}

	private buildContext(context: Partial<PhaseContext>): PhaseContext {
		return {
			runId: context.runId ?? "unknown",
			scope: context.scope,
			evidenceStore: context.evidenceStore,
			previousPhaseResults: context.previousPhaseResults ?? new Map(),
			metadata: context.metadata ?? {},
		};
	}

	private makeArtifact(args: {
		phase: string;
		runId: string;
		suffix: "input" | "output" | "gate";
		kind: NewEvidenceArtifact["evidenceKind"];
		content: unknown;
		hash: string;
		parentHash: string | null;
	}): NewEvidenceArtifact {
		return {
			artifactId: `${args.phase}-${args.suffix}-${Date.now()}`,
			phase: args.phase,
			pipelineRunId: args.runId,
			evidenceKind: args.kind,
			content: args.content,
			hash: args.hash,
			parentHash: args.parentHash,
			createdAt: new Date().toISOString(),
		};
	}

	private failedPhaseResult(
		err: unknown,
		inputArtifact: NewEvidenceArtifact,
	): PhaseResult {
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

	/**
	 * Validate the phase gate and record its evidence. Returns a BLOCKED result when
	 * the gate blocks in STOP mode; otherwise mutates `phaseResult` and returns null.
	 */
	private async applyGate(args: {
		phase: FiscalPhaseDef;
		gate: NonNullable<FiscalPhaseDef["gate"]>;
		input: unknown;
		phaseResult: PhaseResult;
		ctx: PhaseContext;
		runId: string;
		outputHash: string;
		evidenceArtifacts: NewEvidenceArtifact[];
		onGateBlocked: "STOP" | "WARN_CONTINUE" | "ESCALATE";
	}): Promise<PhaseResult | null> {
		const { phase, gate, phaseResult, evidenceArtifacts, onGateBlocked } = args;
		try {
			const verdict = await gate.validate(
				args.input,
				phaseResult.output,
				args.ctx,
			);
			phaseResult.gatesPassed = [verdict];

			// Store gate result as evidence
			const gateArtifact = this.makeArtifact({
				phase: phase.name,
				runId: args.runId,
				suffix: "gate",
				kind: "GATE_RESULT",
				content: verdict,
				hash: simpleHash(JSON.stringify(verdict)),
				parentHash: args.outputHash,
			});
			this.storeIfAvailable(args.ctx, gateArtifact);
			evidenceArtifacts.push(gateArtifact);

			if (verdict.passed || verdict.severity !== "BLOCKING") return null;

			if (onGateBlocked === "STOP") {
				return {
					status: "BLOCKED",
					output: phaseResult.output,
					gatesPassed: [verdict],
					evidenceArtifacts,
					errors: [
						`Gate "${gate.name}" blocked: ${verdict.reasons.join("; ")}`,
					],
					confidence: 0,
				};
			}
			if (onGateBlocked === "WARN_CONTINUE") {
				phaseResult.errors.push(`Gate warning: ${verdict.reasons.join("; ")}`);
			}
			// ESCALATE: caller handles
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			phaseResult.errors.push(`Gate threw: ${errorMsg}`);
		}
		return null;
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
