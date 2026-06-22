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

import { fiscalTools, runToolLoop } from "@arkelythex/ai";
import { generateObject } from "ai";
import { z } from "zod";
import { getComplianceModel, selectModelForTask } from "../ai/model-registry";

// ============================================
// TYPES
// ============================================

/**
 * CompanyContext interface.
 *
 * @example
 * ```ts
 * const value: CompanyContext = {} as CompanyContext;
 * console.log(value);
 * ```
 */
export interface CompanyContext {
	organizationId: number;
	ruc: string;
	businessName: string;
	industry: string;
	monthlyRevenue: number;
	avgRepresentationExpenses: number;
}

/**
 * ExpenseToAnalyze interface.
 *
 * @example
 * ```ts
 * const value: ExpenseToAnalyze = {} as ExpenseToAnalyze;
 * console.log(value);
 * ```
 */
export interface ExpenseToAnalyze {
	id: string;
	description: string;
	amount: number;
	vendorRuc?: string;
	vendorName?: string;
	category: string;
	date: Date;
}

/**
 * PLESIREDiscrepancy interface.
 *
 * @example
 * ```ts
 * const value: PLESIREDiscrepancy = {} as PLESIREDiscrepancy;
 * console.log(value);
 * ```
 */
export interface PLESIREDiscrepancy {
	id: string;
	type: "amount_mismatch" | "missing_in_ple" | "missing_in_sire" | "duplicated";
	pleRecord?: Record<string, unknown>;
	sireRecord?: Record<string, unknown>;
	discrepancyAmount?: number;
	detectedAt: Date;
}

// ============================================
// RESPONSE SCHEMAS
// ============================================

const ComplianceAlertSchema = z.object({
	type: z.enum([
		"missing_documentation",
		"anomaly",
		"legal_risk",
		"limit_exceeded",
	]),
	severity: z.enum(["info", "warning", "error", "critical"]),
	message: z.string(),
	recommendation: z.string(),
	legalBasis: z.string().optional(),
});

const ComplianceAnalysisSchema = z.object({
	isCompliant: z.boolean(),
	riskLevel: z.enum(["low", "medium", "high", "critical"]),
	alerts: z.array(ComplianceAlertSchema),
	requiredActions: z.array(z.string()),
	confidence: z.number().min(0).max(1),
});

const ProposedActionSchema = z.object({
	actionType: z.enum([
		"generate_nota_credito",
		"reclassify_expense",
		"request_documentation",
		"mark_non_deductible",
		"flag_for_review",
		"no_action_needed",
	]),
	reason: z.string(),
	affectedDocuments: z.array(z.string()),
	estimatedImpact: z
		.object({
			taxSavings: z.number().optional(),
			riskReduction: z.string().optional(),
		})
		.optional(),
	requiresApproval: z.boolean(),
});

/**
 * ComplianceAnalysis type.
 *
 * @example
 * ```ts
 * const value: ComplianceAnalysis = {} as ComplianceAnalysis;
 * console.log(value);
 * ```
 */
export type ComplianceAnalysis = z.infer<typeof ComplianceAnalysisSchema>;
/**
 * ProposedAction type.
 *
 * @example
 * ```ts
 * const value: ProposedAction = {} as ProposedAction;
 * console.log(value);
 * ```
 */
export type ProposedAction = z.infer<typeof ProposedActionSchema>;
/**
 * ComplianceAlert type.
 *
 * @example
 * ```ts
 * const value: ComplianceAlert = {} as ComplianceAlert;
 * console.log(value);
 * ```
 */
export type ComplianceAlert = z.infer<typeof ComplianceAlertSchema>;

// ============================================
// NORMATIVE CONTEXT (RAG placeholder)
// ============================================

/**
 * Load normative context for compliance analysis
 * In production, this would use a RAG pipeline to load relevant SUNAT regulations
 */
async function loadNormativeContext(_topics: string[]): Promise<string> {
	// TODO: Integrate with RAG system for dynamic regulation loading
	const staticContext = `
PERUVIAN TAX LAW CONTEXT:

1. GASTOS DE REPRESENTACIÓN (Art. 37 inciso 'r' LIR):
   - Límite: 0.5% de los ingresos netos acumulados del ejercicio
   - Tope máximo: 40 UIT (S/ 206,000 para 2025)
   - Requisitos: Demostrar causalidad con generación de renta
   - Documentación: Lista de asistentes, motivo comercial

2. BANCARIZACIÓN (Ley 28194):
   - Obligatoria para operaciones >= S/ 2,000 o $500
   - Medios válidos: Transferencia, cheque, tarjeta
   - Consecuencia: Gasto no deducible si incumple

3. DETRACCIONES (SPOT):
   - Aplica sobre monto > S/ 700
   - Tasas según tipo de servicio (4% - 15%)
   - Plazo de depósito: Hasta 5to día hábil

4. PROVEEDOR NO HABIDO:
   - Verificar estado en padrones SUNAT antes de operación
   - Facturas de proveedores "No Habido" no son deducibles
   - Consulta: https://e-consultaruc.sunat.gob.pe
`;
	return staticContext;
}

// ============================================
// COMPLIANCE ANALYSIS
// ============================================

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
	const limit = Math.min(annualRevenue * 0.005, 206000); // 0.5% capped at 40 UIT
	const percentageUsed = (totalRepresentation / limit) * 100;

	const atRiskExpenses =
		percentageUsed > 80
			? representationExpenses.slice(-3) // Last 3 if approaching limit
			: [];

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

	const result = await runToolLoop({
		model,
		system: `
Eres un asesor tributario peruano experto, especializado en normativa SUNAT.
Responde siempre en español peruano, con formato claro y citas legales cuando aplique.

${normativeContext}
`.trim(),
		prompt: context
			? `Contexto empresa: ${context.businessName} (RUC: ${context.ruc})\n\n${question}`
			: question,
		tools: {
			validateRUC: fiscalTools.validateRUC,
			calculateIGV: fiscalTools.calculateIGV,
			calculateDetraction: fiscalTools.calculateDetraction,
		},
		maxSteps: 3,
	});

	return result.text;
}
