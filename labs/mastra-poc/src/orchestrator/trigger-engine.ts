/**
 * Trigger Engine — Fiscal Trigger Rules
 *
 * Inspirado en las Agent Trigger Rules de Gentle-AI.
 * Donde Gentle-AI tiene T1 (pre-commit), T2 (pre-pr), T3 (post-sdd-phase),
 * Drenyra tiene triggers fiscales:
 *
 * T1 — Advisory (operaciones cotidianas)
 *   - Facturas < S/ 1,000
 *   - Validación de CPE rutinaria
 *   - Clasificación PCGE automática
 *
 * T2 — Strong (operaciones sensibles)
 *   - Monto > S/ 10,000
 *   - Detección de detracción/retención
 *   - Envío a SUNAT
 *
 * T3 — Critical (operaciones que requieren humano)
 *   - Discrepancias > 5% en conciliación
 *   - Modificación datos maestros fiscales
 *   - Cierre contable mensual/anual
 *   - Primera operación con un RUC nuevo
 */

import type { FiscalDocument, Tenant } from "./drenyra-orchestrator";
import type { FiscalCapability } from "./fiscal-registry";

// ─── Types ───────────────────────────────────────────────

export type TriggerLevel = "T1_advisory" | "T2_strong" | "T3_critical";

export interface TriggerContext {
	documentType: string;
	document: FiscalDocument;
	tenant: Tenant;
	capabilities: FiscalCapability[];
}

export interface TriggerDecision {
	level: TriggerLevel;
	reason: string;
	requiredGates: string[];
	humanRequired: boolean;
}

// ─── Trigger Rules ─────────────────────────────────────

interface TriggerRule {
	id: string;
	name: string;
	tier: TriggerLevel;
	check: (ctx: TriggerContext) => boolean;
	reason: string;
}

const triggerRules: TriggerRule[] = [
	// ── TIER 1: Advisory ──────────────────────────────────
	{
		id: "low-value-invoice",
		name: "Factura de bajo monto",
		tier: "T1_advisory",
		check: (ctx) => {
			const amount = extractAmount(ctx.document);
			return amount > 0 && amount < 10_000; // < S/ 100
		},
		reason: "Monto bajo — procesamiento automático",
	},
	{
		id: "routine-validation",
		name: "Validación CPE rutinaria",
		tier: "T1_advisory",
		check: (ctx) =>
			ctx.documentType === "invoice" || ctx.documentType === "bill",
		reason: "Documento estándar — validación automática",
	},

	// ── TIER 2: Strong ────────────────────────────────────
	{
		id: "medium-value",
		name: "Monto medio",
		tier: "T2_strong",
		check: (ctx) => {
			const amount = extractAmount(ctx.document);
			return amount >= 10_000 && amount < 10_000_00; // S/ 100 - S/ 10,000
		},
		reason: "Monto medio — requiere fiscal gate",
	},
	{
		id: "detraction-candidate",
		name: "Posible detracción",
		tier: "T2_strong",
		check: (ctx) => {
			// Servicios, construcciones, etc. son candidatos a detracción
			const text = JSON.stringify(ctx.document.metadata).toLowerCase();
			return /servicio|construccion|proveedor|comision/i.test(text);
		},
		reason: "Operación sujeta a posible detracción — requiere verificación",
	},
	{
		id: "sunat-submission",
		name: "Envío a SUNAT",
		tier: "T2_strong",
		check: (ctx) =>
			ctx.documentType === "credit-note" || ctx.documentType === "debit-note",
		reason: "Nota de crédito/débito — requiere compliance check",
	},

	// ── TIER 3: Critical ──────────────────────────────────
	{
		id: "high-value",
		name: "Alto valor",
		tier: "T3_critical",
		check: (ctx) => {
			const amount = extractAmount(ctx.document);
			return amount >= 10_000_00; // >= S/ 10,000
		},
		reason: "Monto > S/ 10,000 — requiere aprobación humana",
	},
	{
		id: "first-operation",
		name: "Primera operación del RUC",
		tier: "T3_critical",
		check: (ctx) => {
			// Si el tenant no tiene historial, es primera operación
			return ctx.capabilities.length === 0;
		},
		reason: "Primera operación con este RUC — requiere verificación manual",
	},
	{
		id: "month-close",
		name: "Cierre contable",
		tier: "T3_critical",
		check: (ctx) => {
			const period = ctx.tenant.period;
			if (!period) return false;
			// Si el período cambió, probablemente es cierre
			return true;
		},
		reason: "Operación de cierre de período — requiere auditoría completa",
	},
	{
		id: "master-data-change",
		name: "Cambio datos maestros",
		tier: "T3_critical",
		check: (ctx) =>
			ctx.documentType === "guia" ||
			/master|registro|config/i.test(ctx.document.type),
		reason:
			"Modificación de datos maestros fiscales — requiere aprobación humana",
	},
];

// ─── Engine ──────────────────────────────────────────────

export const triggerEngine = {
	/**
	 * Evalúa qué nivel de trigger aplicar a un documento fiscal.
	 * La regla más estricta gana (T3 > T2 > T1).
	 */
	async evaluate(context: TriggerContext): Promise<TriggerDecision> {
		const matched: TriggerRule[] = [];

		for (const rule of triggerRules) {
			try {
				if (rule.check(context)) {
					matched.push(rule);
				}
			} catch {}
		}

		// Determinar el nivel más estricto
		const tiers: TriggerLevel[] = ["T3_critical", "T2_strong", "T1_advisory"];
		let highestLevel: TriggerLevel = "T1_advisory";
		let reasons: string[] = [];

		for (const rule of matched) {
			const ruleIndex = tiers.indexOf(rule.tier);
			const currentIndex = tiers.indexOf(highestLevel);
			if (ruleIndex < currentIndex) {
				highestLevel = rule.tier;
			}
			reasons.push(rule.reason);
		}

		if (matched.length === 0) {
			// Default: T1 advisory
			reasons = ["Documento estándar sin reglas específicas"];
		}

		return {
			level: highestLevel,
			reason: reasons.join("; "),
			requiredGates: matched.map((r) => r.id),
			humanRequired: highestLevel === "T3_critical",
		};
	},
};

// ─── Helper ─────────────────────────────────────────────

function extractAmount(doc: FiscalDocument): number {
	const meta = doc.metadata;
	const possibleFields = [
		"amount",
		"total",
		"amountCents",
		"totalCents",
		"igv",
		"subtotal",
	];
	for (const field of possibleFields) {
		const val = (meta as Record<string, unknown>)[field];
		if (typeof val === "number") return val;
		if (typeof val === "string") {
			const parsed = Number(val);
			if (!Number.isNaN(parsed)) return parsed;
		}
	}
	return 0;
}
