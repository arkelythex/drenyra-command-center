/**
 * Get Audit Trail Query
 * Retrieves agent decision logs with filters
 */

import {
	AgentDecisionLogRepository,
	type GetTrailFilters,
} from "../../infrastructure/repository";

/**
 * GetTrailResult interface.
 *
 * @example
 * ```ts
 * const value: GetTrailResult = {} as GetTrailResult;
 * console.log(value);
 * ```
 */
export interface GetTrailResult {
	logs: Array<{
		id: string;
		agentName: string;
		decisionType: string;
		reasoning: string | null;
		inputs: Record<string, unknown>;
		outputs: Record<string, unknown>;
		hash: string;
		prevHash: string | null;
		createdAt: Date;
	}>;
	total: number;
}

/**
 * getAuditTrail operation.
 *
 * @param filters - Input for filters.
 * @returns Result of getAuditTrail.
 * @example
 * ```ts
 * const result = await getAuditTrail({} as GetTrailFilters);
 * console.log(result);
 * ```
 */
export async function getAuditTrail(
	filters: GetTrailFilters,
): Promise<GetTrailResult> {
	const repository = new AgentDecisionLogRepository();
	const logs = await repository.getTrail(filters);

	return {
		logs: logs.map((log) => ({
			id: log.id,
			agentName: log.agentContext.name,
			decisionType: log.decisionData.type,
			reasoning: log.decisionData.reasoning,
			inputs: log.decisionData.inputs,
			outputs: log.decisionData.outputs,
			hash: log.hashChain.hash,
			prevHash: log.hashChain.prevHash,
			createdAt: log.createdAt,
		})),
		total: logs.length,
	};
}
