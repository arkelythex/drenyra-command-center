import type { RunAgentInput } from "../schemas";
import type {
	AgentLogRecord,
	AgentOutputRecord,
	AgentRunRecord,
	FiscalCommandCenterContext,
} from "../types";

function sameRunScope(
	row: Pick<
		AgentRunRecord,
		"organizationId" | "companyId" | "companyRuc" | "period"
	>,
	ctx: FiscalCommandCenterContext,
): boolean {
	return (
		row.organizationId === ctx.organizationId &&
		row.companyId === ctx.companyId &&
		row.companyRuc === ctx.companyRuc &&
		row.period === ctx.period
	);
}

function byCreatedDesc(a: { createdAt: Date }, b: { createdAt: Date }): number {
	return b.createdAt.getTime() - a.createdAt.getTime();
}

/**
 * createAgentRunService operation.
 *
 * @param seed - Input for seed.
 * @returns Result of createAgentRunService.
 * @example
 * ```ts
 * const result = createAgentRunService({});
 * console.log(result);
 * ```
 */
export function createAgentRunService(
	seed: {
		runs?: AgentRunRecord[];
		logs?: AgentLogRecord[];
		outputs?: AgentOutputRecord[];
	} = {},
) {
	const runs = [...(seed.runs ?? [])];
	const logs = [...(seed.logs ?? [])];
	const outputs = [...(seed.outputs ?? [])];

	async function getById(id: string, ctx: FiscalCommandCenterContext) {
		return runs.find((run) => run.id === id && sameRunScope(run, ctx)) ?? null;
	}

	return {
		async list(ctx: FiscalCommandCenterContext) {
			return runs.filter((run) => sameRunScope(run, ctx)).sort(byCreatedDesc);
		},

		getById,

		async create(input: RunAgentInput, ctx: FiscalCommandCenterContext) {
			const now = new Date();
			const created: AgentRunRecord = {
				id: crypto.randomUUID(),
				caseId: input.caseId ?? null,
				organizationId: ctx.organizationId,
				companyId: ctx.companyId,
				companyRuc: ctx.companyRuc,
				period: ctx.period,
				agentType: input.agentType,
				status: "pending",
				metadata: input.metadata ?? {},
				createdAt: now,
				updatedAt: now,
			};
			runs.push(created);
			return created;
		},

		async getLogs(runId: string, ctx: FiscalCommandCenterContext) {
			const run = await getById(runId, ctx);
			if (!run) return null;
			return logs
				.filter((log) => log.runId === runId && log.companyId === ctx.companyId)
				.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
		},

		async getOutputs(runId: string, ctx: FiscalCommandCenterContext) {
			const run = await getById(runId, ctx);
			if (!run) return null;
			return outputs
				.filter(
					(output) =>
						output.runId === runId && output.companyId === ctx.companyId,
				)
				.sort(byCreatedDesc);
		},
	};
}

/**
 * agentRunService const.
 *
 * @example
 * ```ts
 * console.log(agentRunService);
 * ```
 */
export const agentRunService = createAgentRunService();
