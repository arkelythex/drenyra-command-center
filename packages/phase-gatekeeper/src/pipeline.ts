/**
 * GatedPhasePipeline — wraps phase execution with pre/post gatekeepers.
 *
 * Each phase in the pipeline is wrapped with:
 * 1. Pre-gates: validate input BEFORE executing the phase
 * 2. Phase execution: the actual work
 * 3. Post-gates: validate output AFTER executing the phase
 *
 * If any BLOCKING gate fails and the config says STOP, the pipeline
 * stops immediately and returns a BLOCKED result.
 *
 * @example
 * ```ts
 * const pipeline = new GatedPhasePipeline({ onGateBlocked: "STOP" });
 * const result = await pipeline.runPhase("reader", input, readerExecute, {
 *   preGates: [minimalDataGate],
 *   postGates: [],
 * });
 * ```
 */

import type {
	GatedPhaseResult,
	GatedPipelineConfig,
	GatedPipelineRunResult,
	GatekeeperCheck,
	GatekeeperContext,
	GatekeeperVerdict,
} from "./types";
import { DEFAULT_GATED_PIPELINE_CONFIG } from "./types";

/**
 * Wraps phase execution with gatekeeper validation.
 */
export class GatedPhasePipeline {
	private config: GatedPipelineConfig;

	constructor(config?: Partial<GatedPipelineConfig>) {
		this.config = { ...DEFAULT_GATED_PIPELINE_CONFIG, ...config };
	}

	/**
	 * Run a single phase through pre-gates, execution, and post-gates.
	 *
	 * @param phaseName - Identifier for the phase
	 * @param input - Phase input data
	 * @param execute - The phase execution function
	 * @param gates - Pre and post gates
	 * @param ctx - Optional gatekeeper context
	 * @returns The gated phase result
	 */
	async runPhase<I, O>(
		phaseName: string,
		input: I,
		execute: (input: I) => Promise<O>,
		gates: { preGates: GatekeeperCheck<I>[]; postGates: GatekeeperCheck<O>[] },
		ctx?: Partial<GatekeeperContext>,
	): Promise<GatedPhaseResult<O>> {
		const startTime = Date.now();
		const previousGates = new Map<string, GatekeeperVerdict>();
		const errors: string[] = [];

		// --- Pre-gates ---
		const preGateResults: GatekeeperVerdict[] = [];
		if (!this.config.gatesDisabled) {
			for (const gate of gates.preGates) {
				try {
					const gateCtx: GatekeeperContext = {
						previousGates,
						scope: ctx?.scope,
						evidenceStore: ctx?.evidenceStore,
					};
					const verdict = await gate.check(input, gateCtx);
					previousGates.set(gate.name, verdict);
					preGateResults.push(verdict);

					if (!verdict.passed && verdict.severity === "BLOCKING") {
						if (this.config.onGateBlocked === "STOP") {
							return {
								phaseName,
								status: "BLOCKED",
								output: null,
								preGateResults,
								postGateResults: [],
								errors: [
									`Pre-gate "${gate.name}" blocked: ${verdict.reasons.join("; ")}`,
								],
								durationMs: Date.now() - startTime,
							};
						}
						if (this.config.onGateBlocked === "WARN_CONTINUE") {
							errors.push(
								`Pre-gate "${gate.name}" warning: ${verdict.reasons.join("; ")}`,
							);
						}
						// ESCALATE: caller handles; we continue and let the caller decide
					}
				} catch (err) {
					const msg = `Pre-gate "${gate.name}" threw: ${err instanceof Error ? err.message : String(err)}`;
					errors.push(msg);
					preGateResults.push({
						passed: false,
						reasons: [msg],
						severity: "BLOCKING",
						details: { error: String(err) },
					});
				}
			}
		}

		// --- Execute phase ---
		let output: O | null = null;
		let executionError: string | null = null;
		try {
			output = await execute(input);
		} catch (err) {
			executionError = err instanceof Error ? err.message : String(err);
			errors.push(`Phase execution failed: ${executionError}`);
		}

		// --- Post-gates ---
		const postGateResults: GatekeeperVerdict[] = [];
		if (!this.config.gatesDisabled && output !== null) {
			for (const gate of gates.postGates) {
				try {
					const gateCtx: GatekeeperContext = {
						previousGates,
						scope: ctx?.scope,
						evidenceStore: ctx?.evidenceStore,
					};
					const verdict = await gate.check(output, gateCtx);
					previousGates.set(gate.name, verdict);
					postGateResults.push(verdict);

					if (!verdict.passed && verdict.severity === "BLOCKING") {
						if (this.config.onGateBlocked === "STOP") {
							return {
								phaseName,
								status: "BLOCKED",
								output,
								preGateResults,
								postGateResults,
								errors: [
									...errors,
									`Post-gate "${gate.name}" blocked: ${verdict.reasons.join("; ")}`,
								],
								durationMs: Date.now() - startTime,
							};
						}
						if (this.config.onGateBlocked === "WARN_CONTINUE") {
							errors.push(
								`Post-gate "${gate.name}" warning: ${verdict.reasons.join("; ")}`,
							);
						}
					}
				} catch (err) {
					const msg = `Post-gate "${gate.name}" threw: ${err instanceof Error ? err.message : String(err)}`;
					errors.push(msg);
					postGateResults.push({
						passed: false,
						reasons: [msg],
						severity: "BLOCKING",
						details: { error: String(err) },
					});
				}
			}
		}

		// --- Determine status ---
		const isGateBlockedDuringExecution =
			this.config.onGateBlocked !== "WARN_CONTINUE";
		const hasBlockingPre = preGateResults.some(
			(r) => !r.passed && r.severity === "BLOCKING",
		);
		const hasBlockingPost = postGateResults.some(
			(r) => !r.passed && r.severity === "BLOCKING",
		);

		let status: "SUCCESS" | "BLOCKED" | "FAILED";
		if (executionError) {
			status = "FAILED";
		} else if (
			isGateBlockedDuringExecution &&
			(hasBlockingPre || hasBlockingPost)
		) {
			status = "BLOCKED";
		} else {
			status = "SUCCESS";
		}

		return {
			phaseName,
			status,
			output,
			preGateResults,
			postGateResults,
			errors,
			durationMs: Date.now() - startTime,
		};
	}

