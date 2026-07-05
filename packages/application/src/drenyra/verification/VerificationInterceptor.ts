/**
 * VerificationInterceptor — Intención↔acción verification layer.
 *
 * Toma un AgentRunOutput y ejecuta el motor determinístico contra cada finding.
 * Produce un VerificationReport que se adjunta al diff del approval request
 * y se renderiza en el AccountingDiffView del frontend.
 *
 * El interceptor NO bloquea — el agente ya completó su ejecución.
 * La verificación es un gate informativo que alimenta la decisión humana
 * y calcula la confianza ajustada post-verificación.
 *
 * @since Jul 2026
 */

import type {
	AgentRunOutput,
	VerificationReport,
	VerificationAuditEvent,
	VerificationMetrics,
	VerifiedFinding,
} from "@drenyra/domain/drenyra";
import { runVerificationRules } from "./rules/registry";

// ── Helpers ──────────────────────────────────────────────────────────────────

function newId(prefix: string): string {
	return `${prefix}_${crypto.randomUUID()}`;
}

function nowIso(): string {
	return new Date().toISOString();
}

/**
 * Ajusta el confidence score del agente en base a la integridad de la verificación.
 * - integrityScore >= 90 → confidence se mantiene o mejora
 * - integrityScore 70-89 → confidence se reduce 10%
 * - integrityScore < 70 → confidence se reduce 25%
 * - Si hay algún FAIL → el score no puede superar 50
 */
function computeAdjustedConfidence(
	originalConfidence: number,
	integrityScore: number,
	hasFailures: boolean,
): number {
	let adjusted = originalConfidence;

	if (integrityScore >= 90) {
		adjusted = Math.max(adjusted, originalConfidence);
	} else if (integrityScore >= 70) {
		adjusted = originalConfidence * 0.9;
	} else {
		adjusted = originalConfidence * 0.75;
	}

	if (hasFailures) {
		adjusted = Math.min(adjusted, 50);
	}

	return Math.round(Math.max(0, Math.min(100, adjusted)));
}

/**
 * Computa métricas detalladas incluyendo desglose por regla.
 */
function computeMetrics(
	findings: VerifiedFinding[],
	integrityScore: number,
): VerificationMetrics {
	const passed = findings.filter((f) => f.status === "pass").length;
	const failed = findings.filter((f) => f.status === "fail").length;
	const inconclusive = findings.filter(
		(f) => f.status === "inconclusive",
	).length;
	const bypassed = findings.filter((f) => f.status === "bypassed").length;

	// Desglose por regla
	const perRuleMetrics: VerificationMetrics["perRuleMetrics"] = {};
	for (const f of findings) {
		if (!perRuleMetrics[f.rule]) {
			perRuleMetrics[f.rule] = {
				passed: 0,
				failed: 0,
				inconclusive: 0,
				total: 0,
			};
		}
		perRuleMetrics[f.rule].total++;
		if (f.status === "pass") perRuleMetrics[f.rule].passed++;
		else if (f.status === "fail") perRuleMetrics[f.rule].failed++;
		else if (f.status === "inconclusive") perRuleMetrics[f.rule].inconclusive++;
	}

	return {
		totalFindings: findings.length,
		passed,
		failed,
		inconclusive,
		bypassed,
		integrityScore,
		perRuleMetrics,
	};
}

/**
 * Construye un summary ejecutivo del reporte.
 */
function buildSummary(
	findings: VerifiedFinding[],
	integrityScore: number,
): string {
	const passed = findings.filter((f) => f.status === "pass").length;
	const failed = findings.filter((f) => f.status === "fail").length;
	const total = findings.length;

	if (total === 0) return "No se ejecutaron verificaciones.";

	const parts: string[] = [];
	parts.push(
		`${passed}/${total} verificaciones pasaron (${integrityScore}% integridad).`,
	);
	if (failed > 0)
		parts.push(
			`${failed} discrepancia(s) encontrada(s) — se requiere revisión humana.`,
		);
	const inconclusive = findings.filter(
		(f) => f.status === "inconclusive",
	).length;
	if (inconclusive > 0)
		parts.push(
			`${inconclusive} verificación(es) inconclusa(s) por datos insuficientes.`,
		);

	return parts.join(" ");
}

// ── Interceptor ──────────────────────────────────────────────────────────────

export interface VerificationContext {
	/** RUC de la compañía (para validaciones contra SUNAT) */
	companyRuc?: string;
	/**
	 * Período fiscal activo (YYYY-MM).
	 * Obligatorio — se usa para resolver tasas fiscales contra la fecha del período,
	 * NO contra la fecha de ejecución del verify.
	 */
	period: string;
	/** Datos fuente adicionales para las reglas de verificación */
	sourceData?: Record<string, unknown>;
}

/**
 * Ejecuta la verificación de un AgentRunOutput contra el motor determinístico.
 *
 * @param output - El output del agente a verificar
 * @param context - Contexto adicional para las reglas de verificación
 * @returns VerificationReport con findings verificados y confianza ajustada
 */
export function verifyAgentRunOutput(
	output: AgentRunOutput,
	context: VerificationContext & {
		summary?: string;
		recommendedActions?: string[];
		changes?: Array<{ field: string }>;
	},
): VerificationReport {
	// Ejecutar reglas de verificación contra cada finding
	const findings: VerifiedFinding[] = runVerificationRules(
		output.findings,
		output.riskLevel,
		{
			...context,
			summary: context.summary ?? output.summary,
			recommendedActions:
				context.recommendedActions ?? output.recommendedActions,
		},
	);

	const passed = findings.filter((f) => f.status === "pass").length;
	const failed = findings.filter((f) => f.status === "fail").length;
	const total = findings.length;
	const integrityScore = total > 0 ? Math.round((passed / total) * 100) : 100;

	const adjustedConfidence = computeAdjustedConfidence(
		output.confidence * 100,
		integrityScore,
		failed > 0,
	);

	// Generar audit events para cada finding fail/bypassed
	// NOTA: bypassed findings solo existen si un humano los autorizó explícitamente.
	// Automatic "no rule matched" produce inconclusive, no bypassed.
	const auditEvents: VerificationAuditEvent[] = findings
		.filter(
			(f): f is VerifiedFinding & { status: "bypassed" } =>
				f.status === "bypassed",
		)
		.map((f) => ({
			eventType: "VERIFICATION_BYPASSED" as const,
			finding: f.finding,
			rule: f.rule,
			reason: `Finding cualitativo sin regla aplicable (${f.bypassReason})`,
			actorId: f.authorizedBy.userId,
			occurredAt: nowIso(),
			detail: f.detail,
		}));

	return {
		id: newId("verification"),
		verifiedAt: nowIso(),
		adjustedConfidence,
		findings,
		auditEvents,
		integrityScore,
		summary: buildSummary(findings, integrityScore),
		metrics: computeMetrics(findings, integrityScore),
	};
}
