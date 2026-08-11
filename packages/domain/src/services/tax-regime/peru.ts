/**
 * PeruGeneralRegime — Peruvian tax regime implementation.
 *
 * Implements IGV (18%), Detracción (SPOT), Retención (3%),
 * and Percepción IGV per SUNAT regulations.
 *
 * @module services/tax-regime/peru
 */

import type { CountryCode } from "../../types/tax-identifier";
import { Money } from "../../value-objects/Money";
import type { TaxRegime } from "./types";

// ── Shared result types (ported from TaxCalculator) ────────────────

export type TaxType = "IGV" | "DETRACCION" | "RETENCION" | "PERCEPCION";

export interface TaxCalculationResult {
	baseAmount: Money;
	taxAmount: Money;
	totalAmount: Money;
	taxRate: number;
	taxType: TaxType;
}

export interface DetraccionRate {
	code: string;
	description: string;
	rate: number;
}

export type PercepcionType = "VENTA_INTERNA" | "IMPORTACION" | "COMBUSTIBLE";

export interface PercepcionRate {
	code: PercepcionType;
	description: string;
	rate: number;
}

const IGV_RATE = 0.18;
const RETENCION_RATE = 0.03;
const DETRACCION_THRESHOLD = Money.fromAmount(700, "PEN");
const RETENCION_THRESHOLD = Money.fromAmount(700, "PEN");
const PERCEPCION_THRESHOLD = Money.fromAmount(700, "PEN");

const DETRACCION_RATES: Record<string, DetraccionRate> = {
	"001": {
		code: "001",
		description: "Transporte de bienes por vía terrestre",
		rate: 0.04,
	},
	"002": {
		code: "002",
		description: "Transporte público de pasajeros",
		rate: 0.04,
	},
	"003": { code: "003", description: "Alquiler de bienes muebles", rate: 0.04 },
	"004": {
		code: "004",
		description: "Mantenimiento y reparación de bienes muebles",
		rate: 0.04,
	},
	"005": {
		code: "005",
		description: "Intermediación laboral y tercerización",
		rate: 0.12,
	},
	"006": {
		code: "006",
		description: "Arrendamiento de bienes inmuebles",
		rate: 0.05,
	},
	"007": {
		code: "007",
		description: "Otros servicios empresariales",
		rate: 0.1,
	},
};

const PERCEPCION_RATES: Record<string, PercepcionRate> = {
	VENTA_INTERNA: {
		code: "VENTA_INTERNA",
		description: "Venta interna — Régimen de Percepciones",
		rate: 0.02,
	},
	IMPORTACION: {
		code: "IMPORTACION",
		description: "Importación — Percepción aduanera",
		rate: 0.035,
	},
	COMBUSTIBLE: {
		code: "COMBUSTIBLE",
		description: "Combustibles — Ley 28683",
		rate: 0.01,
	},
};

// ── Regime ─────────────────────────────────────────────────────────

export class PeruGeneralRegime implements TaxRegime {
	readonly countryCode: CountryCode = "PE";

	// ── TaxRegime interface ───────────────────────────────────────

	calculate(amount: Money, taxType: string): Money {
		switch (taxType) {
			case "IGV":
				return amount.multiply(IGV_RATE);
			case "DETRACCION":
				return amount.multiply(0.04); // default fallback
			case "RETENCION":
				return amount.multiply(RETENCION_RATE);
			case "PERCEPCION":
				return amount.multiply(0.02); // default fallback
			default:
				throw new Error(`Unknown tax type for Peru: ${taxType}`);
		}
	}

	getRate(taxType: string): number {
		switch (taxType) {
			case "IGV":
				return IGV_RATE;
			case "RETENCION":
				return RETENCION_RATE;
			case "DETRACCION":
				return 0.04;
			case "PERCEPCION":
				return 0.02;
			default:
				throw new Error(`Unknown tax type for Peru: ${taxType}`);
		}
	}

	// ── IGV ───────────────────────────────────────────────────────

	calculateIGV(baseAmount: Money): TaxCalculationResult {
		const taxAmount = baseAmount.multiply(IGV_RATE);
		const totalAmount = baseAmount.add(taxAmount);
		return {
			baseAmount,
			taxAmount,
			totalAmount,
			taxRate: IGV_RATE,
			taxType: "IGV",
		};
	}

	calculateBaseFromTotal(totalAmount: Money): TaxCalculationResult {
		const baseAmount = totalAmount.divide(1 + IGV_RATE);
		const taxAmount = totalAmount.subtract(baseAmount);
		return {
			baseAmount,
			taxAmount,
			totalAmount,
			taxRate: IGV_RATE,
			taxType: "IGV",
		};
	}

