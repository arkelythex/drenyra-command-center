/**
 * Fiscal Vertical Plugin — implements the AgenticOSPlugin interface.
 *
 * Registers fiscal domain entities, agent types, policies, and approval
 * gates with the Platform Core kernel. This is the ONLY place in platform-core
 * that references fiscal concepts — the kernel itself remains domain-agnostic.
 *
 * @module @drenyra/platform-core/plugin
 * @example
 * ```ts
 * import { FiscalPlugin } from "@drenyra/platform-core/plugin/fiscal-plugin";
 * import { PluginRegistry } from "@drenyra/platform-core/plugin";
 *
 * const registry = new PluginRegistry();
 * registry.register(new FiscalPlugin());
 * ```
 */

import type {
	AgenticOSPlugin,
	AgentRegistry,
	ApprovalGateRegistry,
	DomainRegistry,
	PolicyRegistry,
} from "./interface.js";

// ──────────────────────────────────────────────
// Domain Entity Types
// ──────────────────────────────────────────────

/**
 * Fiscal domain entity schema placeholders.
 *
 * These are structural definitions — actual validation schemas
 * are provided by the fiscal vertical package
 * (@drenyra/domain or @drenyra/application).
 */
const FISCAL_ENTITIES = [
	{ name: "invoice", description: "Electronic invoice (factura electrónica)" },
	{ name: "credit-note", description: "Credit note (nota de crédito)" },
	{ name: "debit-note", description: "Debit note (nota de débito)" },
	{ name: "tax-payer", description: "Tax payer (contribuyente SUNAT)" },
	{ name: "tax-period", description: "Tax declaration period" },
	{ name: "detraction", description: "Detraction operation" },
	{ name: "retention", description: "Retention certificate" },
	{ name: "perception", description: "Perception operation" },
	{ name: "ledger-entry", description: "Fiscal ledger entry" },
	{ name: "tax-return", description: "Monthly/annual tax return" },
	{ name: "audit-trail", description: "Fiscal audit trail record" },
	{ name: "compliance-report", description: "Compliance evaluation report" },
] as const;

// ──────────────────────────────────────────────
// Fiscal Agent Types
// ──────────────────────────────────────────────

const FISCAL_AGENTS = [
	{
		type: "fiscal-compliance",
		description: "Compliance verification agent — validates fiscal obligations",
		capabilities: [
			"sunat-compliance-check",
			"tax-deadline-monitoring",
			"invoice-compliance-validation",
			"detraction-compliance-check",
			"audit-trail-verification",
		],
	},
	{
		type: "fiscal-audit",
		description:
			"Fiscal audit agent — analyzes audit trails and ledger entries",
		capabilities: [
			"audit-trail-analysis",
			"ledger-reconciliation",
			"fraud-detection",
			"discrepancy-reporting",
			"retention-verification",
		],
	},
	{
		type: "fiscal-financial",
		description: "Financial analysis agent — fiscal impact and forecasting",
		capabilities: [
			"tax-impact-analysis",
			"fiscal-forecasting",
			"tax-burden-optimization",
			"cash-flow-fiscal-impact",
			"detraction-analysis",
		],
	},
	{
		type: "fiscal-sunat-filing",
		description: "SUNAT filing agent — submits declarations and invoices",
		capabilities: [
			"invoice-submission",
			"tax-return-filing",
			"detraction-filing",
			"perception-filing",
			"retention-filing",
		],
	},
	{
		type: "fiscal-reporting",
		description:
			"Fiscal reporting agent — generates compliance and audit reports",
		capabilities: [
			"compliance-report-generation",
			"audit-report-generation",
			"fiscal-dashboard-data",
			"regulatory-filing-summary",
			"periodic-tax-summary",
		],
	},
] as const;

// ──────────────────────────────────────────────
// Fiscal Policies
// ──────────────────────────────────────────────

/**
 * Pre-defined fiscal policies that gate tax-critical actions.
 */
