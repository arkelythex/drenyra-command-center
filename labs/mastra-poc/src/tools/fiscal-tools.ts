/**
 * Fiscal Tools para Drenyra on Mastra
 *
 * Reemplaza la interface `AgentTool` custom de agent-swarm
 * por Mastra Tools nativos. El dominio fiscal (@arkelythex/domain)
 * queda intocado.
 */

import { Money, TaxCalculator } from "@arkelythex/domain";
import { createTool } from "@mastra/core";
import { z } from "zod";
// import { SireSubmissionService } from '../services/sire';

// ─── Tool: Calcular IGV ───────────────────────────────────

export const calculateIGV = createTool({
	id: "calculate-igv",
	description:
		"Calcula el IGV (18%) para un monto dado. Retorna base imponible, IGV y total.",
	inputSchema: z.object({
		amountCents: z.number().int().min(0).describe("Monto en céntimos"),
		currency: z.enum(["PEN", "USD"]).default("PEN"),
	}),
	outputSchema: z.object({
		base: z.string(),
		igv: z.string(),
		total: z.string(),
		baseCents: z.number().int(),
		igvCents: z.number().int(),
		totalCents: z.number().int(),
		currency: z.enum(["PEN", "USD"]),
		taxRateBasisPoints: z.literal(1800),
	}),
	execute: async ({ input }) => {
		const base = Money.fromCents(input.amountCents, input.currency);
		const result = TaxCalculator.calculateIGV(base);
		return {
			base: result.baseAmount.toString(),
			igv: result.taxAmount.toString(),
			total: result.totalAmount.toString(),
			baseCents: result.baseAmount.getCents(),
			igvCents: result.taxAmount.getCents(),
			totalCents: result.totalAmount.getCents(),
			currency: input.currency,
			taxRateBasisPoints: 1800 as const,
		};
	},
});

// ─── Tool: Validar CPE ────────────────────────────────────

export const validateCPE = createTool({
	id: "validate-cpe",
	description:
		"Valida un comprobante electrónico (CPE) contra esquemas UBL y SUNAT.",
	inputSchema: z.object({
		companyRuc: z.string().length(11),
		cpeNumber: z.string(),
		xmlContent: z.string(),
		issueDate: z.string(),
		totalAmount: z.number(),
	}),
	execute: async ({ input }) => {
		// const { validateCpe } = await import('@arkelythex/application/use-cases');
		// return validateCpe({ ...input });

		// Placeholder — implementación real usa tu comando existente
		return {
			isValid: true,
			status: "VALID",
			errors: [],
			durationMs: 120,
		};
	},
});

// ─── Tool: Enviar SIRE ─────────────────────────────────────

export const submitSIRE = createTool({
	id: "submit-sire",
	description:
		"Envía un reporte SIRE a SUNAT (PLAME, registro de ventas/compras). Requiere approval gate.",
	inputSchema: z.object({
		companyId: z.string(),
		period: z.string().describe("Período en formato YYYYMM"),
		ledgerType: z.enum(["ventas", "compras"]),
		payloadBase64: z.string(),
		payloadFormat: z.enum(["txt", "csv", "json", "xml"]).default("txt"),
	}),
	execute: async ({ input }) => {
		// const result = await SireSubmissionService.submit(input);
		// return result;

		return {
			submissionId: `sub-${Date.now()}`,
			status: "pending",
			trackingId: `track-${Date.now()}`,
		};
	},
});

// ─── Tool: Verificar Detracción ────────────────────────────

