import type { AgentRunOutput, FiscalCase, DrenyraAgentType } from "@arkelythex/domain/drenyra";

const AGENT_LABEL: Record<DrenyraAgentType, string> = {
	CPE_AGENT: "CPE",
	SIRE_AGENT: "SIRE",
	LEDGER_AGENT: "Libro mayor",
	CONCILIATION_AGENT: "Conciliación",
	FISCAL_REVIEWER_AGENT: "Revisor fiscal",
	EVIDENCE_AGENT: "Evidencia",
};

const REQUIRED_EVIDENCE: Record<DrenyraAgentType, string[]> = {
	CPE_AGENT: ["XML UBL 2.1", "CDR SUNAT", "serie y correlativo"],
	SIRE_AGENT: ["registro SIRE", "constancia de propuesta", "periodo tributario"],
	LEDGER_AGENT: ["asiento contable", "cuenta PCGE", "traza de usuario"],
	CONCILIATION_AGENT: ["extracto bancario", "movimiento contable", "match propuesto"],
	FISCAL_REVIEWER_AGENT: ["bundle de evidencia", "resumen de riesgo", "aprobación humana"],
	EVIDENCE_AGENT: ["hash de documento", "origen de fuente", "actor que adjuntó"],
};

export function runDeterministicMockAgent(agentType: DrenyraAgentType, fiscalCase: FiscalCase): AgentRunOutput {
	const label = AGENT_LABEL[agentType];
	const highRisk = fiscalCase.riskLevel === "HIGH" || fiscalCase.riskLevel === "CRITICAL";
	const approvalRequired = highRisk || fiscalCase.autonomyLevel === "EXECUTE_AFTER_APPROVAL" || agentType === "FISCAL_REVIEWER_AGENT";

	return {
		summary: `${label} revisó el caso ${fiscalCase.title} para el periodo ${fiscalCase.scope.period} sin ejecutar acciones fiscales reales.`,
		findings: [
			`Scope verificado: companyId=${fiscalCase.scope.companyId}, RUC=${fiscalCase.scope.companyRuc}.`,
			`Riesgo base del caso: ${fiscalCase.riskLevel} (${fiscalCase.riskScore}/100).`,
			"Salida determinística para preparar revisión humana y evidencia futura.",
		],
		riskLevel: fiscalCase.riskLevel,
		confidence: highRisk ? 0.72 : 0.86,
		recommendedActions: [
			"Adjuntar evidencia primaria antes de cualquier envío o corrección fiscal.",
			"Solicitar aprobación humana si el cambio impacta SUNAT, libros o cierre mensual.",
		],
		requiredEvidence: REQUIRED_EVIDENCE[agentType],
		approvalRequired,
	};
}
