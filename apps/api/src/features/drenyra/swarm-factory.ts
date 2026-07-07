/**
 * Swarm Factory — wires registered swarm agents into the 8 Latin Moderno domains.
 *
 * Maps ~100+ agents (registered via defineAgent() at module load time) to the
 * 8 Latin domains based on capability matching, creating DomainAgent (L2)
 * instances and registering them in LatinModernoOrchestrator.
 *
 * ## Usage
 *
 * ```ts
 * import { createSwarmOrchestrator } from "./swarm-factory";
 * const swarm = createSwarmOrchestrator();
 * drenyraOrchestrator.enableSwarmMode(swarm);
 * ```
 *
 * Must be called AFTER all agent modules have been imported
 * (i.e., the defineAgent() calls at module level have executed).
 */

import type { Agent, LatinAgentId } from "@drenyra/pi";
import { ApprovalGateEngine,
	ApprovalStore,
	DomainAgent,
	getAllRegisteredAgents,
	LatinModernoOrchestrator, } from "@drenyra/pi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LatinDomainConfig {
	id: LatinAgentId;
	name: string;
	description: string;
	capabilities: string[];
	approvalRequired: boolean;
	maxRetries: number;
	/** Regex patterns tested against each agent's capability strings (case-insensitive). */
	matchPatterns: RegExp[];
}

// ---------------------------------------------------------------------------
// Domain configs with capability-matching patterns
// ---------------------------------------------------------------------------

const LATIN_DOMAIN_CONFIGS: LatinDomainConfig[] = [
	{
		id: "cerno",
		name: "Cerno — Evidence Discovery",
		description:
			"Evidence discovery across fiscal sources, anomaly detection, pattern recognition",
		capabilities: [
			"evidence-discovery",
			"anomaly-detection",
			"pattern-recognition",
			"data-analysis",
		],
		approvalRequired: false,
		maxRetries: 2,
		matchPatterns: [
			/evidence/i,
			/anomaly/i,
			/pattern/i,
			/investigat/i,
			/discover/i,
			/correlation/i,
			/statistical/i,
			/time.series/i,
			/feature.engineer/i,
		],
	},
	{
		id: "custos",
		name: "Custos — Fiscal Risk Monitoring",
		description:
			"Fiscal risk monitoring, threat detection, vulnerability management",
		capabilities: [
			"risk-monitoring",
			"threat-detection",
			"vulnerability-management",
			"incident-response",
		],
		approvalRequired: true,
		maxRetries: 3,
		matchPatterns: [
			/risk/i,
			/secur/i,
			/threat/i,
			/vulnerability/i,
			/incident/i,
			/monitor/i,
			/alert/i,
			/uptime/i,
			/slo/i,
			/capacity/i,
		],
	},
	{
		id: "necto",
		name: "Necto — Audit Trail Assembly",
		description:
			"Audit trail assembly, provenance tracking, compliance logging",
		capabilities: ["audit-trail", "provenance", "tracking", "logging"],
		approvalRequired: false,
		maxRetries: 2,
		matchPatterns: [
			/audit/i,
			/trail/i,
			/provenance/i,
			/logger/i,
			/log/i,
			/retention/i,
			/compliance-audit/i,
			/data-classifier/i,
		],
	},
	{
		id: "regula",
		name: "Regula — Regulatory Compliance",
		description: "LATAM regulatory compliance validation per country-pack",
		capabilities: [
			"regulatory-compliance",
			"validation",
			"schema-validation",
			"sunat-validation",
		],
		approvalRequired: true,
		maxRetries: 2,
		matchPatterns: [
			/regulat/i,
			/compliance/i,
			/valid/i,
			/schema/i,
			/sunat/i,
			/gdpr/i,
			/privacy/i,
			/consent/i,
		],
	},
	{
		id: "lumen",
		name: "Lumen — Insights & Analytics",
		description: "Insights, forecasts, executive summaries, KPI analysis",
		capabilities: [
			"insights",
			"analytics",
			"forecasting",
			"kpi",
			"business-analysis",
		],
		approvalRequired: false,
		maxRetries: 2,
		matchPatterns: [
			/insight/i,
			/analytics/i,
			/forecast/i,
			/kpi/i,
			/pricing/i,
			/market/i,
			/competitor/i,
			/recommendation/i,
			/prediction/i,
		],
	},
	{
		id: "fusio",
		name: "Fusio — External Integrations",
		description:
			"External integrations, API connectivity, data transfer, deployment",
		capabilities: [
			"integration",
			"api-connectivity",
			"data-transfer",
			"deployment",
		],
		approvalRequired: false,
		maxRetries: 3,
		matchPatterns: [
			/integrat/i,
			/api/i,
			/deploy/i,
			/connect/i,
			/gateway/i,
			/broker/i,
			/queue/i,
			/webhook/i,
			/dns/i,
			/ssl/i,
			/infrastructure/i,
			/chaos/i,
		],
	},
	{
		id: "scripta",
		name: "Scripta — Report Generation",
		description: "Report generation, documentation, customer-facing narratives",
		capabilities: [
			"report-generation",
			"documentation",
			"narratives",
			"testing",
		],
		approvalRequired: false,
		maxRetries: 2,
		matchPatterns: [
			/report/i,
			/doc/i,
			/test/i,
			/coverage/i,
			/e2e/i,
			/ui-test/i,
			/visual/i,
			/accessibility/i,
			/usability/i,
			/responsive/i,
			/design.system/i,
		],
	},
	{
		id: "capsa",
		name: "Capsa — Evidence Retention",
		description:
			"Evidence retention, immutable archival, cost optimization, backup",
		capabilities: ["retention", "archival", "cost-optimization", "backup"],
		approvalRequired: false,
		maxRetries: 2,
		matchPatterns: [
			/retention/i,
			/archiv/i,
			/cost/i,
			/backup/i,
			/optimization/i,
			/waste/i,
			/budget/i,
			/allocator/i,
			/reservation/i,
			/spot/i,
		],
	},
];