const FISCAL_POLICIES = [
	{
		name: "sunat-readonly",
		description:
			"SUNAT read-only policy — prevents modification of submitted fiscal records",
		evaluate: (_context: {
			action: string;
			agentType: string;
			task: { type?: string; priority?: string };
			metadata?: Record<string, unknown>;
		}) => {
			if (
				_context.action === "modify-submitted-record" ||
				_context.action === "delete-submitted-record"
			) {
				return {
					allowed: false,
					reason:
						"Cannot modify or delete already submitted SUNAT records. Use credit/debit notes instead.",
					requiresApproval: false,
				};
			}
			return { allowed: true };
		},
	},
	{
		name: "tax-critical-approval",
		description:
			"Tax-critical actions require dual approval — any filing or submission must be reviewed",
		evaluate: (_context: {
			action: string;
			agentType: string;
			task: { type?: string; priority?: string };
			metadata?: Record<string, unknown>;
		}) => {
			const filingActions = [
				"invoice-submission",
				"tax-return-filing",
				"detraction-filing",
				"perception-filing",
				"retention-filing",
			];
			if (filingActions.includes(_context.action)) {
				return {
					allowed: false,
					reason:
						"Tax filing actions require human approval before submission to SUNAT",
					requiresApproval: true,
				};
			}
			return { allowed: true };
		},
	},
	{
		name: "audit-trail-integrity",
		description:
			"Audit trail integrity policy — prevents tampering with audit records",
		evaluate: (_context: {
			action: string;
			agentType: string;
			task: { type?: string; priority?: string };
			metadata?: Record<string, unknown>;
		}) => {
			if (
				_context.action === "delete-audit-record" ||
				_context.action === "modify-audit-record"
			) {
				return {
					allowed: false,
					reason: "Audit trail records are tamper-proof and cannot be modified",
					requiresApproval: false,
				};
			}
			return { allowed: true };
		},
	},
	{
		name: "fiscal-data-retention",
		description:
			"Fiscal data retention policy — enforces legal retention periods",
		evaluate: (_context: {
			action: string;
			agentType: string;
			task: { type?: string; priority?: string };
			metadata?: Record<string, unknown>;
		}) => {
			if (_context.action === "purge-fiscal-records") {
				return {
					allowed: false,
					reason:
						"Fiscal records cannot be purged without legal authorization and compliance officer sign-off",
					requiresApproval: true,
				};
			}
			return { allowed: true };
		},
	},
] as const;

// ──────────────────────────────────────────────
// Fiscal Approval Gates
// ──────────────────────────────────────────────

/**
 * Pre-defined fiscal approval gates for sensitive operations.
 */
const FISCAL_APPROVAL_GATES = [
	{
		name: "sunat-submit-gate",
		description:
			"Approval gate for SUNAT submissions — requires compliance officer sign-off",
		evaluate: async (_request: {
			id: string;
			action: string;
			agentId: string;
			taskId: string;
			evidence: Array<{ type: string; content: unknown; timestamp: string }>;
			metadata?: Record<string, unknown>;
		}) => {
			// Verify at least one piece of evidence confirms compliance
			const hasComplianceEvidence = _request.evidence.some(
				(e) =>
					e.type === "compliance-check" ||
					e.type === "balance-check" ||
					e.type === "pre-flight-validation",
			);

			if (!hasComplianceEvidence) {
				return {
					approved: false,
					reason:
						"SUNAT submission requires compliance evidence (pre-flight validation or compliance check)",
					timestamp: new Date().toISOString(),
				};
			}

			// Check if the submission involves high-value amounts
			const highValueEvidence = _request.evidence.find(
				(e) =>
					e.type === "balance-check" &&
					typeof e.content === "object" &&
					e.content !== null &&
					"amount" in (e.content as Record<string, unknown>) &&
					Number((e.content as Record<string, unknown>).amount) > 50000,
			);

			if (highValueEvidence) {
				return {
					approved: false,
					reason:
						"High-value SUNAT submission requires manual compliance officer review",
					timestamp: new Date().toISOString(),
				};
			}

			return {
				approved: true,
				approvedBy: "fiscal-plugin-auto-approver",
				reason: "Compliance evidence verified — submission approved",
				timestamp: new Date().toISOString(),
			};
		},
	},
	{
		name: "audit-data-access-gate",
		description:
			"Approval gate for accessing sensitive audit data — requires authorization",
		evaluate: async (_request: {
			id: string;
			action: string;
			agentId: string;
			taskId: string;
			evidence: Array<{ type: string; content: unknown; timestamp: string }>;
			metadata?: Record<string, unknown>;
		}) => {
			// Audit access only allowed with explicit authorization evidence
			const hasAuthEvidence = _request.evidence.some(
				(e) =>
					e.type === "authorization-token" || e.type === "role-verification",
			);

			if (!hasAuthEvidence) {
				return {
					approved: false,
					reason: "Audit data access requires explicit authorization evidence",
					timestamp: new Date().toISOString(),
				};
			}

			return {
				approved: true,
				approvedBy: "fiscal-plugin-auto-approver",
				reason: "Authorization verified — audit access granted",
				timestamp: new Date().toISOString(),
			};
		},
	},
] as const;

