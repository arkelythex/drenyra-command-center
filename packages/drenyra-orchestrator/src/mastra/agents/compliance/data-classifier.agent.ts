import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import type { AgentPort, AgentResult, Task } from "../../../types/agent-core";
import type { ComplianceContext, ComplianceFinding } from "./compliance.types";
import { createFinding, requireComplianceScope } from "./compliance-utils";

export type ClassificationRisk =
	| "none"
	| "low"
	| "medium"
	| "high"
	| "critical";
export type DataCategory =
	| "pii"
	| "fiscal_sensitive"
	| "financial"
	| "restricted"
	| "public";

export interface Classification {
	field: string;
	categories: readonly DataCategory[];
	risk: ClassificationRisk;
}

export interface ClassifierReport {
	classifications: readonly Classification[];
	unclassified: readonly string[];
	recommendations: readonly string[];
	findings: readonly ComplianceFinding[];
}

const patternRules: ReadonlyArray<{
	pattern: RegExp;
	category: DataCategory;
	risk: ClassificationRisk;
}> = [
	{
		pattern: /ruc|dni|nombre|apellido|direccion|email|telefono/i,
		category: "pii",
		risk: "high",
	},
	{
		pattern: /cuenta|iban|clabe|tarjeta|monto|saldo|transferencia/i,
		category: "financial",
		risk: "high",
	},
	{
		pattern: /factura|boleta|igv|sunat|cpe|comprobante/i,
		category: "fiscal_sensitive",
		risk: "critical",
	},
	{
		pattern: /secreto|confidencial|clave|token|password/i,
		category: "restricted",
		risk: "critical",
	},
];

export const dataClassifierAgent = new Agent({
	id: "data-classifier",
	name: "data-classifier",
	instructions: "You classify data fields by fiscal sensitivity.",
	model: openai("gpt-4o"),
});

export const dataClassifierPort: AgentPort<Task, ClassifierReport> = {
	id: "data-classifier",
	name: "Data Classifier",
	description: "Classify data fields by fiscal sensitivity",
	capabilities: ["compliance:classification", "compliance:data-classification"],
	priority: 4,
	drenyraSubagent: null,

	execute: async (task: Task, _config?) => {
		requireComplianceScope({
			payload: task.payload as Record<string, unknown> | undefined,
			metadata: task.metadata as Record<string, unknown> | undefined,
			traceId: task.metadata?.traceId as string | undefined,
		});

		const findings: ComplianceFinding[] = [];
		const rawFields = (task.payload?.fields ?? []) as string[];
		const classifications: Classification[] = [];
		const unclassified: string[] = [];
		const recommendations: string[] = [];

		for (const field of rawFields) {
			const matches = patternRules.filter((r) => r.pattern.test(field));

			if (matches.length === 0) {
				unclassified.push(field);
				continue;
			}

			const categories = matches.map((m) => m.category);
			const risk = matches.reduce((max, m) => {
				const order: ClassificationRisk[] = [
					"none",
					"low",
					"medium",
					"high",
					"critical",
				];
				return order.indexOf(m.risk) > order.indexOf(max) ? m.risk : max;
			}, "low" as ClassificationRisk);

			classifications.push({
				field,
				categories: [...new Set(categories)],
				risk,
			});

			if (categories.includes("fiscal_sensitive")) {
				recommendations.push(
					`Apply fiscal retention policy for field: ${field}`,
				);
			}
			if (categories.includes("pii")) {
				recommendations.push(
					`Apply GDPR/data protection controls for field: ${field}`,
				);
			}
		}

		if (unclassified.length > 0) {
			findings.push(
				createFinding({
					severity: "medium",
					category: "classification.unclassified-fields",
					message: `${unclassified.length} fields could not be classified`,
					evidenceRefs: unclassified,
					recommendedAction: "Review and manually classify unclassified fields",
				}),
			);
		}

		const report: ClassifierReport = {
			classifications,
			unclassified,
			recommendations,
			findings,
		};
		return {
			success: true,
			data: report,
			metrics: { duration: 0, tokensUsed: 0, cost: 0 },
			agentId: "data-classifier",
		};
	},
};
