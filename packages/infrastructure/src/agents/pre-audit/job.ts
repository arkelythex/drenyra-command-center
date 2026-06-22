// @deprecated Use packages/infrastructure/src/agents/pre-audit-job.ts
/**
 * Pre-Audit Simulation Job
 *
 * Nightly job that runs "audit simulations" using SUNAT-like algorithms
 * to detect potential issues BEFORE they become problems.
 *
 * Elite 2026 Vision: "Auditoría Preventiva Permanente"
 * @see docs/architecture/vision-and-philosophy.md
 */

import { generateObject } from "ai";
import { z } from "zod";
import { selectModelForTask } from "../../ai/model-registry";
import type {
	AuditCheckContext,
	AuditFinding,
	AuditReport,
	Expense,
	Invoice,
} from "./types";

// ============================================
// RULE-BASED CHECKS
// ============================================

// @deprecated Use packages/infrastructure/src/agents/pre-audit-job.ts
/**
 * Check 1: IGV Consistency
 * Verify that declared IGV matches calculation from base
 */
function checkIgvConsistency(invoices: Invoice[]): AuditFinding[] {
	const findings: AuditFinding[] = [];

	for (const invoice of invoices) {
		const base = invoice.total - invoice.igv;
		const expectedIgv = Math.round(base * 0.18);
		const tolerance = 100;

		if (Math.abs(invoice.igv - expectedIgv) > tolerance) {
			findings.push({
				code: "IGV-001",
				severity: "high",
				category: "igv_inconsistency",
				description: `IGV declarado (S/ ${(invoice.igv / 100).toFixed(2)}) no coincide con cálculo esperado (S/ ${(expectedIgv / 100).toFixed(2)})`,
				affectedDocuments: [`${invoice.series}-${invoice.number}`],
				estimatedImpact: Math.abs(invoice.igv - expectedIgv) * 2,
				suggestedCorrection:
					"Verificar el cálculo del IGV en el comprobante original",
			});
		}
	}

	return findings;
}

// @deprecated Use packages/infrastructure/src/agents/pre-audit-job.ts
/**
 * Check 2: Detracción Compliance
 * Verify detractions for invoices >= S/700 with applicable operations
 */
function checkDetractionCompliance(invoices: Invoice[]): AuditFinding[] {
	const findings: AuditFinding[] = [];
	const DETRACTION_THRESHOLD = 70000;

	for (const invoice of invoices) {
		if (invoice.total >= DETRACTION_THRESHOLD && !invoice.hasDetraccion) {
			findings.push({
				code: "DET-001",
				severity: "medium",
				category: "detraccion_omission",
				description: `Factura por S/ ${(invoice.total / 100).toFixed(2)} sin detracción registrada. Verificar si la operación está sujeta al SPOT.`,
				affectedDocuments: [`${invoice.series}-${invoice.number}`],
				estimatedImpact: Math.round(invoice.total * 0.12),
				suggestedCorrection:
					"Verificar si la operación está sujeta al SPOT y regularizar el depósito si corresponde",
			});
		}
	}

	return findings;
}

// @deprecated Use packages/infrastructure/src/agents/pre-audit-job.ts
/**
 * Check 3: Representation Expense Limit (Art. 37 LIR)
 * Maximum deductible: 0.5% of net income with cap of 40 UIT
 */
function checkRepresentationLimit(
	expenses: Expense[],
	annualIncome: number,
	uit: number = 495000,
): AuditFinding[] {
	const findings: AuditFinding[] = [];

	const representationExpenses = expenses.filter(
		(e) => e.category === "representacion" || e.category === "representation",
	);

	const totalRepresentation = representationExpenses.reduce(
		(sum, e) => sum + e.amount,
		0,
	);

	const percentLimit = Math.round(annualIncome * 0.005);
	const absoluteLimit = uit * 40;
	const limit = Math.min(percentLimit, absoluteLimit);

	if (totalRepresentation > limit) {
		const excess = totalRepresentation - limit;
		findings.push({
			code: "REP-001",
			severity: "high",
			category: "representation_limit",
			description: `Gastos de representación (S/ ${(totalRepresentation / 100).toFixed(2)}) exceden límite deducible (S/ ${(limit / 100).toFixed(2)}).`,
			affectedDocuments: representationExpenses.map((e) => e.id),
			estimatedImpact: Math.round(excess * 0.295),
			suggestedCorrection: `Reclasificar S/ ${(excess / 100).toFixed(2)} como gasto no deducible para efectos del IR`,
		});
	}

	return findings;
}

// @deprecated Use packages/infrastructure/src/agents/pre-audit-job.ts
/**
 * Check 4: Duplicate Entries
 * Detect potential duplicate invoices by series-number
 */
function checkDuplicates(invoices: Invoice[]): AuditFinding[] {
	const findings: AuditFinding[] = [];
	const seen = new Map<string, Invoice>();

	for (const invoice of invoices) {
		const key = `${invoice.ruc}-${invoice.series}-${invoice.number}`;

		if (seen.has(key)) {
			const existingInvoice = seen.get(key)!;
			findings.push({
				code: "DUP-001",
				severity: "critical",
				category: "duplicate_entry",
				description: `Comprobante duplicado detectado: ${invoice.series}-${invoice.number}`,
				affectedDocuments: [invoice.id, existingInvoice.id],
				estimatedImpact: invoice.total,
				suggestedCorrection: "Eliminar uno de los registros duplicados",
			});
		}

		seen.set(key, invoice);
	}

	return findings;
}

