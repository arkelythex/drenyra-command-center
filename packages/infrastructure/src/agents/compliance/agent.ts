// @deprecated Use packages/infrastructure/src/agents/compliance-agent.ts
/**
 * Compliance Agent
 *
 * Claude Opus-powered agent for regulatory reasoning and proactive
 * SUNAT compliance detection.
 *
 * Architecture:
 * - Uses model-registry for dynamic model selection
 * - Loads normative context via RAG
 * - Proposes corrective actions through HITL system
 *
 * @since December 2025
 */

import { generateObject, generateText } from "ai";
import {
	getComplianceModel,
	selectModelForTask,
} from "../../ai/model-registry";
import { loadNormativeContext } from "./rules";
import type {
	CompanyContext,
	ExpenseToAnalyze,
	PLESIREDiscrepancy,
} from "./types";
import {
	type ComplianceAnalysis,
	ComplianceAnalysisSchema,
	type ProposedAction,
	ProposedActionSchema,
} from "./types";

// ============================================
// COMPLIANCE ANALYSIS
// ============================================

// @deprecated Use packages/infrastructure/src/agents/compliance-agent.ts
/**
 * Analyze an expense for SUNAT compliance using Claude Opus
 * @param expense - Input for expense.
 * @param context - Input for context.
 * @returns Result of analyzeExpenseCompliance.
 * @example
 * ```ts
 * const result = await analyzeExpenseCompliance({} as ExpenseToAnalyze, {} as CompanyContext);
 * console.log(result);
 * ```
 */
export async function analyzeExpenseCompliance(
	expense: ExpenseToAnalyze,
	context: CompanyContext,
): Promise<ComplianceAnalysis> {
	const { model, modelKey, selectionReason } = getComplianceModel();
	const normativeContext = await loadNormativeContext([
		"art-37",
		"bancarization",
	]);

	console.info(`[ComplianceAgent] Using ${modelKey}: ${selectionReason}`);

	const result = await generateObject({
		model,
		schema: ComplianceAnalysisSchema,
		prompt: `
Actúa como un Auditor Tributario Senior de la SUNAT analizando este gasto.

GASTO A AUDITAR:
${JSON.stringify(expense, null, 2)}

CONTEXTO DE LA EMPRESA:
- Razón Social: ${context.businessName}
- RUC: ${context.ruc}
- Rubro: ${context.industry}
- Ingresos Mensuales: S/ ${context.monthlyRevenue.toLocaleString()}
- Promedio Histórico Gastos de Representación: S/ ${context.avgRepresentationExpenses.toLocaleString()}

${normativeContext}

INSTRUCCIONES:
1. Analiza si este gasto es estadísticamente anómalo para el rubro
2. Verifica si excede límites legales (0.5% de ingresos para representación)
3. Identifica documentación faltante
4. Evalúa riesgo de rechazo por SUNAT
5. Proporciona recomendaciones específicas

Sé ESTRICTO. Un error puede costar S/ 5,150+ en multas.
`.trim(),
		temperature: 0.1,
	});

	return result.object;
}

// @deprecated Use packages/infrastructure/src/agents/compliance-agent.ts
/**
 * Analyze SIRE-PLE discrepancy and propose corrective action
 * @param discrepancy - Input for discrepancy.
 * @param context - Input for context.
 * @returns Result of analyzeDiscrepancy.
 * @example
 * ```ts
 * const result = await analyzeDiscrepancy({} as PLESIREDiscrepancy, {} as CompanyContext);
 * console.log(result);
 * ```
 */
