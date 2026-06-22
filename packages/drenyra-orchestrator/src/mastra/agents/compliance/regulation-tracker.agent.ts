import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import type { AgentPort, AgentResult, Task } from "../../../types/agent-core";
import type { ComplianceContext, ComplianceFinding } from "./compliance.types";
import { createFinding, requireComplianceScope } from "./compliance-utils";

export type RegulationStatus = "active" | "pending" | "exempt";

export interface Regulation {
	id: string;
	name: string;
	jurisdiction: string;
	status: RegulationStatus;
}

export interface RegulationReport {
	regulations: readonly Regulation[];
	gaps: readonly string[];
	findings: readonly ComplianceFinding[];
}

const sunatRegulations: ReadonlyArray<{
	id: string;
	name: string;
	jurisdiction: string;
	applies: (context: ComplianceContext) => boolean;
}> = [
	{
		id: "sunat-cpe",
		name: "SUNAT CPE — Comprobantes Electrónicos",
		jurisdiction: "Peru-SUNAT",
		applies: () => true,
	},
	{
		id: "sunat-igv",
		name: "IGV — Impuesto General a las Ventas (18%)",
		jurisdiction: "Peru-SUNAT",
		applies: () => true,
	},
	{
		id: "sunat-spot",
		name: "SPOT — Sistema de Detracciones",
		jurisdiction: "Peru-SUNAT",
		applies: (ctx) => Boolean(ctx.ruc),
	},
	{
		id: "sunat-sire",
		name: "SIRE — Sistema de Registro de Emisiones",
		jurisdiction: "Peru-SUNAT",
		applies: (ctx) => Boolean(ctx.ruc) && Boolean(ctx.period),
	},
	{
		id: "sunat-retencion",
		name: "Retenciones — IR 3ra/4ta/5ta categoría",
		jurisdiction: "Peru-SUNAT",
		applies: () => true,
	},
];

export const regulationTrackerAgent = new Agent({
	id: "regulation-tracker",
	name: "regulation-tracker",
	instructions: "You track Peruvian tax regulation compliance.",
	model: openai("gpt-4o"),
});

export const regulationTrackerPort: AgentPort<Task, RegulationReport> = {
	id: "regulation-tracker",
	name: "Regulation Tracker",
	description: "Peruvian tax regulation tracking",
	capabilities: ["compliance:regulations", "compliance:sunat"],
	priority: 5,
	drenyraSubagent: null,

	execute: async (task: Task, _config?) => {
		const context: ComplianceContext = requireComplianceScope({
			payload: task.payload as Record<string, unknown> | undefined,
			metadata: task.metadata as Record<string, unknown> | undefined,
			traceId: task.metadata?.traceId as string | undefined,
		});

		const findings: ComplianceFinding[] = [];
		const regulations: Regulation[] = [];
		const gaps: string[] = [];
		const crossRucScope = task.payload?.crossRucScope as string | undefined;

		for (const reg of sunatRegulations) {
			if (reg.applies(context)) {
				regulations.push({
					id: reg.id,
					name: reg.name,
					jurisdiction: reg.jurisdiction,
					status: "active",
				});
			} else {
				regulations.push({
					id: reg.id,
					name: reg.name,
					jurisdiction: reg.jurisdiction,
					status: "exempt",
				});
			}
		}

		if (crossRucScope && context.ruc && crossRucScope !== context.ruc) {
			findings.push(
				createFinding({
					severity: "high",
					category: "regulation.ruc-scope-mismatch",
					message: `Cross-RUC operation: context RUC ${context.ruc} vs payload RUC ${crossRucScope}`,
					recommendedAction:
						"Ensure multi-RUC operations comply with SUNAT grouping rules",
				}),
			);
			gaps.push("Cross-RUC fiscal consolidation");
		}

		if (regulations.filter((r) => r.status === "active").length < 3) {
			gaps.push("Incomplete SUNAT regulation coverage");
		}

		const report: RegulationReport = { regulations, gaps, findings };
		return {
			success: gaps.length === 0,
			data: report,
			metrics: { duration: 0, tokensUsed: 0, cost: 0 },
			agentId: "regulation-tracker",
		};
	},
};
