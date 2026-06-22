/**
 * Treasury Alert Agent
 *
 * Proactive agent that monitors cash flow and sends alerts when:
 * - Runway drops below critical threshold (default: 30 days)
 * - Burn rate increases significantly
 * - Large unexpected expenses detected
 *
 * Elite 2026 Vision: "Agentes Autónomos que ejecutan tareas"
 * @see docs/architecture/financial-os-masterplan.md
 */

import { fiscalTools, runToolLoop } from "@arkelythex/ai";
import { selectModelForTask } from "../ai/model-registry";

// ============================================
// TYPES
// ============================================

/**
 * TreasuryMetrics interface.
 *
 * @example
 * ```ts
 * const value: TreasuryMetrics = {} as TreasuryMetrics;
 * console.log(value);
 * ```
 */
export interface TreasuryMetrics {
	organizationId: number;
	consolidatedBalance: number; // in cents
	burnRate: number; // monthly burn rate in cents
	runway: number; // months remaining
	pendingPayables: number; // upcoming payments in cents
	pendingReceivables: number; // expected income in cents
}

/**
 * TreasuryAlert interface.
 *
 * @example
 * ```ts
 * const value: TreasuryAlert = {} as TreasuryAlert;
 * console.log(value);
 * ```
 */
export interface TreasuryAlert {
	type:
		| "runway_critical"
		| "runway_warning"
		| "burn_rate_spike"
		| "large_expense"
		| "positive_trend";
	severity: "info" | "warning" | "critical";
	title: string;
	message: string;
	suggestedActions: string[];
	metrics: {
		currentValue: number;
		threshold?: number;
		previousValue?: number;
		changePercent?: number;
	};
	createdAt: Date;
}

/**
 * TreasuryAlertConfig interface.
 *
 * @example
 * ```ts
 * const value: TreasuryAlertConfig = {} as TreasuryAlertConfig;
 * console.log(value);
 * ```
 */
