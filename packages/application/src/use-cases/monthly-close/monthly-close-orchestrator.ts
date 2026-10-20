/**
 * MonthlyCloseOrchestrator — Real Monthly Close Execution (M2)
 * Orchestrates the 10-step monthly close pipeline.
 */

import type {
	MonthlyCloseMissionRecord,
	MonthlyCloseMissionStore,
} from "./ports/monthly-close-mission-store";
import type {
	ApplyResult,
	CloseExecutionResult,
	ClosingProposal,
	MissionEventEmitter,
	MonthlyCloseStep,
	PipelineContext,
	StepResult,
} from "./types/pipeline-types";
import { createEmptyPipelineContext } from "./types/pipeline-types";

export class PipelineBlockedError extends Error {
	public readonly stepName: string;
	public readonly reason: string;

	constructor(stepName: string, reason: string) {
		super('Pipeline blocked at step "' + stepName + '": ' + reason);
		this.name = "PipelineBlockedError";
		this.stepName = stepName;
		this.reason = reason;
	}
}

type FiscalAgentPort = ConstructorParameters<
	typeof import("./steps/analyze-ledger.step").AnalyzeLedgerStep
>[0];

function failedAt(
	missionId: string,
	result: StepResult<unknown>,
): CloseExecutionResult {
	return {
		status: "FAILED",
		missionId,
		error: result.errors[0]?.message ?? "Monthly close step failed",
	};
}

export class MonthlyCloseOrchestrator {
	private currentStepNumber = 0;

	/** The injected emitter with every call made non-fatal (see emit). */
	private readonly safeEmitter: MissionEventEmitter = {
		emitStepProgress: (...args) =>
			this.emit((e) => e.emitStepProgress(...args)),
		emitBlockers: (...args) => this.emit((e) => e.emitBlockers(...args)),
		emitProposalCreated: (...args) =>
			this.emit((e) => e.emitProposalCreated(...args)),
		emitStateTransition: (...args) =>
			this.emit((e) => e.emitStateTransition(...args)),
	};

	constructor(
		private readonly store: MonthlyCloseMissionStore,
		private readonly fiscalAgent: unknown,
		private readonly journalEntryPosting: unknown,
		private readonly periodClose: unknown,
		private readonly transactionalApply: unknown,
		private readonly compensatingGenerator: unknown,
		private readonly eventEmitter: MissionEventEmitter,
	) {}

