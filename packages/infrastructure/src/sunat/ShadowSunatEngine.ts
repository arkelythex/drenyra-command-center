/**
 * Shadow SUNAT Engine
 * Motor de simulación de fiscalización pre-auditoría
 * @module infrastructure/sunat/ShadowSunatEngine
 */

import {
	generateRecommendations,
	getSectorBenchmark,
	SUNAT_RISK_RULES,
} from "./ShadowSunatRules";
import type {
	AreaMetric,
	AreaRiskAssessment,
	PreAuditAlert,
	PreAuditResult,
	RiskLevel,
	SectorBenchmark,
	SUNATExpectedAction,
	TaxArea,
	TaxData,
} from "./types/shadow-sunat";

// ============================================================================
// SHADOW SUNAT ENGINE
// ============================================================================

/**
 * Motor de pre-auditoría Shadow SUNAT
 * Simula cómo SUNAT evaluaría los datos tributarios
 * @example
 * ```ts
 * const value = new ShadowSunatEngine();
 * console.log(value);
 * ```
 */

export class ShadowSunatEngine {
	private static instance: ShadowSunatEngine;

	private constructor() {}

	public static getInstance(): ShadowSunatEngine {
		if (!ShadowSunatEngine.instance) {
			ShadowSunatEngine.instance = new ShadowSunatEngine();
		}
		return ShadowSunatEngine.instance;
	}

	// ══════════════════════════════════════════════════════════════════════════
	// PUBLIC API
	// ══════════════════════════════════════════════════════════════════════════

	/**
	 * Ejecuta análisis pre-auditoría completo
	 */
	async runPreAudit(data: TaxData): Promise<PreAuditResult> {
		// 1. Obtener benchmarks del sector
		const sectorInfo = getSectorBenchmark(data.ciiu);

		// 2. Evaluar cada regla
		const alerts = this.evaluateRules(data);

		// 3. Calcular riesgo por área
		const areaRisks = this.calculateAreaRisks(data, alerts, sectorInfo);

		// 4. Calcular probabilidad de auditoría
		const baseProbability = 0.05; // 5% base
		const addedProbability = alerts.reduce(
			(sum, alert) => sum + alert.auditProbabilityImpact,
			0,
		);
		const auditProbability = Math.min(baseProbability + addedProbability, 0.95);

		// 5. Determinar acción esperada
		const expectedAction = this.predictSUNATAction(auditProbability, alerts);

		// 6. Generar recomendaciones
		const recommendations = generateRecommendations(alerts);

		// 7. Calcular score general
		const overallRiskScore = Math.round(auditProbability * 100);

		// 8. Construir benchmark de sector
		const sectorBenchmark = this.buildSectorBenchmark(data, sectorInfo);

		return {
			id: this.generateId(),
			organizationId: data.organizationId,
			fiscalYear: data.fiscalYear,
			period: data.period,
			analysisDate: new Date(),
			overallRiskScore,
			riskLevel: this.classifyRiskLevel(overallRiskScore),
			auditProbability,
			expectedAction,
			areaRisks,
			alerts,
			recommendations,
			sectorBenchmark,
		};
	}

	/**
	 * Genera explicación en texto del resultado
	 */
	generateExplanation(result: PreAuditResult): string {
		let message = `## ⚠️ Análisis Pre-Auditoría: Riesgo ${result.riskLevel}\n\n`;

		message += `**Score de Riesgo:** ${result.overallRiskScore}/100\n`;
		message += `**Probabilidad de Fiscalización:** ${(result.auditProbability * 100).toFixed(1)}%\n`;
		message += `**Acción SUNAT Esperada:** ${this.formatExpectedAction(result.expectedAction)}\n\n`;

		if (result.alerts.length > 0) {
			message += `### 🚨 Alertas Detectadas\n\n`;
			for (const alert of result.alerts) {
				const icon = alert.severity === "CRITICAL" ? "🔴" : "🟡";
				message += `${icon} **${alert.title}** (${alert.severity})\n`;
				message += `   ${alert.description}\n`;
				message += `   📖 Base: ${alert.legalBasis}\n\n`;
			}
		}

		if (result.recommendations.length > 0) {
			message += `### ✅ Recomendaciones\n\n`;
			for (const rec of result.recommendations) {
				message += `- [${rec.priority}] ${rec.action}\n`;
				message += `  Reducción de riesgo estimada: ${rec.riskReductionEstimate}%\n\n`;
			}
		}

		return message;
	}

	// ══════════════════════════════════════════════════════════════════════════
	// PRIVATE METHODS
	// ══════════════════════════════════════════════════════════════════════════

	/**
	 * Evalúa todas las reglas contra los datos
	 */
	private evaluateRules(data: TaxData): PreAuditAlert[] {
		const alerts: PreAuditAlert[] = [];

		for (const rule of SUNAT_RISK_RULES) {
			try {
				const triggered = rule.condition(data);

				if (triggered) {
					alerts.push({
						id: rule.id,
						area: rule.area,
						severity: rule.severity,
						title: rule.name,
						description: rule.description,
						legalBasis: rule.legalBasis,
						auditProbabilityImpact: rule.auditImpact,
					});
				}
			} catch {
				// Si una regla falla, continuar con las demás
				console.warn(`Rule ${rule.id} evaluation failed`);
			}
		}

		return alerts;
	}

