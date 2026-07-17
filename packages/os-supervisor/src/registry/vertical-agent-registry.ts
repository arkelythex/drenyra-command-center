import type { OSAgentPort, OSIntent } from "../types/agent.types.js";
import type { VerticalType } from "../types/vertical.types.js";

export class VerticalAgentRegistry {
	private agents: Map<string, OSAgentPort> = new Map();
	private verticalIndex: Map<VerticalType, Set<string>> = new Map();

	register(agent: OSAgentPort): void {
		if (this.agents.has(agent.id)) {
			throw new Error(`Agent '${agent.id}' already registered`);
		}
		this.agents.set(agent.id, agent);
		const byVertical = this.verticalIndex.get(agent.vertical);
		if (byVertical) {
			byVertical.add(agent.id);
		} else {
			this.verticalIndex.set(agent.vertical, new Set([agent.id]));
		}
	}

	/**
	 * Resolve the best agent for the given intent.
	 *
	 * When the intent carries a non-empty action, and there are multiple
	 * agents in the same vertical, this method prefers an agent whose
	 * capabilities include the intent action.  Falls back to the first
	 * registered agent in the vertical (legacy behaviour).
	 */
	resolve(intent: OSIntent): OSAgentPort | undefined {
		const agentIds = this.verticalIndex.get(intent.vertical);
		if (!agentIds || agentIds.size === 0) return undefined;

		// Fast path — single agent in vertical
		if (agentIds.size === 1) {
			const onlyId = [...agentIds][0];
			return onlyId ? this.agents.get(onlyId) : undefined;
		}

		// Multiple agents — try to match by action → capabilities
		if (intent.action && intent.action.length > 0) {
			const action = intent.action.toLowerCase();
			for (const id of agentIds) {
				const agent = this.agents.get(id);
				if (agent?.capabilities.some((c) => c.toLowerCase() === action)) {
					return agent;
				}
			}
		}

		// Fallback to first registered agent in the vertical
		const firstId = [...agentIds][0];
		if (!firstId) return undefined;
		return this.agents.get(firstId);
	}

	getByVertical(vertical: VerticalType): OSAgentPort[] {
		const agentIds = this.verticalIndex.get(vertical);
		if (!agentIds) return [];
		return [...agentIds]
			.map((id) => this.agents.get(id))
			.filter((a): a is OSAgentPort => a !== undefined);
	}

	getRegisteredVerticals(): VerticalType[] {
		return [...this.verticalIndex.keys()];
	}

	list(): OSAgentPort[] {
		return [...this.agents.values()];
	}
}
