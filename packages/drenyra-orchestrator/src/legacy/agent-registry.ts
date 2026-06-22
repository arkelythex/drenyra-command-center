/**
 * Agent Registry — ported from @arkelythex/agent-swarm/src/agent-registry.ts
 *
 * Static registry populated by agent modules calling defineAgent().
 * Provides getAllRegisteredAgents() for legacy consumers.
 */
import type { Agent } from "../types/index";

const _registeredAgents = new Map<string, Agent>();

export function defineAgent(agent: Agent): void {
	_registeredAgents.set(agent.id, agent);
}

export function getAllRegisteredAgents(): Agent[] {
	return Array.from(_registeredAgents.values());
}

export function getRegisteredAgent(id: string): Agent | undefined {
	return _registeredAgents.get(id);
}

export function clearRegisteredAgents(): void {
	_registeredAgents.clear();
}