	/**
	 * Calcula riesgo por área tributaria
	 */
	private calculateAreaRisks(
		data: TaxData,
		alerts: PreAuditAlert[],
		sectorInfo: { name: string; marginBruto: number; creditRatio: number },
	): AreaRiskAssessment[] {
		const areas = [...new Set(SUNAT_RISK_RULES.map((r) => r.area))];
		const areaRisks: AreaRiskAssessment[] = [];

		for (const area of areas) {
			const areaAlerts = alerts.filter((a) => a.area === area);
			const riskScore = this.calculateAreaRiskScore(areaAlerts);

			areaRisks.push({
				area,
				riskScore,
				riskLevel: this.classifyRiskLevel(riskScore),
				findings: areaAlerts.map((a) => a.description),
				metrics: this.getAreaMetrics(data, area, sectorInfo),
			});
		}

		return areaRisks.sort((a, b) => b.riskScore - a.riskScore);
	}

	/**
	 * Calcula score de riesgo de un área
	 */
	private calculateAreaRiskScore(alerts: PreAuditAlert[]): number {
		if (alerts.length === 0) return 0;

		const baseScore = alerts.reduce(
			(sum, alert) => sum + alert.auditProbabilityImpact * 100,
			0,
		);

		return Math.min(baseScore, 100);
	}

	/**
	 * Obtiene métricas de un área
	 */
	private getAreaMetrics(
		data: TaxData,
		area: TaxArea,
		sectorInfo: { marginBruto: number; creditRatio: number },
	): AreaMetric[] {
		const metrics: AreaMetric[] = [];

		switch (area) {
			case "IGV_CREDITO_FISCAL": {
				const creditRatio =
					data.debitoFiscal > 0
						? (data.creditoFiscal / data.debitoFiscal) * 100
						: 0;
				metrics.push({
					name: "Ratio Crédito/Débito",
					value: creditRatio,
					sectorAverage: sectorInfo.creditRatio,
					deviation: creditRatio - sectorInfo.creditRatio,
					threshold: 90,
					isSuspicious: creditRatio > 90,
				});
				break;
			}

			case "RATIOS_FINANCIEROS": {
				metrics.push({
					name: "Margen Bruto",
					value: data.margenBruto,
					sectorAverage: sectorInfo.marginBruto,
					deviation: data.margenBruto - sectorInfo.marginBruto,
					threshold: sectorInfo.marginBruto * 0.5,
					isSuspicious: data.margenBruto < sectorInfo.marginBruto * 0.5,
				});
				break;
			}

			case "BANCARIZACION": {
				const gastosSinBancarizarSoles = data.gastosSinBancarizar / 100;
				metrics.push({
					name: "Gastos sin Bancarizar",
					value: gastosSinBancarizarSoles,
					sectorAverage: 0,
					deviation: gastosSinBancarizarSoles,
					threshold: 2000,
					isSuspicious: gastosSinBancarizarSoles > 2000,
				});
				break;
			}
		}

		return metrics;
	}

	/**
	 * Construye benchmark de sector
	 */
	private buildSectorBenchmark(
		data: TaxData,
		sectorInfo: { name: string; marginBruto: number; creditRatio: number },
	): SectorBenchmark {
		const creditRatioCompany =
			data.debitoFiscal > 0
				? (data.creditoFiscal / data.debitoFiscal) * 100
				: 0;

		return {
			sectorCode: data.ciiu,
			sectorName: sectorInfo.name,
			marginBruteSector: sectorInfo.marginBruto,
			marginBruteCompany: data.margenBruto,
			marginDeviation: data.margenBruto - sectorInfo.marginBruto,
			creditRatioSector: sectorInfo.creditRatio,
			creditRatioCompany,
			creditDeviation: creditRatioCompany - sectorInfo.creditRatio,
			percentilePosition: this.calculatePercentile(
				data.margenBruto,
				sectorInfo.marginBruto,
			),
			suspiciousThreshold: sectorInfo.marginBruto * 0.5,
		};
	}

	/**
	 * Calcula posición en percentil (simplificado)
	 */
	private calculatePercentile(value: number, sectorAvg: number): number {
		if (sectorAvg === 0) return 50;
		const ratio = value / sectorAvg;
		return Math.min(Math.max(ratio * 50, 0), 100);
	}

	/**
	 * Predice la acción que tomará SUNAT
	 */
	private predictSUNATAction(
		probability: number,
		alerts: PreAuditAlert[],
	): SUNATExpectedAction {
		const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL");

		if (probability < 0.1) return "NONE";
		if (probability < 0.25) return "CARTA_INDUCTIVA";
		if (probability < 0.5) return "REQUERIMIENTO";
		if (probability < 0.75) return "VERIFICACION";
		if (criticalAlerts.length >= 3) return "FISCALIZACION_DEFINITIVA";
		return "FISCALIZACION_PARCIAL";
	}

	/**
	 * Clasifica nivel de riesgo
	 */
	private classifyRiskLevel(score: number): RiskLevel {
		if (score < 25) return "LOW";
		if (score < 50) return "MEDIUM";
		if (score < 75) return "HIGH";
		return "CRITICAL";
	}

	/**
	 * Formatea acción esperada para UI
	 */
	private formatExpectedAction(action: SUNATExpectedAction): string {
		const labels: Record<SUNATExpectedAction, string> = {
			NONE: "Sin acción esperada",
			CARTA_INDUCTIVA: "Carta Inductiva",
			REQUERIMIENTO: "Requerimiento de Información",
			VERIFICACION: "Verificación de Campo",
			FISCALIZACION_PARCIAL: "Fiscalización Parcial",
			FISCALIZACION_DEFINITIVA: "Fiscalización Definitiva",
		};
		return labels[action];
	}

	/**
	 * Genera ID único
	 */
	private generateId(): string {
		return `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}
}

// Export singleton
/**
 * shadowSunatEngine const.
 *
 * @example
 * ```ts
 * console.log(shadowSunatEngine);
 * ```
 */
export const shadowSunatEngine = ShadowSunatEngine.getInstance();