// ============================================
// AI-POWERED ANALYSIS
// ============================================

// @deprecated Use packages/infrastructure/src/agents/pre-audit-job.ts
/**
 * Use AI to analyze complex patterns and generate recommendations
 */
async function analyzeWithAI(
	findings: AuditFinding[],
	_context: Partial<AuditCheckContext>,
): Promise<string[]> {
	if (findings.length === 0) {
		return [
			"No se detectaron hallazgos. Continuar con buenas prácticas de control.",
		];
	}

	const { model, modelKey } = selectModelForTask("normative_reasoning");
	console.info(`[PreAuditJob] Analyzing with ${modelKey}`);

	const result = await generateObject({
		model,
		schema: z.object({
			recommendations: z
				.array(z.string())
				.describe("Lista de recomendaciones priorizadas"),
		}),
		system: `Eres un auditor tributario peruano experto en normativa SUNAT.
Analiza los hallazgos de una pre-auditoría y genera recomendaciones priorizadas.
Las recomendaciones deben ser específicas, accionables y ordenadas por urgencia.`,
		prompt: `
HALLAZGOS DE PRE-AUDITORÍA:
${findings.map((f) => `- [${f.severity.toUpperCase()}] ${f.code}: ${f.description}`).join("\n")}

TOTAL DE RIESGO ESTIMADO: S/ ${(findings.reduce((sum, f) => sum + f.estimatedImpact, 0) / 100).toFixed(2)}

Genera 3-5 recomendaciones priorizadas para mitigar estos riesgos antes del próximo cierre tributario.
`.trim(),
	});

	return result.object.recommendations;
}

// ============================================
// MAIN AUDIT EXECUTION
// ============================================

// @deprecated Use packages/infrastructure/src/agents/pre-audit-job.ts
/**
 * Execute complete pre-audit simulation
 * @param organizationId - Input for organizationId.
 * @param period - Input for period.
 * @param context - Input for context.
 * @param annualIncome - Input for annualIncome.
 * @returns Result of executePreAudit.
 * @example
 * ```ts
 * const result = await executePreAudit(0, "", {} as AuditCheckContext, 0);
 * console.log(result);
 * ```
 */
export async function executePreAudit(
	organizationId: number,
	period: string,
	context: AuditCheckContext,
	annualIncome: number = 0,
): Promise<AuditReport> {
	console.info(
		`[PreAuditJob] Starting pre-audit for org ${organizationId}, period ${period}`,
	);

	const allFindings: AuditFinding[] = [
		...checkIgvConsistency(context.invoices),
		...checkDetractionCompliance(context.invoices),
		...checkRepresentationLimit(context.expenses, annualIncome),
		...checkDuplicates(context.invoices),
	];

	const bySeverity = {
		low: allFindings.filter((f) => f.severity === "low").length,
		medium: allFindings.filter((f) => f.severity === "medium").length,
		high: allFindings.filter((f) => f.severity === "high").length,
		critical: allFindings.filter((f) => f.severity === "critical").length,
	};

	const totalRisk = allFindings.reduce((sum, f) => sum + f.estimatedImpact, 0);
	const severityWeight =
		bySeverity.critical * 40 +
		bySeverity.high * 25 +
		bySeverity.medium * 10 +
		bySeverity.low * 5;
	const riskScore = Math.min(
		100,
		severityWeight + Math.floor(totalRisk / 1000000),
	);

	const recommendations = await analyzeWithAI(allFindings, context);

	const report: AuditReport = {
		organizationId,
		period,
		executedAt: new Date().toISOString(),
		findings: allFindings,
		summary: {
			totalFindings: allFindings.length,
			bySeverity,
			estimatedTotalRisk: totalRisk,
		},
		overallRiskScore: riskScore,
		recommendations,
	};

	console.info(
		`[PreAuditJob] Completed. Found ${allFindings.length} findings, risk score: ${riskScore}`,
	);

	return report;
}

// ============================================
// SCHEDULED JOB WRAPPER
// ============================================

// @deprecated Use packages/infrastructure/src/agents/pre-audit-job.ts
/**
 * Nightly job entry point (to be called by job scheduler)
 * @param organizationIds - Input for organizationIds.
 * @param period - Input for period.
 * @returns Result of runNightlyPreAudit.
 * @example
 * ```ts
 * const result = await runNightlyPreAudit([], "");
 * console.log(result);
 * ```
 */
export async function runNightlyPreAudit(
	organizationIds: number[],
	period: string,
): Promise<Map<number, AuditReport>> {
	const results = new Map<number, AuditReport>();

	console.info(
		`[PreAuditJob] Starting nightly pre-audit for ${organizationIds.length} organizations`,
	);

	for (const orgId of organizationIds) {
		try {
			const mockContext: AuditCheckContext = {
				invoices: [],
				expenses: [],
				bankTransactions: [],
				period,
			};

			const report = await executePreAudit(orgId, period, mockContext, 0);
			results.set(orgId, report);
		} catch (error) {
			console.error(`[PreAuditJob] Error for org ${orgId}:`, error);
		}
	}

	console.info(
		`[PreAuditJob] Completed nightly run. ${results.size}/${organizationIds.length} successful`,
	);

	return results;
}