export interface TreasuryAlertConfig {
	/** Runway below this (in months) triggers critical alert */
	runwayCriticalMonths: number;
	/** Runway below this (in months) triggers warning */
	runwayWarningMonths: number;
	/** Burn rate increase % that triggers alert */
	burnRateSpikePercent: number;
	/** Single expense above this (in cents) triggers review */
	largeExpenseThreshold: number;
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: TreasuryAlertConfig = {
	runwayCriticalMonths: 1,
	runwayWarningMonths: 3,
	burnRateSpikePercent: 25,
	largeExpenseThreshold: 1000000, // S/ 10,000 in cents
};

// ============================================
// ALERT GENERATION
// ============================================

/**
 * Analyze treasury metrics and generate alerts
 * @param metrics - Input for metrics.
 * @param previousMetrics - Input for previousMetrics.
 * @param config - Input for config.
 * @returns Result of analyzeTreasuryHealth.
 * @example
 * ```ts
 * const result = analyzeTreasuryHealth({} as TreasuryMetrics, {} as TreasuryMetrics, {} as TreasuryAlertConfig);
 * console.log(result);
 * ```
 */

export function analyzeTreasuryHealth(
	metrics: TreasuryMetrics,
	previousMetrics?: TreasuryMetrics,
	config: TreasuryAlertConfig = DEFAULT_CONFIG,
): TreasuryAlert[] {
	const alerts: TreasuryAlert[] = [];

	// Check runway
	if (metrics.runway <= config.runwayCriticalMonths) {
		alerts.push({
			type: "runway_critical",
			severity: "critical",
			title: "🚨 Alerta Crítica de Liquidez",
			message: `Solo quedan ${metrics.runway.toFixed(1)} meses de runway. Se requiere acción inmediata para asegurar la continuidad del negocio.`,
			suggestedActions: [
				"Revisar cuentas por cobrar vencidas y acelerar cobranza",
				"Negociar extensión de plazos con proveedores principales",
				"Considerar línea de crédito o factoring",
				"Pausar gastos no esenciales",
			],
			metrics: {
				currentValue: metrics.runway,
				threshold: config.runwayCriticalMonths,
			},
			createdAt: new Date(),
		});
	} else if (metrics.runway <= config.runwayWarningMonths) {
		alerts.push({
			type: "runway_warning",
			severity: "warning",
			title: "⚠️ Advertencia de Liquidez",
			message: `Runway de ${metrics.runway.toFixed(1)} meses. Planifica con anticipación para mantener salud financiera.`,
			suggestedActions: [
				"Revisar proyección de flujo de caja",
				"Identificar gastos que pueden reducirse",
				"Acelerar facturación pendiente",
			],
			metrics: {
				currentValue: metrics.runway,
				threshold: config.runwayWarningMonths,
			},
			createdAt: new Date(),
		});
	}

	// Check burn rate spike
	if (previousMetrics && previousMetrics.burnRate > 0) {
		const burnRateChange =
			((metrics.burnRate - previousMetrics.burnRate) /
				previousMetrics.burnRate) *
			100;

		if (burnRateChange >= config.burnRateSpikePercent) {
			alerts.push({
				type: "burn_rate_spike",
				severity: "warning",
				title: "📈 Incremento en Tasa de Gasto",
				message: `El burn rate aumentó ${burnRateChange.toFixed(0)}% respecto al período anterior. Revisa los gastos recientes.`,
				suggestedActions: [
					"Revisar gastos del último mes en detalle",
					"Identificar gastos extraordinarios vs recurrentes",
					"Actualizar presupuesto si es necesario",
				],
				metrics: {
					currentValue: metrics.burnRate,
					previousValue: previousMetrics.burnRate,
					changePercent: burnRateChange,
				},
				createdAt: new Date(),
			});
		}
	}

	// Positive trend detection
	if (
		metrics.runway >= 6 &&
		previousMetrics &&
		metrics.runway > previousMetrics.runway
	) {
		alerts.push({
			type: "positive_trend",
			severity: "info",
			title: "✅ Salud Financiera Estable",
			message: `Runway de ${metrics.runway.toFixed(1)} meses con tendencia positiva. La empresa está en buena posición.`,
			suggestedActions: [
				"Considerar inversiones estratégicas",
				"Aumentar reserva para contingencias",
			],
			metrics: {
				currentValue: metrics.runway,
				previousValue: previousMetrics.runway,
			},
			createdAt: new Date(),
		});
	}

	return alerts;
}

// ============================================
// AI-POWERED ANALYSIS
// ============================================

/**
 * Generate AI-powered recommendations based on treasury state
 * @param metrics - Input for metrics.
 * @param alerts - Input for alerts.
 * @returns Result of generateTreasuryRecommendations.
 * @example
 * ```ts
 * const result = await generateTreasuryRecommendations({} as TreasuryMetrics, []);
 * console.log(result);
 * ```
 */

export async function generateTreasuryRecommendations(
	metrics: TreasuryMetrics,
	alerts: TreasuryAlert[],
): Promise<string> {
	if (alerts.length === 0) {
		return "Situación financiera estable. No se requieren acciones inmediatas.";
	}

	const { model, modelKey } = selectModelForTask("analysis");
	console.info(`[TreasuryAgent] Generating recommendations with ${modelKey}`);

	const result = await runToolLoop({
		model,
		system: `Eres un CFO virtual experto en finanzas empresariales peruanas.
Tu rol es analizar la situación de tesorería y dar recomendaciones prácticas y accionables.
Responde en español peruano, de forma concisa y profesional.`,
		prompt: `
Analiza la siguiente situación de tesorería:

MÉTRICAS:
- Saldo Consolidado: S/ ${(metrics.consolidatedBalance / 100).toLocaleString()}
- Burn Rate Mensual: S/ ${(metrics.burnRate / 100).toLocaleString()}
- Runway: ${metrics.runway.toFixed(1)} meses
- Por Cobrar: S/ ${(metrics.pendingReceivables / 100).toLocaleString()}
- Por Pagar: S/ ${(metrics.pendingPayables / 100).toLocaleString()}

ALERTAS ACTIVAS:
${alerts.map((a) => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.message}`).join("\n")}

Proporciona un resumen ejecutivo de máximo 3 párrafos con:
1. Diagnóstico de la situación actual
2. Acciones prioritarias para los próximos 7 días
3. Estrategia para los próximos 30 días
`.trim(),
		tools: {
			validateRUC: fiscalTools.validateRUC,
			calculateIGV: fiscalTools.calculateIGV,
			calculateDetraction: fiscalTools.calculateDetraction,
		},
		maxSteps: 5,
	});

	return result.text;
}

// ============================================
// NOTIFICATION HELPERS
// ============================================

/**
 * NotificationPayload interface.
 *
 * @example
 * ```ts
 * const value: NotificationPayload = {} as NotificationPayload;
 * console.log(value);
 * ```
 */
export interface NotificationPayload {
	channel: "email" | "whatsapp" | "in_app";
	recipient: string;
	subject: string;
	body: string;
	priority: "low" | "normal" | "high" | "urgent";
}

/**
 * Format alert for notification
 * @param alert - Input for alert.
 * @param organizationName - Input for organizationName.
 * @returns Result of formatAlertNotification.
 * @example
 * ```ts
 * const result = formatAlertNotification({} as TreasuryAlert, "");
 * console.log(result);
 * ```
 */

export function formatAlertNotification(
	alert: TreasuryAlert,
	organizationName: string,
): NotificationPayload {
	const priorityMap: Record<
		TreasuryAlert["severity"],
		NotificationPayload["priority"]
	> = {
		info: "low",
		warning: "normal",
		critical: "urgent",
	};

	return {
		channel: alert.severity === "critical" ? "whatsapp" : "email",
		recipient: "", // To be filled by notification service
		subject: `[${organizationName}] ${alert.title}`,
		body: `
${alert.message}

Acciones Sugeridas:
${alert.suggestedActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

---
Generado automáticamente por Arkelythex Treasury Agent
    `.trim(),
		priority: priorityMap[alert.severity],
	};
}