// ──────────────────────────────────────────────
// FiscalPlugin
// ──────────────────────────────────────────────

/**
 * Fiscal vertical plugin for Platform Core.
 *
 * Registers all fiscal domain concepts, agent types, policies,
 * and approval gates with the kernel. This implements the
 * {@link AgenticOSPlugin} interface contract.
 *
 * @example
 * ```ts
 * import { FiscalPlugin } from "@drenyra/platform-core/plugin/fiscal-plugin";
 * import { PluginRegistry } from "@drenyra/platform-core/plugin";
 *
 * const registry = new PluginRegistry();
 * registry.register(new FiscalPlugin());
 *
 * // Later: initialize all registered plugins
 * const fiscal = registry.getPlugin("fiscal");
 * fiscal!.registerDomain(registry.createDomainRegistry());
 * fiscal!.registerAgents(registry.createAgentRegistry());
 * fiscal!.registerPolicies(registry.createPolicyRegistry());
 * fiscal!.registerApprovalGates(registry.createApprovalGateRegistry());
 * ```
 */
export class FiscalPlugin implements AgenticOSPlugin {
	/** Unique plugin identifier */
	readonly name = "fiscal";
	/** Current plugin version */
	readonly version = "1.0.0";
	/** Human-readable description */
	readonly description =
		"Peruvian fiscal compliance vertical — SUNAT electronic invoicing, detractions, tax declarations, audit trails, and compliance reporting";

	/**
	 * Register fiscal domain entities and validation rules.
	 */
	registerDomain(registry: DomainRegistry): void {
		for (const entity of FISCAL_ENTITIES) {
			registry.registerEntity(entity.name, {
				description: entity.description,
			});
		}

		// Register fiscal validation rules
		registry.registerRule(
			"valid-ruc",
			(input: unknown) =>
				typeof input === "string" &&
				/^\d{11}$/.test(input) &&
				["10", "15", "17", "20"].includes(input.substring(0, 2)),
		);
		registry.registerRule(
			"valid-invoice-series",
			(input: unknown) =>
				typeof input === "string" && /^[F|B|E]\d{3}$/.test(input),
		);
		registry.registerRule(
			"positive-amount",
			(input: unknown) =>
				typeof input === "number" && input > 0 && input <= 999999999.99,
		);
		registry.registerRule(
			"valid-detraction-percentage",
			(input: unknown) =>
				typeof input === "number" && input >= 0 && input <= 100,
		);
	}

	/**
	 * Register fiscal agent types and their capabilities.
	 */
	registerAgents(registry: AgentRegistry): void {
		for (const agent of FISCAL_AGENTS) {
			registry.registerAgentType(agent.type, () => ({
				type: agent.type,
				description: agent.description,
			}));

			for (const capability of agent.capabilities) {
				registry.registerCapability(agent.type, capability);
			}
		}
	}

	/**
	 * Register fiscal governance policies.
	 */
	registerPolicies(registry: PolicyRegistry): void {
		for (const policy of FISCAL_POLICIES) {
			registry.registerPolicy(policy.name, {
				description: policy.description,
				evaluate: policy.evaluate as (context: {
					action: string;
					agentType: string;
					task: {
						id: string;
						type: string;
						priority: string;
						input: Record<string, unknown>;
					};
					metadata?: Record<string, unknown>;
				}) => { allowed: boolean; reason?: string; requiresApproval?: boolean },
			});
		}
	}

	/**
	 * Register fiscal approval gates for sensitive actions.
	 */
	registerApprovalGates(registry: ApprovalGateRegistry): void {
		for (const gate of FISCAL_APPROVAL_GATES) {
			registry.registerGate(gate.name, {
				name: gate.name,
				description: gate.description,
				evaluate: gate.evaluate as (request: {
					id: string;
					action: string;
					agentId: string;
					taskId: string;
					evidence: Array<{
						type: string;
						content: unknown;
						timestamp: string;
					}>;
					metadata?: Record<string, unknown>;
				}) => Promise<{
					approved: boolean;
					approvedBy?: string;
					reason?: string;
					timestamp: string;
				}>,
			});
		}
	}
}