	/**
	 * Run the pipeline for a RUNNING mission and persist where it ends:
	 * AWAITING_APPROVAL with the sealed proposal, BLOCKED, or FAILED.
	 */
	async execute(
		missionId: string,
		companyId: string,
	): Promise<CloseExecutionResult> {
		this.currentStepNumber = 0;
		const mission = await this.store.load(missionId, companyId);
		if (!mission) {
			return { status: "FAILED", missionId, error: "Mission not found" };
		}

		let result: CloseExecutionResult;
		try {
			result = await this.executeInternal(mission, companyId);
		} catch (err) {
			if (!(err instanceof PipelineBlockedError)) throw err;
			result = { status: "FAILED", missionId, error: err.message };
		}

		if (result.status === "FAILED") {
			const reason = result.error ?? "Monthly close step failed";
			await this.store.markFailed(missionId, companyId, reason);
			await this.emit((e) =>
				e.emitStateTransition(missionId, "RUNNING", "FAILED"),
			);
			return { ...result, error: reason };
		}
		if (result.status === "AWAITING_APPROVAL") {
			await this.store.markAwaitingApproval(
				missionId,
				companyId,
				result.proposal as ClosingProposal,
			);
			await this.emit((e) =>
				e.emitStateTransition(missionId, "RUNNING", "AWAITING_APPROVAL"),
			);
		}
		return result;
	}

	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: a linear 10-step pipeline reads best in one place
	private async executeInternal(
		mission: MonthlyCloseMissionRecord,
		companyId: string,
	): Promise<CloseExecutionResult> {
		const missionId = mission.id;
		const context = createEmptyPipelineContext(
			mission.id,
			mission.companyId,
			mission.fiscalPeriod,
		);
		context.eventEmitter = this.safeEmitter;

		// Step 1: Freeze Input Snapshot
		const { FreezeSnapshotStep } = await import("./steps/freeze-snapshot.step");
		const snapshot = await this.runStep(
			new FreezeSnapshotStep(),
			{ companyId, fiscalPeriod: mission.fiscalPeriod },
			context,
		);
		if (!snapshot.success) return failedAt(missionId, snapshot);
		context.inputSnapshot = snapshot.data ?? null;

		// Step 2: Validate Readiness Gates
		const { ValidateGatesStep } = await import("./steps/validate-gates.step");
		const gatesResult = await this.runStep(
			new ValidateGatesStep(),
			{
				companyId,
				fiscalPeriod: mission.fiscalPeriod,
				snapshot: context.inputSnapshot,
			},
			context,
		);

		const blockingGates = (gatesResult.data?.gates ?? []).filter(
			(g: { status: string; type: string }) =>
				g.status === "FAIL" &&
				(g.type === "period_open" || g.type === "prior_period_closed"),
		);

		if (blockingGates.length > 0) {
			context.exceptions.push(...(gatesResult.exceptions ?? []));
			context.gates = gatesResult.data?.gates ?? [];
			await this.blockMission(context, blockingGates);
			return {
				status: "BLOCKED",
				missionId,
				blockers: blockingGates.map((g: { type: string; details: string }) => ({
					gateType: g.type,
					reason: g.details,
					blockedAt: new Date().toISOString(),
				})),
			};
		}

		context.gates = gatesResult.data?.gates ?? [];
		context.exceptions.push(...(gatesResult.exceptions ?? []));

		// Step 3: Analyze Ledger (FiscalAgent) — BLOCKER
		const { AnalyzeLedgerStep } = await import("./steps/analyze-ledger.step");
		const ledger = await this.runStep(
			new AnalyzeLedgerStep(this.fiscalAgent as FiscalAgentPort),
			{
				companyId,
				fiscalPeriod: mission.fiscalPeriod,
				ledgerVersion: context.inputSnapshot?.ledgerVersion,
			},
			context,
		);
		if (!ledger.success) return failedAt(missionId, ledger);
		context.exceptions.push(...(ledger.exceptions ?? []));

		// Step 4: Analyze Invoices — non-blocker
		const { AnalyzeInvoicesStep } = await import(
			"./steps/analyze-invoices.step"
		);
		const invoices = await this.runStep(
			new AnalyzeInvoicesStep(this.fiscalAgent as FiscalAgentPort),
			{
				companyId,
				fiscalPeriod: mission.fiscalPeriod,
				invoiceVersion: context.inputSnapshot?.invoiceDatasetVersion,
			},
			context,
		);
		context.exceptions.push(...(invoices.exceptions ?? []));

		// Step 5: Analyze Reconciliations
		const { AnalyzeReconciliationsStep } = await import(
			"./steps/analyze-reconciliations.step"
		);
		const recons = await this.runStep(
			new AnalyzeReconciliationsStep(),
			{ companyId, fiscalPeriod: mission.fiscalPeriod },
			context,
		);
		context.exceptions.push(...(recons.exceptions ?? []));

		// Step 6: Analyze Compliance
		const { AnalyzeComplianceStep } = await import(
			"./steps/analyze-compliance.step"
		);
		const compliance = await this.runStep(
			new AnalyzeComplianceStep(),
			{ companyId, fiscalPeriod: mission.fiscalPeriod },
			context,
		);
		context.exceptions.push(...(compliance.exceptions ?? []));

		// Step 7: Detect Blockers — BLOCKER
		const { DetectBlockersStep } = await import("./steps/detect-blockers.step");
		const blockerReport = await this.runStep(
			new DetectBlockersStep(),
			{ exceptions: context.exceptions, gateResults: context.gates },
			context,
		);

		if (blockerReport.data?.hasBlockers) {
			await this.blockMission(context, blockerReport.data.blockers);
			return {
				status: "BLOCKED",
				missionId,
				blockers: blockerReport.data.blockers,
			};
		}

		// Step 8: Produce Closing Proposal — BLOCKER
		const { ProduceProposalStep } = await import(
			"./steps/produce-proposal.step"
		);
		const proposal = await this.runStep(
			new ProduceProposalStep(),
			{ context },
			context,
		);
		if (!proposal.success) return failedAt(missionId, proposal);
		context.proposal = proposal.data;

		// Step 9: Build Evidence
		const { BuildEvidenceStep } = await import("./steps/build-evidence.step");
		const evidence = await this.runStep(
			new BuildEvidenceStep(),
			{ context },
			context,
		);
		if (!evidence.success || !evidence.data?.evidence.length) {
			// A proposal nobody can verify must never reach a human approver.
			return { status: "FAILED", missionId, error: "Proposal has no evidence" };
		}

		// Step 10: Request Approval — BLOCKER
		const { RequestApprovalStep } = await import(
			"./steps/request-approval.step"
		);
		const approval = await this.runStep(
			new RequestApprovalStep(),
			{ context },
			context,
		);
		if (!approval.success) return failedAt(missionId, approval);

		return {
			status: "AWAITING_APPROVAL",
			missionId,
			proposal: context.proposal,
		};
	}

