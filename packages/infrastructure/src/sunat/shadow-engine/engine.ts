import {
	generateRecommendations,
	getSectorBenchmark,
	SUNAT_RISK_RULES,
} from "../shadow-rules";
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
} from "./types";

export class ShadowSunatEngine {
	private static instance: ShadowSunatEngine;

	private constructor() {}

	public static getInstance(): ShadowSunatEngine {
		if (!ShadowSunatEngine.instance) {
			ShadowSunatEngine.instance = new ShadowSunatEngine();
		}
		return ShadowSunatEngine.instance;
	}

	async runPreAudit(data: TaxData): Promise<PreAuditResult> {
		const sectorInfo = getSectorBenchmark(data.ciiu);

		const alerts = this.evaluateRules(data);

		const areaRisks = this.calculateAreaRisks(data, alerts, sectorInfo);

		const baseProbability = 0.05;
		const addedProbability = alerts.reduce(
			(sum, alert) => sum + alert.auditProbabilityImpact,
			0,
		);
		const auditProbability = Math.min(baseProbability + addedProbability, 0.95);

		const expectedAction = this.predictSUNATAction(auditProbability, alerts);

		const recommendations = generateRecommendations(alerts);

		const overallRiskScore = Math.round(auditProbability * 100);

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
				console.warn(`Rule ${rule.id} evaluation failed`);
			}
		}

		return alerts;
	}

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

	private calculateAreaRiskScore(alerts: PreAuditAlert[]): number {
		if (alerts.length === 0) return 0;

		const baseScore = alerts.reduce(
			(sum, alert) => sum + alert.auditProbabilityImpact * 100,
			0,
		);

		return Math.min(baseScore, 100);
	}

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

	private calculatePercentile(value: number, sectorAvg: number): number {
		if (sectorAvg === 0) return 50;
		const ratio = value / sectorAvg;
		return Math.min(Math.max(ratio * 50, 0), 100);
	}

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

	private classifyRiskLevel(score: number): RiskLevel {
		if (score < 25) return "LOW";
		if (score < 50) return "MEDIUM";
		if (score < 75) return "HIGH";
		return "CRITICAL";
	}

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

	private generateId(): string {
		return `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}
}

export const shadowSunatEngine = ShadowSunatEngine.getInstance();