// ---------------------------------------------------------------------------
// Financial agent → Latin domain mapping (explicit, non-greedy)
// ---------------------------------------------------------------------------

const FINANCIAL_AGENT_MAP: Record<string, LatinAgentId> = {
	"sunat-compliance-agent": "regula",
	"spot-calculator-agent": "regula",
	"invoice-processor-agent": "cerno",
	"banking-reconciliation-agent": "cerno",
	"financial-analyzer-agent": "lumen",
	"tax-optimizer-agent": "lumen",
};

// ---------------------------------------------------------------------------
// Matching logic
// ---------------------------------------------------------------------------

/**
 * Score how well an agent matches a domain based on its capabilities.
 * Returns the count of capabilities that match any of the domain's patterns.
 */
function scoreAgentForDomain(agent: Agent, domain: LatinDomainConfig): number {
	if (!agent.capabilities || agent.capabilities.length === 0) {
		return 0;
	}

	return agent.capabilities.reduce((score, cap) => {
		return score + (domain.matchPatterns.some((p) => p.test(cap)) ? 1 : 0);
	}, 0);
}

/**
 * Find the best-matching agent for a domain that hasn't been assigned yet.
 */
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a fully configured LatinModernoOrchestrator with all 8 Latin domain
 * agents (L2) mapped from the static agent registry.
 *
 * Must be called AFTER all agent modules have been imported
 * (i.e., the `defineAgent()` calls at module level have executed).
 *
 * Domain agents that cannot be matched to any registered agent are silently
 * skipped (the orchestrator will still work for the remaining domains).
 *
 * @param approvalGate — The ApprovalGateEngine instance (from Drenyra bootstrap)
 * @returns A configured LatinModernoOrchestrator ready for `enableSwarmMode()`.
 */
export function createSwarmOrchestrator(
	approvalGate: ApprovalGateEngine,
): LatinModernoOrchestrator {
	const registeredAgents = getAllRegisteredAgents();
	const assigned = new Set<string>();
	const phase1DomainAgents = new Map<LatinAgentId, Agent[]>();
	const orchestrator = new LatinModernoOrchestrator({ mode: "hierarchy" });

	// Phase 1: Explicit assignment of financial agents to Latin domains
	for (const [agentId, domainId] of Object.entries(FINANCIAL_AGENT_MAP)) {
		const agent = registeredAgents.find((a) => a.id === agentId);
		if (agent) {
			assigned.add(agent.id);
			const domainAgents = phase1DomainAgents.get(domainId) ?? [];
			domainAgents.push(agent);
			phase1DomainAgents.set(domainId, domainAgents);
		}
	}

	// Phase 2: Greedy matching for remaining (non-financial) agents
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

	// Orphan check: warn if any financial agent was not found in the registry
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

/**
 * Build a swarm orchestrator from an explicit agent list (test-friendly).
 *
 * @param agents — agent pool to match against domains
 * @param approvalGate — ApprovalGateEngine (defaults to a new instance with empty store if omitted)
 * @returns A configured LatinModernoOrchestrator
 */
export function createSwarmOrchestratorFromAgents(
	agents: Agent[],
	approvalGate?: ApprovalGateEngine,
): LatinModernoOrchestrator {
	const assigned = new Set<string>();
	const phase1DomainAgents = new Map<LatinAgentId, Agent[]>();
	const orchestrator = new LatinModernoOrchestrator({ mode: "hierarchy" });

	// Phase 1: Explicit assignment of financial agents to Latin domains
	for (const [agentId, domainId] of Object.entries(FINANCIAL_AGENT_MAP)) {
		const agent = agents.find((a) => a.id === agentId);
		if (agent) {
			assigned.add(agent.id);
			const domainAgents = phase1DomainAgents.get(domainId) ?? [];
			domainAgents.push(agent);
			phase1DomainAgents.set(domainId, domainAgents);
		}
	}

	// Phase 2: Greedy matching for remaining agents
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

	// Orphan check: warn if any financial agent was not found in the pool
	for (const [agentId] of Object.entries(FINANCIAL_AGENT_MAP)) {
		if (!assigned.has(agentId)) {
			console.warn(
				`[SwarmFactory] Financial agent "${agentId}" not in agent pool — it will not be available for its target domain`,
			);
		}
	}

	return orchestrator;
}

/**
 * Get the Latin domain → best-agent mapping for observability/debugging.
 * Uses the static registry (call AFTER agent modules are loaded).
 */
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a permissive ApprovalGateEngine that auto-approves all actions.
 * Used as default when no explicit engine is provided (e.g., in tests).
 */
function createPermissiveApprovalGate(): ApprovalGateEngine {
	return new ApprovalGateEngine(new ApprovalStore(), async () => ({
		valid: true,
		reasons: [],
		evidenceRefs: [],
	}));
}
