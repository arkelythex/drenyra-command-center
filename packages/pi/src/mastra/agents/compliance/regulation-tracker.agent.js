import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { createFinding, requireComplianceScope } from "./compliance-utils";
const sunatRegulations = [
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
export const regulationTrackerPort = {
    id: "regulation-tracker",
    name: "Regulation Tracker",
    description: "Peruvian tax regulation tracking",
    capabilities: ["compliance:regulations", "compliance:sunat"],
    priority: 5,
    drenyraSubagent: null,
    execute: async (task, _config) => {
        const context = requireComplianceScope({
            payload: task.payload,
            metadata: task.metadata,
            traceId: task.metadata?.traceId,
        });
        const findings = [];
        const regulations = [];
        const gaps = [];
        const crossRucScope = task.payload?.crossRucScope;
        for (const reg of sunatRegulations) {
            if (reg.applies(context)) {
                regulations.push({
                    id: reg.id,
                    name: reg.name,
                    jurisdiction: reg.jurisdiction,
                    status: "active",
                });
            }
            else {
                regulations.push({
                    id: reg.id,
                    name: reg.name,
                    jurisdiction: reg.jurisdiction,
                    status: "exempt",
                });
            }
        }
        if (crossRucScope && context.ruc && crossRucScope !== context.ruc) {
            findings.push(createFinding({
                severity: "high",
                category: "regulation.ruc-scope-mismatch",
                message: `Cross-RUC operation: context RUC ${context.ruc} vs payload RUC ${crossRucScope}`,
                recommendedAction: "Ensure multi-RUC operations comply with SUNAT grouping rules",
            }));
            gaps.push("Cross-RUC fiscal consolidation");
        }
        if (regulations.filter((r) => r.status === "active").length < 3) {
            gaps.push("Incomplete SUNAT regulation coverage");
        }
        const report = { regulations, gaps, findings };
        return {
            success: gaps.length === 0,
            data: report,
            metrics: { duration: 0, tokensUsed: 0, cost: 0 },
            agentId: "regulation-tracker",
        };
    },
};
//# sourceMappingURL=regulation-tracker.agent.js.map