import type { AgentContext } from "../types/agent-context";
import type { AgentId, AgentIntent } from "../types/erp-types";

export interface IntentRule {
	pattern: RegExp;
	agent: AgentId;
	tool: string;
	priority: number;
}

// Biome-ignore lint/complexity/noBannedTypes: Intentionally empty base type
export type IntentHandler = (
	input: string,
	context: AgentContext,
) => Promise<AgentIntent>;

/**
 * Intent Detector — pure pattern-match engine.
 *
 * No external deps: regex-based domain routing.
 * Converted the original ~25 hardcoded rules into a register/detect system.
 */
export class IntentDetector {
	private rules: IntentRule[] = [];

	constructor() {
		this.registerDefaultRules();
	}

	register(rule: IntentRule): void {
		this.rules.push(rule);
		this.rules.sort((a, b) => b.priority - a.priority);
	}

	async detectIntent(
		input: string,
		_context: AgentContext,
	): Promise<AgentIntent> {
		const normalized = input.toLowerCase().trim();

		for (const rule of this.rules) {
			if (rule.pattern.test(normalized)) {
				return {
					agent: rule.agent,
					tool: rule.tool,
					confidence: 1.0,
					originalInput: input,
				};
			}
		}

		return {
			agent: "ai-assistant" as AgentId,
			tool: "general",
			confidence: 0.3,
			originalInput: input,
		};
	}

	private registerDefaultRules(): void {
		const rules: IntentRule[] = [
			// Finance
			{
				pattern: /\b(invoice|factura|bill|pago|payment)\b/i,
				agent: "finance" as AgentId,
				tool: "invoice",
				priority: 50,
			},
			{
				pattern: /\b(balance|account|cuenta|ledger|libro)\b/i,
				agent: "finance" as AgentId,
				tool: "account",
				priority: 50,
			},
			{
				pattern: /\b(cashflow|flujo|efectivo|cash)\b/i,
				agent: "finance" as AgentId,
				tool: "cashflow",
				priority: 50,
			},
			{
				pattern: /\b(reconcil|conciliación|match)\b/i,
				agent: "finance" as AgentId,
				tool: "reconciliation",
				priority: 50,
			},

			// Compliance / SUNAT
			{
				pattern: /\b(igv|vat|tax|impuesto)\b/i,
				agent: "compliance" as AgentId,
				tool: "igv",
				priority: 80,
			},
			{
				pattern: /\b(sunat|sire|ple)\b/i,
				agent: "compliance" as AgentId,
				tool: "sire",
				priority: 90,
			},
			{
				pattern: /\b(detraccion|spot|detraction)\b/i,
				agent: "compliance" as AgentId,
				tool: "detraction",
				priority: 80,
			},
			{
				pattern: /\b(retencion|withholding)\b/i,
				agent: "compliance" as AgentId,
				tool: "retention",
				priority: 80,
			},
			{
				pattern: /\b(ruc|dni|tax.id|contribuyente)\b/i,
				agent: "compliance" as AgentId,
				tool: "ruc",
				priority: 80,
			},
			{
				pattern: /\b(cpe|factura\s*electrónica|boleta|xml.*ubl)\b/i,
				agent: "compliance" as AgentId,
				tool: "cpe",
				priority: 80,
			},
			{
				pattern: /\b(audit|auditoría|auditar)\b/i,
				agent: "compliance" as AgentId,
				tool: "audit",
				priority: 70,
			},

			// Operations
			{
				pattern: /\b(customer|cliente|proveedor|vendor|supplier)\b/i,
				agent: "operations" as AgentId,
				tool: "counterparty",
				priority: 50,
			},
			{
				pattern: /\b(stock|inventory|inventario|product|producto)\b/i,
				agent: "operations" as AgentId,
				tool: "inventory",
				priority: 50,
			},

			// System Admin
			{
				pattern: /\b(settings|configuración|config|setup)\b/i,
				agent: "system-admin" as AgentId,
				tool: "settings",
				priority: 40,
			},
			{
				pattern: /\b(profile|perfil|user|usuario)\b/i,
				agent: "system-admin" as AgentId,
				tool: "profile",
				priority: 40,
			},
			{
				pattern: /\b(integration|integracion|api.key|webhook)\b/i,
				agent: "system-admin" as AgentId,
				tool: "integration",
				priority: 40,
			},

			// Latin Moderno domain agents
			{
				pattern: /\b(cerno|see|vision|overview)\b/i,
				agent: "cerno" as AgentId,
				tool: "vision",
				priority: 60,
			},
			{
				pattern: /\b(custos|guard|protect|security)\b/i,
				agent: "custos" as AgentId,
				tool: "guard",
				priority: 60,
			},
			{
				pattern: /\b(necto|connect|link|integration)\b/i,
				agent: "necto" as AgentId,
				tool: "connect",
				priority: 60,
			},
			{
				pattern: /\b(regula|rule|norm|policy|regulation)\b/i,
				agent: "regula" as AgentId,
				tool: "regulate",
				priority: 60,
			},
			{
				pattern: /\b(lumen|insight|analytics|report)\b/i,
				agent: "lumen" as AgentId,
				tool: "insight",
				priority: 60,
			},
			{
				pattern: /\b(fusio|merge|consolidate|unify)\b/i,
				agent: "fusio" as AgentId,
				tool: "consolidate",
				priority: 60,
			},
			{
				pattern: /\b(scripta|document|record|write)\b/i,
				agent: "scripta" as AgentId,
				tool: "document",
				priority: 60,
			},
			{
				pattern: /\b(capsa|store|archive|save|backup)\b/i,
				agent: "capsa" as AgentId,
				tool: "store",
				priority: 60,
			},
		];

		for (const rule of rules) {
			this.register(rule);
		}
	}

	getRules(): IntentRule[] {
		return [...this.rules];
	}
}