export async function analyzeDiscrepancy(
	discrepancy: PLESIREDiscrepancy,
	context: CompanyContext,
): Promise<ProposedAction> {
	const { model, modelKey } = selectModelForTask("normative_reasoning");

	console.info(`[ComplianceAgent] Analyzing discrepancy with ${modelKey}`);

	const result = await generateObject({
		model,
		schema: ProposedActionSchema,
		prompt: `
Eres un experto en conciliación tributaria SUNAT. Analiza esta discrepancia entre PLE y SIRE.

DISCREPANCIA DETECTADA:
${JSON.stringify(discrepancy, null, 2)}

EMPRESA:
- RUC: ${context.ruc}
- Razón Social: ${context.businessName}

INSTRUCCIONES:
1. Identifica la causa probable de la discrepancia
2. Determina la acción correctiva apropiada
3. Si procede una Nota de Crédito, indica los datos necesarios
4. Evalúa si la acción requiere aprobación humana

Prioriza la corrección antes del cierre mensual SUNAT.
`.trim(),
		temperature: 0.2,
	});

	return result.object;
}

// ============================================
// PROACTIVE DETECTION
// ============================================

// @deprecated Use packages/infrastructure/src/agents/compliance-agent.ts
/**
 * Check vendor status in SUNAT padrones (No Habido detection)
 * @param _vendorRuc - Input for _vendorRuc.
 * @returns Result of checkVendorCompliance.
 * @example
 * ```ts
 * const result = await checkVendorCompliance("");
 * console.log(result);
 * ```
 */
export async function checkVendorCompliance(_vendorRuc: string): Promise<{
	isCompliant: boolean;
	status: "habido" | "no_habido" | "no_encontrado" | "suspension_temporal";
	recommendation?: string;
}> {
	// TODO: Integrate with SUNAT API or scraping service
	// For now, return placeholder
	return {
		isCompliant: true,
		status: "habido",
	};
}

// @deprecated Use packages/infrastructure/src/agents/compliance-agent.ts
/**
 * Batch analyze representation expenses for limit compliance
 * @param expenses - Input for expenses.
 * @param context - Input for context.
 * @returns Result of analyzeRepresentationLimits.
 * @example
 * ```ts
 * const result = await analyzeRepresentationLimits([], {} as CompanyContext);
 * console.log(result);
 * ```
 */
export async function analyzeRepresentationLimits(
	expenses: ExpenseToAnalyze[],
	context: CompanyContext,
): Promise<{
	totalRepresentation: number;
	limit: number;
	percentageUsed: number;
	isOverLimit: boolean;
	atRiskExpenses: ExpenseToAnalyze[];
}> {
	const representationExpenses = expenses.filter(
		(e) =>
			e.category.toLowerCase().includes("representación") ||
			e.category.toLowerCase().includes("representacion"),
	);

	const totalRepresentation = representationExpenses.reduce(
		(sum, e) => sum + e.amount,
		0,
	);
	const annualRevenue = context.monthlyRevenue * 12;
	const limit = Math.min(annualRevenue * 0.005, 206000);
	const percentageUsed = (totalRepresentation / limit) * 100;

	const atRiskExpenses =
		percentageUsed > 80 ? representationExpenses.slice(-3) : [];

	return {
		totalRepresentation,
		limit,
		percentageUsed,
		isOverLimit: totalRepresentation > limit,
		atRiskExpenses,
	};
}

// ============================================
// AGENT RUNNER
// ============================================

// @deprecated Use packages/infrastructure/src/agents/compliance-agent.ts
/**
 * Run a generic compliance query with the best available model
 * @param question - Input for question.
 * @param context - Input for context.
 * @returns Result of askComplianceAgent.
 * @example
 * ```ts
 * const result = await askComplianceAgent("", {} as CompanyContext);
 * console.log(result);
 * ```
 */
export async function askComplianceAgent(
	question: string,
	context?: CompanyContext,
): Promise<string> {
	const { model, modelKey } = getComplianceModel();
	const normativeContext = await loadNormativeContext(["general"]);

	console.info(`[ComplianceAgent] Query using ${modelKey}`);

	const result = await generateText({
		model,
		system: `
Eres un asesor tributario peruano experto, especializado en normativa SUNAT.
Responde siempre en español peruano, con formato claro y citas legales cuando aplique.

${normativeContext}
`.trim(),
		prompt: context
			? `Contexto empresa: ${context.businessName} (RUC: ${context.ruc})\n\n${question}`
			: question,
	});

	return result.text;
}
