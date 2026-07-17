import type {
	WorkflowEngine as IWorkflowEngine,
	WorkflowOutcome,
	WorkflowPipeline,
	WorkflowRunStatus,
	WorkflowStepResult,
} from "./workflow.types";

interface ManagedRun {
	outcome: WorkflowOutcome;
	controller: AbortController;
}

export class WorkflowEngine implements IWorkflowEngine {
	private pipelines = new Map<string, WorkflowPipeline>();
	private runs = new Map<string, ManagedRun>();
	private approvalManager?: {
		requiresApproval(action: { type: string }): boolean;
		requestApproval(
			action: { type: string },
			level: string,
			reason: string,
		): { id: string };
		waitForDecision(id: string): Promise<{ status: string }>;
	};

	registerPipeline(pipeline: WorkflowPipeline): void {
		this.pipelines.set(pipeline.id, pipeline);
	}
	getPipeline(id: string): WorkflowPipeline | undefined {
		return this.pipelines.get(id);
	}
	listPipelines(): WorkflowPipeline[] {
		return Array.from(this.pipelines.values());
	}

	setApprovalManager(manager: typeof this.approvalManager): void {
		this.approvalManager = manager;
	}

	async run(
		pipelineId: string,
		initialState: Record<string, unknown> = {},
	): Promise<WorkflowOutcome> {
		const pipeline = this.pipelines.get(pipelineId);
		if (!pipeline) throw new Error(`Pipeline not found: ${pipelineId}`);

		if (this.approvalManager?.requiresApproval({ type: "fiscal.submit" })) {
			const req = this.approvalManager.requestApproval(
				{
					type: "fiscal.submit",
					documentType: pipelineId,
					ruc: (initialState.ruc as string) ?? "",
				},
				"critical",
				`Pipeline execution requires approval: ${pipelineId}`,
			);
			const decision = await this.approvalManager.waitForDecision(req.id);
			if (decision.status !== "approved")
				throw new Error(`Pipeline execution rejected: ${pipelineId}`);
		}

		const runId = crypto.randomUUID();
		const controller = new AbortController();
		const startTime = Date.now();
		const stepResults: WorkflowStepResult[] = [];
		let status: WorkflowRunStatus = "running";

		const managedRun: ManagedRun = {
			outcome: { runId, pipelineId, status, stepResults, totalDurationMs: 0 },
			controller,
		};
		this.runs.set(runId, managedRun);

		try {
			for (const step of pipeline.steps) {
				if (controller.signal.aborted) {
					status = "cancelled";
					break;
				}
				const stepStart = Date.now();
				const result = await step.execute(initialState);
				result.durationMs = Date.now() - stepStart;
				stepResults.push(result);
				if (result.status === "failed") {
					status = "failed";
					break;
				}
			}
			if (status === "running") status = "completed";
		} catch (err) {
			stepResults.push({
				status: "failed",
				error: err instanceof Error ? err.message : String(err),
				durationMs: 0,
			});
			status = "failed";
		}

		managedRun.outcome = {
			runId,
			pipelineId,
			status,
			stepResults,
			totalDurationMs: Date.now() - startTime,
			completedAt: new Date().toISOString(),
		};
		return managedRun.outcome;
	}

	async cancel(runId: string): Promise<void> {
		const run = this.runs.get(runId);
		if (run) {
			run.controller.abort();
			run.outcome.status = "cancelled";
		}
	}
	getRun(runId: string): WorkflowOutcome | undefined {
		return this.runs.get(runId)?.outcome;
	}
	listRuns(): WorkflowOutcome[] {
		return Array.from(this.runs.values()).map((r) => r.outcome);
	}
}
