/**
 * Verification types — intención↔acción verification layer.
 *
 * Cada finding de un AgentRunOutput se verifica contra el motor determinístico.
 * El VerificationReport se adjunta al output del agente (verificationReport),
 * y los findings bypassed generan entradas de auditoría obligatorias.
 *
 * @since Jul 2026
 */

/**
 * Resultado de la verificación para un finding individual.
 *
 * - pass: el finding coincide con el cálculo determinístico.
 * - fail: el finding NO coincide — discrepancia encontrada.
 * - inconclusive: no se pudo verificar (datos insuficientes, regla no aplicable).
 * - bypassed: verificación saltada porque el finding es cualitativo y ninguna regla aplicó.
 *   En zero-trust, bypassed requiere entrada de auditoría con quién y por qué.
 */
export type VerificationStatus = "pass" | "fail" | "inconclusive" | "bypassed";

/**
 * Finding verificado — status genérico para pass/fail/inconclusive.
 */
export interface VerifiedFindingBase {
	finding: string;
	status: Exclude<VerificationStatus, "bypassed">;
	rule: string;
	expected?: string;
	actual?: string;
	detail?: string;
}

/**
 * Finding verificado que fue bypassed — requiere autorización humana explícita.
 *
 * NO se puede construir desde el pipeline automático. Solo se crea cuando
 * una persona revisa y autoriza el bypass. Sin authorizedBy, el tipo no compila.
 */
export interface BypassedFinding {
	finding: string;
	status: "bypassed";
	rule: "NO_RULE_MATCHED";
	/** Código de razón del bypass */
	bypassReason:
		| "qualitative_finding"
		| "unsupported_pattern"
		| "insufficient_context"
		| "human_reviewed_acceptable";
	/**
	 * Actor humano que autorizó el bypass.
	 * Obligatorio — no existe BypassedFinding sin autor.
	 */
	authorizedBy: { userId: string; role: string };
	detail: string;
}

/**
 * Un finding verificado — puede ser pass/fail/inconclusive o bypassed.
 */
export type VerifiedFinding = VerifiedFindingBase | BypassedFinding;

/**
 * Evento de auditoría generado durante la verificación.
 * Se persiste como parte del audit trail del FiscalCaseDetails.
 */
export interface VerificationAuditEvent {
	/** Código del evento */
	eventType: "VERIFICATION_BYPASSED" | "VERIFICATION_FAIL";
	/** Finding que disparó el evento */
	finding: string;
	/** Regla aplicada */
	rule: string;
	/** Razón legible */
	reason: string;
	/** Actor humano que autorizó el bypass o detectó el fail */
	actorId: string;
	/** Timestamp ISO */
	occurredAt: string;
	/** Contexto adicional */
	detail?: string;
}

/**
 * Reporte completo de verificación para un AgentRunOutput.
 */
export interface VerificationReport {
	id: string;
	verifiedAt: string;
	adjustedConfidence: number;
	findings: VerifiedFinding[];
	/** Eventos de auditoría generados durante la verificación */
	auditEvents: VerificationAuditEvent[];
	integrityScore: number;
	summary: string;
	/** Métricas detalladas incluyendo desglose por regla */
	metrics: VerificationMetrics;
}

/**
 * Métricas agregadas del VerificationReport.
 */
export interface VerificationMetrics {
	totalFindings: number;
	passed: number;
	failed: number;
	inconclusive: number;
	bypassed: number;
	integrityScore: number;
	/**
	 * Desglose por regla — permite monitorear tasas anómalas de inconclusive.
	 * Si INTENT_ACTION_CONSISTENCY tiene % de inconclusive muy superior
	 * a otras reglas, es señal de que el agente está siendo evasivo.
	 */
	perRuleMetrics: Record<
		string,
		{
			passed: number;
			failed: number;
			inconclusive: number;
			total: number;
		}
	>;
}