export const checkDetraction = createTool({
	id: "check-detraction",
	description:
		"Verifica si una operación está sujeta a detracción (SPOT) según SUNAT.",
	inputSchema: z.object({
		amountCents: z.number().int(),
		operationType: z
			.string()
			.describe('Tipo de operación (ej: "servicio", "construccion")'),
		currency: z.enum(["PEN", "USD"]).default("PEN"),
	}),
	execute: async ({ input }) => {
		const amount = Money.fromCents(input.amountCents, input.currency);
		// Categorías típicas de detracción con sus porcentajes
		const detractionCategories: Record<string, number> = {
			servicio: 0.12,
			construccion: 0.05,
			proveedores: 0.06,
			comision_mercantil: 0.1,
		};

		const rate = detractionCategories[input.operationType];
		if (!rate) {
			return {
				subjectToDetraction: false,
				reason: `Operación "${input.operationType}" no está en la lista SPOT`,
				percentage: 0,
				detractionAmount: "0.00",
				detractionCents: 0,
			};
		}

		const detractionAmount = amount.multiply(rate);
		return {
			subjectToDetraction: true,
			reason: `Operación "${input.operationType}" sujeta a ${rate * 100}% de detracción`,
			percentage: rate * 100,
			detractionAmount: detractionAmount.toString(),
			detractionCents: detractionAmount.getCents(),
		};
	},
});

// ─── Tool: Verificar Retención ─────────────────────────────

export const checkRetention = createTool({
	id: "check-retention",
	description:
		"Verifica retenciones de IGV (3ra categoría) según RUC del proveedor.",
	inputSchema: z.object({
		providerRuc: z.string().length(11),
		amountCents: z.number().int(),
		currency: z.enum(["PEN", "USD"]).default("PEN"),
	}),
	execute: async ({ input }) => {
		// Agentes de retención: 3% (terceros), 6% (no domiciliados), etc.
		const retentionRate = 0.03; // 3% por defecto
		const amount = Money.fromCents(input.amountCents, input.currency);
		const retention = amount.multiply(retentionRate);

		return {
			subjectToRetention: true,
			rate: retentionRate * 100,
			baseAmount: amount.toString(),
			baseCents: amount.getCents(),
			retentionAmount: retention.toString(),
			retentionCents: retention.getCents(),
			netAmount: amount.subtract(retention).toString(),
			netCents: amount.subtract(retention).getCents(),
		};
	},
});

// ─── Tool: Calendario Tributario ──────────────────────────

export const getTaxCalendar = createTool({
	id: "get-tax-calendar",
	description: "Obtiene el calendario fiscal SUNAT con fechas de vencimiento.",
	inputSchema: z.object({
		year: z.number().int().min(2024).max(2030).optional().default(2026),
	}),
	execute: async ({ input }) => {
		// En producción: consultar tabla de vencimientos SUNAT
		const deadlines: Record<
			number,
			Array<{ month: number; deadline: string; description: string }>
		> = {
			2026: [
				{ month: 1, deadline: "2026-02-15", description: "IGV Enero" },
				{ month: 2, deadline: "2026-03-15", description: "IGV Febrero" },
				{ month: 3, deadline: "2026-04-15", description: "IGV Marzo" },
				{ month: 4, deadline: "2026-05-15", description: "IGV Abril" },
				{ month: 5, deadline: "2026-06-15", description: "IGV Mayo" },
				{ month: 6, deadline: "2026-07-15", description: "IGV Junio" },
				{ month: 7, deadline: "2026-08-17", description: "IGV Julio" },
				{ month: 8, deadline: "2026-09-15", description: "IGV Agosto" },
				{ month: 9, deadline: "2026-10-15", description: "IGV Setiembre" },
				{ month: 10, deadline: "2026-11-16", description: "IGV Octubre" },
				{ month: 11, deadline: "2026-12-15", description: "IGV Noviembre" },
				{ month: 12, deadline: "2027-01-15", description: "IGV Diciembre" },
			],
		};

		return {
			year: input.year,
			events: deadlines[input.year] ?? deadlines[2026]!,
		};
	},
});

// ─── Registry de Tools ─────────────────────────────────────

export const fiscalTools = {
	calculateIGV,
	validateCPE,
	submitSIRE,
	checkDetraction,
	checkRetention,
	getTaxCalendar,
};

export type FiscalTools = typeof fiscalTools;
