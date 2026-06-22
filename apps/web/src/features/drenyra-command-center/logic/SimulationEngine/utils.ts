/**
 * SimulationEngine — Funciones auxiliares de detección y generación.
 *
 * @since Jun 2026
 */

import type { SimulationCategory, SimulationParam, SimulatedAccount } from "./types";
import { CATEGORY_KEYWORDS, TAX_RATE, RENTA_RATE } from "./constants";

// ── Extract percentage ──────────────────────────────────────────────────────

export function extractPercent(text: string): number {
	const match = text.match(/(\d+)\s*%/);
	if (match) return Math.max(1, Math.min(200, parseInt(match[1], 10)));
	// Default per category
	if (/salarios?|sueldos?|planilla/i.test(text)) return 10;
	if (/ventas?|ingresos?/i.test(text)) return 15;
	if (/gastos?|costos?/i.test(text)) return 8;
	if (/igv|impuestos?/i.test(text)) return 2;
	if (/inversión|inversion|invertir/i.test(text)) return 20;
	return 10;
}

// ── Detect category ─────────────────────────────────────────────────────────

export function detectCategory(text: string): SimulationCategory {
	for (const [category, patterns] of Object.entries(CATEGORY_KEYWORDS)) {
		for (const regex of patterns) {
			if (regex.test(text)) return category as SimulationCategory;
		}
	}
	return "expense";
}

// ── Detect direction (increase/decrease) ────────────────────────────────────

export function detectDirection(text: string): "increase" | "decrease" {
	if (/subir|aumento|incremento|aumentar|incrementar/i.test(text)) return "increase";
	if (/bajar|reducción|reduccion|disminución|disminucion|disminuir|reducir/i.test(text)) return "decrease";
	return "increase";
}

// ── Detect parameter (what is changing) ─────────────────────────────────────

export function detectParameter(text: string): string {
	const paramMatches = [
		/salarios?|sueldos?|planilla/,
		/ventas?|ingresos?|facturación/,
		/gastos?|costos?|proveedores?/,
		/igv|impuestos?|tributos?/,
		/inversión|inversion|capital/,
	];
	for (const regex of paramMatches) {
		const match = text.match(regex);
		if (match) return match[0].toLowerCase();
	}
	return "gastos operativos";
}

// ── Generate account entries per category ───────────────────────────────────

export function generateAccounts(param: SimulationParam): SimulatedAccount[] {
	const baseMultiplier = param.changePercent / 100;
	const isIncrease = param.direction === "increase";
	const sign = isIncrease ? 1 : -1;

	switch (param.category) {
		case "salary": {
			const factor = 1 + sign * baseMultiplier;
			return [
				{ account: "62", name: "Gastos de Personal, Directores y Gerentes", debit: Math.round(85000 * factor), credit: 0 },
				{ account: "621", name: "Sueldos y Salarios", debit: Math.round(62000 * factor), credit: 0 },
				{ account: "627", name: "Seguridad Social y Contribuciones", debit: Math.round(12000 * factor), credit: 0 },
				{ account: "629", name: "Compensación por Tiempo de Servicios", debit: Math.round(8000 * factor), credit: 0 },
				{ account: "40", name: "Tributos por Pagar (ESSALUD/ONP)", debit: 0, credit: Math.round(11000 * factor) },
				{ account: "41", name: "Remuneraciones por Pagar", debit: 0, credit: Math.round(74000 * factor) },
			];
		}
		case "revenue": {
			const factor = 1 + sign * baseMultiplier;
			return [
				{ account: "70", name: "Ventas", debit: 0, credit: Math.round(380000 * factor) },
				{ account: "701", name: "Ventas Gravadas", debit: 0, credit: Math.round(320000 * factor) },
				{ account: "702", name: "Ventas Exoneradas", debit: 0, credit: Math.round(60000 * factor) },
				{ account: "12", name: "Cuentas por Cobrar Comerciales", debit: Math.round(95000 * factor), credit: 0 },
				{ account: "10", name: "Efectivo y Equivalentes", debit: Math.round(285000 * factor), credit: 0 },
			];
		}
		case "expense": {
			const factor = 1 + sign * baseMultiplier;
			return [
				{ account: "60", name: "Compras", debit: Math.round(210000 * factor), credit: 0 },
				{ account: "601", name: "Mercaderías", debit: Math.round(150000 * factor), credit: 0 },
				{ account: "603", name: "Suministros Diversos", debit: Math.round(30000 * factor), credit: 0 },
				{ account: "609", name: "Costos Vinculados con Compras", debit: Math.round(30000 * factor), credit: 0 },
				{ account: "42", name: "Cuentas por Pagar Comerciales", debit: 0, credit: Math.round(210000 * factor) },
			];
		}
		case "tax": {
			const factor = 1 + (isIncrease ? 1 : -1) * baseMultiplier;
			return [
				{ account: "4011", name: "IGV por Pagar", debit: 0, credit: Math.round(28000 * factor) },
				{ account: "4017", name: "Impuesto a la Renta por Pagar", debit: 0, credit: Math.round(22000 * factor) },
				{ account: "40", name: "Tributos por Pagar", debit: 0, credit: Math.round(50000 * factor) },
				{ account: "64", name: "Gastos por Tributos", debit: Math.round(50000 * factor), credit: 0 },
			];
		}
		case "investment": {
			const factor = 1 + (isIncrease ? 1 : -1) * baseMultiplier;
			return [
				{ account: "33", name: "Inmuebles, Maquinaria y Equipo", debit: Math.round(150000 * factor), credit: 0 },
				{ account: "34", name: "Intangibles", debit: Math.round(30000 * factor), credit: 0 },
				{ account: "46", name: "Cuentas por Pagar Diversas", debit: 0, credit: Math.round(180000 * factor) },
				{ account: "68", name: "Depreciación y Amortización", debit: Math.round(12000 * factor), credit: 0 },
			];
		}
	}
}

// ── Build before/after comparison ─────────────────────────────────────────

export function buildBeforeAfter(accounts: SimulatedAccount[], param: SimulationParam) {
	const totalBefore = accounts.reduce((sum, a) => sum + a.debit + a.credit, 0);
	const isIncrease = param.direction === "increase";
	const sign = isIncrease ? 1 : -1;
	const changeFactor = param.changePercent / 100;

	const items = [
		{
			label: `${param.label} (Total)`,
			before: totalBefore,
			after: Math.round(totalBefore * (1 + sign * changeFactor)),
			delta: Math.round(totalBefore * sign * changeFactor),
			deltaPercent: param.changePercent * sign,
		},
		{
			label: "IGV 18% Afecto",
			before: Math.round(totalBefore * TAX_RATE),
			after: Math.round(totalBefore * (1 + sign * changeFactor) * TAX_RATE),
			delta: Math.round(totalBefore * sign * changeFactor * TAX_RATE),
			deltaPercent: param.changePercent * sign,
		},
		{
			label: "Impuesto a la Renta Estimado",
			before: Math.round(totalBefore * RENTA_RATE * 0.3),
			after: Math.round(totalBefore * (1 + sign * changeFactor) * RENTA_RATE * 0.3),
			delta: Math.round(totalBefore * sign * changeFactor * RENTA_RATE * 0.3),
			deltaPercent: param.changePercent * sign,
		},
		{
			label: "Resultado Neto Proyectado",
			before: Math.round(totalBefore * 0.12),
			after: Math.round(totalBefore * (1 + sign * changeFactor) * 0.12),
			delta: Math.round(totalBefore * sign * changeFactor * 0.12),
			deltaPercent: param.changePercent * sign,
		},
	];

	return items;
}