	/**
	 * Run multiple phases sequentially through the gated pipeline.
	 * If a phase returns BLOCKED (from configured failure mode),
	 * subsequent phases are skipped.
	 *
	 * @param phases - Array of phase definitions to run sequentially
	 * @param ctx - Optional shared gatekeeper context
	 * @returns The complete pipeline run result
	 */
	async runPipeline(
		phases: Array<{
			name: string;
			execute: (input: unknown) => Promise<unknown>;
			input: unknown;
			gates: { preGates: GatekeeperCheck[]; postGates: GatekeeperCheck[] };
		}>,
		ctx?: Partial<GatekeeperContext>,
	): Promise<GatedPipelineRunResult> {
		const startTime = Date.now();
		const phaseResults: GatedPhaseResult<unknown>[] = [];
		let blockedAtPhase: string | null = null;
		let lastOutput: unknown;

		for (const phase of phases) {
			const input = lastOutput ?? phase.input;
			const result = await this.runPhase(
				phase.name,
				input,
				phase.execute,
				phase.gates,
				ctx,
			);

			phaseResults.push(result);

			if (result.status === "BLOCKED") {
				blockedAtPhase = phase.name;
				break;
			}

			if (result.status === "FAILED") {
				blockedAtPhase = phase.name;
				break;
			}

			lastOutput = result.output;
		}

		const totalDurationMs = Date.now() - startTime;
		const status =
			blockedAtPhase !== null
				? "BLOCKED"
				: phaseResults.every((r) => r.status === "SUCCESS")
					? "COMPLETED"
					: "FAILED";

		return {
			status,
			phaseResults,
			totalDurationMs,
			blockedAtPhase,
		};
	}

	/** Update pipeline config at runtime. */
	updateConfig(config: Partial<GatedPipelineConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/** Get current config. */
	getConfig(): GatedPipelineConfig {
		return { ...this.config };
	}
}

export { DEFAULT_GATED_PIPELINE_CONFIG } from "./types";
