import {
	canSpawn,
	DELEGATION_AGENTS,
	type DelegationAgentNode,
} from "../harness.js";
import { enrichSummary, extractCliMemory } from "../memory-context.js";
import type { AgentHandler, HarnessAgentResult, HarnessSpawnRequest } from "../types.js";

function orchestratorSpawn(
	agent: DelegationAgentNode,
	request: HarnessSpawnRequest,
	depth: number,
): HarnessAgentResult {
	const children = agent.maySpawn.map((childId) => ({
		agentId: childId,
		task: request.task,
	}));
	const mem = extractCliMemory(request.context.metadata);
	return {
		status: "partial",
		executiveSummary: enrichSummary(
			`${agent.label}: delegated to ${children.length} nested agent(s)`,
			mem,
		),
		artifacts: [],
		nextRecommended: children[0]?.agentId ?? "human_approval",
		risks: [],
		delegationDepth: depth,
		spawn: children,
	};
}

function leafResult(
	agent: DelegationAgentNode,
	request: HarnessSpawnRequest,
	depth: number,
): HarnessAgentResult {
	const requiresApproval = agent.requiresApproval ?? false;
	const mem = extractCliMemory(request.context.metadata);
	return {
		status: requiresApproval ? "pending_approval" : "done",
		executiveSummary: enrichSummary(
			`${agent.label}: processed task for RUC ${request.context.companyRuc} period ${request.context.period}`,
			mem,
		),
		artifacts: [`trace:${request.context.traceId}`, `agent:${agent.id}`],
		nextRecommended: requiresApproval ? "human_approval" : "done",
		risks: requiresApproval ? ["Material fiscal action requires human approval"] : [],
		delegationDepth: depth,
		requiresApproval,
	};
}

export function createDefaultHandler(agentId: string): AgentHandler {
	return async (request) => {
		const agent = DELEGATION_AGENTS[agentId];
		if (!agent) {
			return {
				status: "blocked",
				executiveSummary: `Unknown agent: ${agentId}`,
				artifacts: [],
				nextRecommended: "drenyra-sdd-orchestrator",
				risks: ["Agent not registered in delegation graph"],
				delegationDepth: request.depth ?? 0,
			};
		}
		const depth = request.depth ?? 0;
		if (agent.leaf || agent.maySpawn.length === 0) {
			return leafResult(agent, request, depth);
		}
		return orchestratorSpawn(agent, request, depth);
	};
}

export function registerDefaultHandlers(
	registry: Map<string, AgentHandler>,
	agentIds: string[] = Object.keys(DELEGATION_AGENTS),
): void {
	for (const id of agentIds) {
		if (!registry.has(id)) {
			registry.set(id, createDefaultHandler(id));
		}
	}
}

export function validateSpawnPlan(
	parentId: string,
	spawn: { agentId: string }[],
): string[] {
	const errors: string[] = [];
	for (const child of spawn) {
		if (!canSpawn(parentId, child.agentId)) {
			errors.push(`${parentId} cannot spawn ${child.agentId}`);
		}
	}
	return errors;
}
