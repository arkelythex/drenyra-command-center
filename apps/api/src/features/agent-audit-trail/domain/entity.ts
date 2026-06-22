/**
 * Agent Decision Log Entity
 * Uses composition of Value Objects (2026 best practice)
 */

import type { AgentContext } from "./value-objects/agent-context.vo";
import type { DecisionData } from "./value-objects/decision-data.vo";
import type { HashChain } from "./value-objects/hash-chain.vo";

/**
 * AgentDecisionLogProps interface.
 *
 * @example
 * ```ts
 * const value: AgentDecisionLogProps = {} as AgentDecisionLogProps;
 * console.log(value);
 * ```
 */
export interface AgentDecisionLogProps {
	id: string;
	organizationId: number;
	agentContext: AgentContext;
	decisionData: DecisionData;
	hashChain: HashChain;
	createdAt: Date;
}

/**
 * AgentDecisionLog class.
 *
 * @example
 * ```ts
 * const value = new AgentDecisionLog();
 * console.log(value);
 * ```
 */
export class AgentDecisionLog {
	readonly id: string;
	readonly organizationId: number;
	readonly agentContext: AgentContext;
	readonly decisionData: DecisionData;
	readonly hashChain: HashChain;
	readonly createdAt: Date;

	private constructor(props: AgentDecisionLogProps) {
		this.id = props.id;
		this.organizationId = props.organizationId;
		this.agentContext = props.agentContext;
		this.decisionData = props.decisionData;
		this.hashChain = props.hashChain;
		this.createdAt = props.createdAt;

		this.validate();
	}

	static reconstitute(props: AgentDecisionLogProps): AgentDecisionLog {
		return new AgentDecisionLog(props);
	}

	private validate(): void {
		if (!this.id || this.id.length === 0) {
			throw new Error("ID is required");
		}

		if (this.organizationId <= 0) {
			throw new Error("Organization ID must be positive");
		}
	}

	toDatabase() {
		return {
			id: this.id,
			organizationId: this.organizationId,
			agentName: this.agentContext.name,
			agentVersion: this.agentContext.version,
			decisionType: this.decisionData.type,
			reasoning: this.decisionData.reasoning,
			inputs: this.decisionData.inputs,
			outputs: this.decisionData.outputs,
			hash: this.hashChain.hash,
			prevHash: this.hashChain.prevHash,
			createdAt: this.createdAt,
		};
	}
}
