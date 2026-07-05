/**
 * Log Agent Decision Command
 * Creates immutable audit log entry with hash chain
 */

import { type CreateLogInput, createAgentDecisionLog } from "../../domain";
import { AgentDecisionLogRepository } from "../../infrastructure/repository";
import { evaluateAuditPlugins } from "../../plugins";

/**
 * LogDecisionInput interface.
 *
 * @example
 * ```ts
 * const value: LogDecisionInput = {} as LogDecisionInput;
 * console.log(value);
 * ```
 */
export interface LogDecisionInput extends Omit<CreateLogInput, "prevHash"> {
	// prevHash is auto-fetched from repository
	pluginIds?: string[];
}

/**
 * logAgentDecision operation.
 *
 * @param input - Input for input.
 * @returns Result of logAgentDecision.
 * @example
 * ```ts
 * const result = await logAgentDecision({} as LogDecisionInput);
 * console.log(result);
 * ```
 */
export async function logAgentDecision(input: LogDecisionInput): Promise<{
	id: string;
	hash: string;
	pluginFindings: ReturnType<typeof evaluateAuditPlugins>["findings"];
}> {
	const repository = new AgentDecisionLogRepository();
	const pluginResult = evaluateAuditPlugins(
		{
			organizationId: input.organizationId,
			agentName: input.agentName,
			decisionType: input.decisionType,
			reasoning: input.reasoning,
			inputs: input.inputs,
			outputs: input.outputs,
			occurredAt: new Date(),
		},
		input.pluginIds,
	);

	const outputsWithPluginAudit: Record<string, unknown> = {
		...input.outputs,
		pluginAudit: {
			evaluatedPluginIds: pluginResult.evaluatedPluginIds,
			skipped: pluginResult.skipped,
			findings: pluginResult.findings,
			executedAt: new Date().toISOString(),
		},
	};

	// Get last hash in chain (for immutability)
	const prevHash = await repository.getLastHash(input.organizationId);

	// Create new log with hash chain
	const log = await createAgentDecisionLog({
		...input,
		outputs: outputsWithPluginAudit,
		prevHash,
	});

	// Save (append-only)
	await repository.save(log);

	return {
		id: log.id,
		hash: log.hashChain.hash,
		pluginFindings: pluginResult.findings,
	};
}