	async applyEntries(
		_missionId: string,
		_companyId: string,
	): Promise<ApplyResult> {
		return { success: false, receiptHash: "", postedEntryIds: [] };
	}

	// ─── Private ──────────────────────────────────────────────────────────

	private async runStep<TInput, TOutput>(
		step: MonthlyCloseStep<TInput, TOutput>,
		input: TInput,
		context: PipelineContext,
	): Promise<StepResult<TOutput>> {
		this.currentStepNumber++;
		context.currentStep = step.name;

		const stepNumber = this.currentStepNumber;
		await this.emit((e) =>
			e.emitStepProgress(context.missionId, stepNumber, step.name, "STARTED"),
		);

		let lastError: Error | null = null;
		const maxAttempts =
			step.retryPolicy.type === "none" ? 1 : step.retryPolicy.maxRetries + 1;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				const result = await step.execute(input, context);

				await this.emit((e) =>
					e.emitStepProgress(
						context.missionId,
						stepNumber,
						step.name,
						result.success ? "COMPLETED" : "FAILED",
						result.metrics,
					),
				);

				return result;
			} catch (err) {
				lastError = err instanceof Error ? err : new Error(String(err));

				if (step.retryPolicy.type === "exponential" && attempt < maxAttempts) {
					const delay = step.retryPolicy.baseDelayMs * 2 ** (attempt - 1);
					await new Promise((r) => setTimeout(r, delay));
				}
			}
		}

		const failedMetrics = {
			startedAt: new Date().toISOString(),
			completedAt: new Date().toISOString(),
			itemsProcessed: 0,
			itemsFailed: 1,
		};

		const failed: StepResult<TOutput> = {
			success: false,
			errors: [
				{
					code: "STEP_FAILED",
					message: lastError?.message ?? "Unknown error",
					retryable: false,
				},
			],
			warnings: [],
			exceptions: [],
			metrics: failedMetrics,
		};

		await this.emit((e) =>
			e.emitStepProgress(
				context.missionId,
				stepNumber,
				step.name,
				"FAILED",
				failedMetrics,
			),
		);

		if (step.isBlocker) {
			throw new PipelineBlockedError(
				step.name,
				lastError?.message ?? "Unknown error",
			);
		}

		return failed;
	}

	private async blockMission(
		context: PipelineContext,
		blockers: Array<{
			gateType?: string;
			type?: string;
			reason?: string;
			details?: string;
		}>,
	): Promise<void> {
		const mapped = blockers.map((b) => ({
			gateType: b.gateType ?? b.type ?? "unknown",
			reason: b.reason ?? b.details ?? "No reason provided",
			blockedAt: new Date().toISOString(),
		}));

		await this.store.markBlocked(context.missionId, context.companyId, mapped);
		await this.emit((e) => e.emitBlockers(context.missionId, mapped));
		await this.emit((e) =>
			e.emitStateTransition(context.missionId, "RUNNING", "BLOCKED"),
		);
	}

	/**
	 * Events are observations for live progress; the mission row is the source
	 * of truth. A failing event log must never abort or strand a close.
	 */
	private async emit(
		send: (emitter: MissionEventEmitter) => Promise<void>,
	): Promise<void> {
		try {
			await send(this.eventEmitter);
		} catch (err) {
			console.warn(
				"[MonthlyCloseOrchestrator] event not recorded: " +
					(err instanceof Error ? err.message : String(err)),
			);
		}
	}
}
