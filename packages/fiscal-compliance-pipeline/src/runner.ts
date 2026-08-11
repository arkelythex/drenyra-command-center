/**
 * CompliancePipelineRunner — executes chains of compliance stages
 * with dependency graph resolution and review gates.
 *
 * @example
 * ```ts
 * const runner = new CompliancePipelineRunner();
 * const result = await runner.runChain(IGV_CHANGE_CHAIN, rateChange, {});
 * // If all stages PASSED, the chain is compliant.
 * // If any stage needs REVIEW, the chain pauses for approval.
 * ```
 */

import type {
	ComplianceChain,
	ComplianceChainResult,
	ComplianceContext,
	ComplianceFinding,
	ComplianceStage,
	ComplianceStageResult,
	FiscalRuleChange,
} from "./types";

/** Error thrown when a compliance stage blocks. */
export class ComplianceStageBlockedError extends Error {
	constructor(stageId: string, reasons: string[]) {
		super(`Compliance stage "${stageId}" blocked: ${reasons.join("; ")}`);
		this.name = "ComplianceStageBlockedError";
	}
}

/**
 * Executes compliance stages respecting dependency order.
 *
 * Stages with `requiredApproval: true` pause execution and return
 * `REVIEW_NEEDED`. The caller must approve before continuing.
 */
export class CompliancePipelineRunner {
	/**
	 * Run a complete compliance chain.
	 *
	 * Stages are executed in dependency order. If a stage requires approval,
	 * the chain pauses and returns REVIEW_NEEDED.
	 *
	 * @param chain - The compliance chain to execute
	 * @param change - The fiscal rule change
	 * @param context - Execution context
	 * @returns Chain execution result
	 */
	async runChain(
		chain: ComplianceChain,
		change: FiscalRuleChange,
		context: Partial<ComplianceContext>,
	): Promise<ComplianceChainResult> {
		const startTime = Date.now();
		const stageResults: ComplianceStageResult[] = [];
		const allFindings: ComplianceFinding[] = [];
		let blockedAtStage: string | null = null;
		let approvalPending = false;

		// Resolve and sort stages by dependency order
		const orderedStages = this.resolveDependencyOrder(chain.stages);

		const ctx: ComplianceContext = {
			...(context.evidenceStore !== undefined
				? { evidenceStore: context.evidenceStore }
				: {}),
			previousStageResults: new Map(),
			...(context.lenses !== undefined ? { lenses: context.lenses } : {}),
		};

		for (const stage of orderedStages) {
			// Check dependencies
			if (!this.areDependenciesMet(stage, ctx)) {
				blockedAtStage = stage.stageId;
				break;
			}

			// Execute stage
			try {
				const result = await stage.execute(change, ctx);
				ctx.previousStageResults.set(stage.stageId, result);
				stageResults.push(result);
				allFindings.push(...result.findings);

				if (result.status === "BLOCKED") {
					blockedAtStage = stage.stageId;
					break;
				}

				if (result.status === "REVIEW_NEEDED") {
					approvalPending = true;
					blockedAtStage = stage.stageId;
					break;
				}
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : String(err);
				stageResults.push({
					status: "BLOCKED",
					evidenceId: `${stage.stageId}-err-${Date.now()}`,
					findings: [
						{
							stageId: stage.stageId,
							severity: "CRITICAL",
							code: "COM-001",
							message: `Stage execution error: ${errorMsg}`,
						},
					],
					confidence: 0,
				});
				allFindings.push({
					stageId: stage.stageId,
					severity: "CRITICAL",
					code: "COM-001",
					message: `Stage execution error: ${errorMsg}`,
				});
				blockedAtStage = stage.stageId;
				break;
			}
		}

		const totalDurationMs = Date.now() - startTime;

		const status =
			blockedAtStage !== null
				? approvalPending
					? "REVIEW_NEEDED"
					: "BLOCKED"
				: stageResults.every((r) => r.status === "PASSED")
					? "PASSED"
					: "REVIEW_NEEDED";

		return {
			chainId: chain.chainId,
			status,
			stageResults,
			allFindings,
			blockedAtStage,
			totalDurationMs,
			approvalPending,
		};
	}

	/**
	 * Topological sort of stages based on dependsOn.
	 */
	private resolveDependencyOrder(stages: ComplianceStage[]): ComplianceStage[] {
		const visited = new Set<string>();
		const sorted: ComplianceStage[] = [];
		const stageMap = new Map(stages.map((s) => [s.stageId, s]));

		function visit(stageId: string): void {
			if (visited.has(stageId)) return;
			visited.add(stageId);

			const stage = stageMap.get(stageId);
			if (!stage) return;

			for (const depId of stage.dependsOn) {
				visit(depId);
			}

			sorted.push(stage);
		}

		for (const stage of stages) {
			visit(stage.stageId);
		}

		return sorted;
	}

	/**
	 * Check if all dependencies for a stage have been met.
	 */
	private areDependenciesMet(
		stage: ComplianceStage,
		ctx: ComplianceContext,
	): boolean {
		return stage.dependsOn.every((depId) => {
			const depResult = ctx.previousStageResults.get(depId);
			return depResult && depResult.status === "PASSED";
		});
	}
}