	// ── Detracción ────────────────────────────────────────────────

	calculateDetraccion(
		totalAmount: Money,
		serviceCode: string,
	): TaxCalculationResult {
		const rate = DETRACCION_RATES[serviceCode];
		if (!rate) {
			throw new Error(
				`Código de servicio inválido para detracción: ${serviceCode}`,
			);
		}
		const taxAmount = totalAmount.multiply(rate.rate);
		return {
			baseAmount: totalAmount,
			taxAmount,
			totalAmount,
			taxRate: rate.rate,
			taxType: "DETRACCION",
		};
	}

	shouldApplyDetraccion(totalAmount: Money, serviceCode: string): boolean {
		const hasValidCode = serviceCode in DETRACCION_RATES;
		const meetsThreshold =
			totalAmount.getCurrency() === "PEN" &&
			totalAmount.greaterThanOrEqual(DETRACCION_THRESHOLD);
		return hasValidCode && meetsThreshold;
	}

	getDetraccionRates(): DetraccionRate[] {
		return Object.values(DETRACCION_RATES);
	}

	getDetraccionRate(code: string): DetraccionRate | undefined {
		return DETRACCION_RATES[code];
	}

	// ── Retención ─────────────────────────────────────────────────

	calculateRetencion(baseAmount: Money): TaxCalculationResult {
		const taxAmount = baseAmount.multiply(RETENCION_RATE);
		return {
			baseAmount,
			taxAmount,
			totalAmount: baseAmount,
			taxRate: RETENCION_RATE,
			taxType: "RETENCION",
		};
	}

	shouldApplyRetencion(baseAmount: Money, isAgenteRetencion = false): boolean {
		return (
			!isAgenteRetencion &&
			baseAmount.getCurrency() === "PEN" &&
			baseAmount.greaterThan(RETENCION_THRESHOLD)
		);
	}

	// ── Percepción ────────────────────────────────────────────────

	calculatePercepcion(
		totalAmount: Money,
		percepcionType: string,
	): TaxCalculationResult {
		const rate = PERCEPCION_RATES[percepcionType];
		if (!rate) {
			throw new Error(
				`Tipo de percepción inválido: ${percepcionType}. Use VENTA_INTERNA, IMPORTACION o COMBUSTIBLE`,
			);
		}
		const taxAmount = totalAmount.multiply(rate.rate);
		return {
			baseAmount: totalAmount,
			taxAmount,
			totalAmount: totalAmount.add(taxAmount),
			taxRate: rate.rate,
			taxType: "PERCEPCION",
		};
	}

	shouldApplyPercepcion(totalAmount: Money): boolean {
		if (totalAmount.getCurrency() !== "PEN") return false;
		if (!totalAmount.isPositive()) return false;
		return totalAmount.greaterThanOrEqual(PERCEPCION_THRESHOLD);
	}

	getPercepcionRates(): PercepcionRate[] {
		return Object.values(PERCEPCION_RATES);
	}

	getPercepcionRate(percepcionType: string): PercepcionRate | undefined {
		return PERCEPCION_RATES[percepcionType];
	}

	// ── Invoice breakdown ─────────────────────────────────────────

	calculateInvoiceBreakdown(params: {
		baseAmount: Money;
		applyIGV: boolean;
		detraccionCode?: string;
		isExport?: boolean;
	}): {
		base: Money;
		igv: Money;
		total: Money;
		detraccion?: Money;
		netToPay: Money;
	} {
		const { baseAmount, applyIGV, detraccionCode, isExport = false } = params;

		if (isExport) {
			return {
				base: baseAmount,
				igv: Money.zero(baseAmount.getCurrency()),
				total: baseAmount,
				netToPay: baseAmount,
			};
		}

		let igv = Money.zero(baseAmount.getCurrency());
		if (applyIGV) {
			igv = this.calculateIGV(baseAmount).taxAmount;
		}

		const total = baseAmount.add(igv);

		let detraccion: Money | undefined;
		if (detraccionCode && this.shouldApplyDetraccion(total, detraccionCode)) {
			detraccion = this.calculateDetraccion(total, detraccionCode).taxAmount;
		}

		const netToPay = detraccion ? total.subtract(detraccion) : total;

		return {
			base: baseAmount,
			igv,
			total,
			...(detraccion !== undefined ? { detraccion } : {}),
			netToPay,
		};
	}
}
