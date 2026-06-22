/**
 * Agent Decision Log Factory
 * Creates new audit log entries with hash computation
 */

import { ulid } from "ulid";
import { AgentDecisionLog } from "./entity";
import { AgentContext } from "./value-objects/agent-context.vo";
import { DecisionData } from "./value-objects/decision-data.vo";
import { HashChain } from "./value-objects/hash-chain.vo";
import { computeHash } from "./hash.service";

/**
 * CreateLogInput interface.
 *
 * @example
 * ```ts
 * const value: CreateLogInput = {} as CreateLogInput;
 * console.log(value);
 * ```
 */
export interface CreateLogInput {
	organizationId: number;
	agentName: string;
	agentVersion?: string;
	decisionType: string;
	reasoning?: string;
	inputs: Record<string, unknown>;
	outputs: Record<string, unknown>;
	prevHash?: string | null;
}

/**
 * createAgentDecisionLog operation.
 *
 * @param input - Input for input.
 * @returns Result of createAgentDecisionLog.
 * @example
 * ```ts
 * const result = await createAgentDecisionLog({} as CreateLogInput);
 * console.log(result);
 * ```
 */
export async function createAgentDecisionLog(
	input: CreateLogInput,
): Promise<AgentDecisionLog> {
	const id = ulid();
	const createdAt = new Date();

	const agentContext = AgentContext.create({
		name: input.agentName,
		version: input.agentVersion,
	});

	const decisionData = DecisionData.create({
		type: input.decisionType,
		inputs: input.inputs,
		outputs: input.outputs,
		reasoning: input.reasoning,
	});

	const hash = await computeHash({
		id,
		createdAt,
		inputs: input.inputs,
		outputs: input.outputs,
		prevHash: input.prevHash ?? null,
	});

	const hashChain = HashChain.create({
		hash,
		prevHash: input.prevHash ?? null,
	});

	return AgentDecisionLog.reconstitute({
		id,
		organizationId: input.organizationId,
		agentContext,
		decisionData,
		hashChain,
		createdAt,
	});
}
