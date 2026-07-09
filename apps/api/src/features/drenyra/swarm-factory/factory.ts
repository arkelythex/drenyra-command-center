import type { Agent, LatinAgentId } from "@drenyra/pi";
import {
	ApprovalGateEngine,
	ApprovalStore,
	DomainAgent,
	getAllRegisteredAgents,
	LatinModernoOrchestrator,
} from "@drenyra/pi";
import type { LatinDomainConfig } from "./types";
import { FINANCIAL_AGENT_MAP, LATIN_DOMAIN_CONFIGS } from "./types";

function scoreAgentForDomain(agent: Agent, domain: LatinDomainConfig): number {
	if (!agent.capabilities || agent.capabilities.length === 0) {
		return 0;
	}

	return agent.capabilities.reduce((score, cap) => {
		return score + (domain.matchPatterns.some((p) => p.test(cap)) ? 1 : 0);
	}, 0);
}

function findBestAgentForDomain(
	agents: Agent[],
	domain: LatinDomainConfig,
	assigned: Set<string>,
): Agent | undefined {
	let best: Agent | undefined;
	let bestScore = 0;

	for (const agent of agents) {
		if (assigned.has(agent.id)) {
			continue;
		}
		const score = scoreAgentForDomain(agent, domain);
		if (score > bestScore) {
			bestScore = score;
			best = agent;
		}
	}

	return best;
}

export function createSwarmOrchestrator(
	_approvalGate: ApprovalGateEngine,
): LatinModernoOrchestrator {
	const registeredAgents = getAllRegisteredAgents();
	const assigned = new Set<string>();
	const phase1DomainAgents = new Map<LatinAgentId, Agent[]>();
	const orchestrator = new LatinModernoOrchestrator({ mode: "hierarchy" });

	for (const [agentId, domainId] of Object.entries(FINANCIAL_AGENT_MAP)) {
		const agent = registeredAgents.find((a) => a.id === agentId);
		if (agent) {
			assigned.add(agent.id);
			const domainAgents = phase1DomainAgents.get(domainId) ?? [];
			domainAgents.push(agent);
			phase1DomainAgents.set(domainId, domainAgents);
		}
	}

	for (const domain of LATIN_DOMAIN_CONFIGS) {
		const phase1Agents = phase1DomainAgents.get(domain.id) ?? [];

		const bestAgent = findBestAgentForDomain(
			registeredAgents,
			domain,
			assigned,
		);

		if (!bestAgent && phase1Agents.length === 0) {
			console.warn(
				`[SwarmFactory] No matching agent found for domain "${domain.id}", skipping`,
			);
			continue;
		}

		if (bestAgent) {
			assigned.add(bestAgent.id);
		}

		const agentsForDomain = bestAgent
			? [...phase1Agents, bestAgent]
			: phase1Agents;

		const domainAgent = new DomainAgent(agentsForDomain, {
			id: domain.id,
			name: domain.name,
			description: domain.description,
			capabilities: domain.capabilities,
			approvalRequired: domain.approvalRequired,
			maxRetries: domain.maxRetries,
		});

		orchestrator.registerDomainAgent(
			domainAgent as DomainAgent & { id: LatinAgentId },
		);
	}

	for (const [agentId] of Object.entries(FINANCIAL_AGENT_MAP)) {
		if (!assigned.has(agentId)) {
			console.warn(
				`[SwarmFactory] Financial agent "${agentId}" not registered — it will not be available for its target domain`,
			);
		}
	}

	console.info(
		`[SwarmFactory] Swarm orchestrator created: ${assigned.size} agents assigned ` +
			`(agents: ${Array.from(assigned).sort().join(", ")})`,
	);

	return orchestrator;
}

export function createSwarmOrchestratorFromAgents(
	agents: Agent[],
	approvalGate?: ApprovalGateEngine,
): LatinModernoOrchestrator {
	const assigned = new Set<string>();
	const phase1DomainAgents = new Map<LatinAgentId, Agent[]>();
	const orchestrator = new LatinModernoOrchestrator({ mode: "hierarchy" });
	const _resolvedGate = approvalGate ?? createPermissiveApprovalGate();

	for (const [agentId, domainId] of Object.entries(FINANCIAL_AGENT_MAP)) {
		const agent = agents.find((a) => a.id === agentId);
		if (agent) {
			assigned.add(agent.id);
			const domainAgents = phase1DomainAgents.get(domainId) ?? [];
			domainAgents.push(agent);
			phase1DomainAgents.set(domainId, domainAgents);
		}
	}

	for (const domain of LATIN_DOMAIN_CONFIGS) {
		const phase1Agents = phase1DomainAgents.get(domain.id) ?? [];

		const bestAgent = findBestAgentForDomain(agents, domain, assigned);

		if (!bestAgent && phase1Agents.length === 0) {
			continue;
		}

		if (bestAgent) {
			assigned.add(bestAgent.id);
		}

		const agentsForDomain = bestAgent
			? [...phase1Agents, bestAgent]
			: phase1Agents;

		const domainAgent = new DomainAgent(agentsForDomain, {
			id: domain.id,
			name: domain.name,
			description: domain.description,
			capabilities: domain.capabilities,
			approvalRequired: domain.approvalRequired,
			maxRetries: domain.maxRetries,
		});

		orchestrator.registerDomainAgent(
			domainAgent as DomainAgent & { id: LatinAgentId },
		);
	}

	for (const [agentId] of Object.entries(FINANCIAL_AGENT_MAP)) {
		if (!assigned.has(agentId)) {
			console.warn(
				`[SwarmFactory] Financial agent "${agentId}" not in agent pool — it will not be available for its target domain`,
			);
		}
	}

	return orchestrator;
}

export function getLatinAgentMapping(): Array<{
	domain: LatinAgentId;
	name: string;
	agentId: string;
	agentName: string;
	score: number;
}> {
	const agents = getAllRegisteredAgents();
	const mapping: Array<{
		domain: LatinAgentId;
		name: string;
		agentId: string;
		agentName: string;
		score: number;
	}> = [];

	for (const domain of LATIN_DOMAIN_CONFIGS) {
		const bestAgent = findBestAgentForDomain(agents, domain, new Set());
		if (bestAgent) {
			mapping.push({
				domain: domain.id,
				name: domain.name,
				agentId: bestAgent.id,
				agentName: bestAgent.name,
				score: scoreAgentForDomain(bestAgent, domain),
			});
		}
	}

	return mapping;
}

function createPermissiveApprovalGate(): ApprovalGateEngine {
	return new ApprovalGateEngine(new ApprovalStore(), async () => ({
		valid: true,
		reasons: [],
		evidenceRefs: [],
	}));
}
