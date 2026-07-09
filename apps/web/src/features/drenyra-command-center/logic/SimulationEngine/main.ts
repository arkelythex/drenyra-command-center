/**
 * SimulationEngine — Motor de simulación predictiva local.
 *
 * Detecta intenciones de "qué pasaría si" en el chat y genera
 * datos financieros simulados como HubArtifact.
 *
 * MVP: usa datos generados localmente. En producción, el AI backend
 * haría predicciones reales sobre los datos del cliente.
 *
 * @since Jun 2026
 */

import type {
	HubArtifact,
	LedgerEntry,
} from "@/features/cognitive-hub/types/hub.types";
import { PREDICTIVE_PATTERNS } from "./constants";
import type { SimulationParam } from "./types";
import {
	buildBeforeAfter,
	detectCategory,
	detectDirection,
	detectParameter,
	extractPercent,
	generateAccounts,
} from "./utils";

// ── Main parse function ─────────────────────────────────────────────────────

export function parseSimulationIntent(text: string): SimulationParam | null {
	const isPredictive = PREDICTIVE_PATTERNS.some((p) => p.test(text));
	if (!isPredictive && !text.startsWith("/simular")) return null;

	const category = detectCategory(text);
	const direction = detectDirection(text);
	const changePercent = extractPercent(text);
	const parameter = detectParameter(text);

	const directionLabel = direction === "increase" ? "aumento" : "reducción";
	const labelMap: Record<SimulationParam["category"], string> = {
		salary: "Planilla",
		revenue: "Ingresos",
		expense: "Gastos Operativos",
		tax: "Tributos",
		investment: "Inversiones",
	};

	return {
		category,
		label: `${labelMap[category]}: ${parameter}`,
		changePercent,
		direction,
		parameter,
		summaryLine: `Simulación: ${directionLabel} del ${changePercent}% en ${parameter}`,
	};
}

// ── Generate simulation artifact ────────────────────────────────────────────

export function generateSimulationArtifact(
	param: SimulationParam,
): HubArtifact {
	const accounts = generateAccounts(param);
	const _beforeAfter = buildBeforeAfter(accounts, param);
	const directionLabel =
		param.direction === "increase" ? "incremento" : "reducción";
	const emoji = param.direction === "increase" ? "📈" : "📉";

	const entries: LedgerEntry[] = accounts.map((a) => ({
		account: `${a.account} (${a.name})`,
		debit: a.debit,
		credit: a.credit,
	}));

	return {
		id: `sim-${crypto.randomUUID().slice(0, 8)}`,
		type: "simulation",
		title: `${emoji} ${directionLabel} del ${param.changePercent}% en ${param.parameter}`,
		payload: {
			entries,
		},
	};
}

// ── Generate summary text ──────────────────────────────────────────────────

export function generateSimulationSummary(param: SimulationParam): string {
	const dir = param.direction === "increase" ? "Aumento" : "Reducción";
	const accounts = generateAccounts(param);
	const beforeAfter = buildBeforeAfter(accounts, param);
	const total = beforeAfter[0];
	const neto = beforeAfter[3];

	return (
		`## 📊 ${dir} del ${param.changePercent}% en ${param.parameter}\n\n` +
		`### Impacto en cuentas contables\n\n` +
		`Se generaron ${accounts.length} asientos contables afectando las cuentas de ` +
		`${param.category === "salary" ? "planilla" : param.category === "revenue" ? "ingresos" : param.category === "expense" ? "gastos" : param.category === "tax" ? "tributos" : "inversiones"}. ` +
		`El movimiento total proyectado es de ${total.after.toLocaleString()} soles ` +
		`(${total.delta > 0 ? "+" : ""}${total.delta.toLocaleString()} vs actual).\n\n` +
		`### Proyecciones\n\n` +
		`| Concepto | Antes | Después | Δ |\n` +
		`|---|---|---|---|\n` +
		`${beforeAfter.map((ba) => `| ${ba.label} | ${ba.before.toLocaleString()} | ${ba.after.toLocaleString()} | ${ba.delta > 0 ? "+" : ""}${ba.delta.toLocaleString()} (${ba.deltaPercent > 0 ? "+" : ""}${ba.deltaPercent}%) |`).join("\n")}` +
		`\n\n` +
		`**Resultado Neto Proyectado**: ${neto.after.toLocaleString()} soles ` +
		`(${neto.delta > 0 ? "+" : ""}${neto.delta.toLocaleString()} vs actual).\n\n` +
		`*Simulación generada localmente. Los resultados son estimaciones preliminares.*`
	);
}
