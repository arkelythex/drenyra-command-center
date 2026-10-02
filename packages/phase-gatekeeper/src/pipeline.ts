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
		const gateCtx: GatekeeperContext = {
			previousGates,
			...(ctx?.scope ? { scope: ctx.scope } : {}),
			...(ctx?.evidenceStore ? { evidenceStore: ctx.evidenceStore } : {}),
		};
		const gating = !this.config.gatesDisabled;

		// --- Pre-gates ---
		const pre = gating
			? await this.evaluateGates(
					"Pre-gate",
					gates.preGates,
					input,
					gateCtx,
					errors,
				)
			: { results: [], blocked: null };
		if (pre.blocked) {
			// STOP blocks; ESCALATE pauses for human review. Neither runs the phase.
			return {
				phaseName,
				status: "BLOCKED",
				output: null,
				preGateResults: pre.results,
				postGateResults: [],
				errors: [pre.blocked],
				durationMs: Date.now() - startTime,
			};
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
		const post =
			gating && output !== null
				? await this.evaluateGates(
						"Post-gate",
						gates.postGates,
						output,
						gateCtx,
						errors,
					)
				: { results: [], blocked: null };
		if (post.blocked) {
			return {
				phaseName,
				status: "BLOCKED",
				output,
				preGateResults: pre.results,
				postGateResults: post.results,
				errors: [...errors, post.blocked],
				durationMs: Date.now() - startTime,
			};
		}

		// --- Determine status ---
		const anyBlocking = [...pre.results, ...post.results].some(
			isBlockingFailure,
		);
		let status: "SUCCESS" | "BLOCKED" | "FAILED" = "SUCCESS";
		if (executionError) status = "FAILED";
		else if (this.config.onGateBlocked !== "WARN_CONTINUE" && anyBlocking)
			status = "BLOCKED";

		return {
			phaseName,
			status,
			output,
			preGateResults: pre.results,
			postGateResults: post.results,
			errors,
			durationMs: Date.now() - startTime,
		};
	}

	/**
	 * Run gates in order. A throwing gate becomes a BLOCKING verdict; a blocking
	 * failure either records a warning (WARN_CONTINUE) or stops evaluation and
	 * returns the blocking message (STOP / ESCALATE).
	 */
	private async evaluateGates<T>(
		kind: "Pre-gate" | "Post-gate",
		gates: GatekeeperCheck<T>[],
		value: T,
		gateCtx: GatekeeperContext,
		errors: string[],
	): Promise<{ results: GatekeeperVerdict[]; blocked: string | null }> {
		const results: GatekeeperVerdict[] = [];
		const mode = this.config.onGateBlocked;
		for (const gate of gates) {
			try {
				const verdict = await gate.check(value, gateCtx);
				gateCtx.previousGates.set(gate.name, verdict);
				results.push(verdict);
				if (!isBlockingFailure(verdict)) continue;
				if (mode === "WARN_CONTINUE") {
					errors.push(
						`${kind} "${gate.name}" warning: ${verdict.reasons.join("; ")}`,
					);
				} else {
					return {
						results,
						blocked: blockedMessage(kind, gate.name, verdict.reasons, mode),
					};
				}
			} catch (err) {
				const msg = `${kind} "${gate.name}" threw: ${err instanceof Error ? err.message : String(err)}`;
				errors.push(msg);
				results.push({
					passed: false,
					reasons: [msg],
					severity: "BLOCKING",
					details: { error: String(err) },
				});
			}
		}
		return { results, blocked: null };
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

/** Message for a blocking gate: STOP blocks, ESCALATE hands the phase to a human. */
function blockedMessage(
	kind: "Pre-gate" | "Post-gate",
	gateName: string,
	reasons: string[],
	mode: "STOP" | "ESCALATE",
): string {
	const verb = mode === "ESCALATE" ? "escalated for human review" : "blocked";
	return `${kind} "${gateName}" ${verb}: ${reasons.join("; ")}`;
}

function isBlockingFailure(verdict: GatekeeperVerdict): boolean {
	return !verdict.passed && verdict.severity === "BLOCKING";
}
