/**
 * TaxCalculator Domain Service
 * Calculates Peruvian taxes (IGV, Detracciones, Retenciones)
 *
 * Business Rules (SUNAT 2025):
 * - IGV (VAT): 18% standard rate
 * - Detracción (SPOT): Variable rates (4%, 10%, 12%) depending on service
 * - Retención (Withholding): 3% for services
 * - Export sales: 0% IGV
 */

import { Money } from "../value-objects/Money";

/**
 * Supported tax calculation types.
 *
 * @example
 * ```ts
 * const kind: TaxType = "IGV";
 * ```
 */
export type TaxType = "IGV" | "DETRACCION" | "RETENCION" | "PERCEPCION";

/**
 * Result of a tax calculation.
 *
 * @example
 * ```ts
 * const result = TaxCalculator.calculateIGV(Money.fromAmount(100, "PEN"));
 * // result.taxType === "IGV"
 * ```
 */
export interface TaxCalculationResult {
	baseAmount: Money;
	taxAmount: Money;
	totalAmount: Money;
	taxRate: number;
	taxType: TaxType;
}

/**
 * Detracción rate metadata (SPOT) for a given service code.
 *
 * @example
 * ```ts
 * const rates = TaxCalculator.getDetraccionRates();
 * const first: DetraccionRate | undefined = rates[0];
 * ```
 */
export interface DetraccionRate {
	code: string;
	description: string;
	rate: number; // Percentage (e.g., 0.12 for 12%)
}

/**
 * Percepción IGV type — the transaction type determines the rate.
 *
 * @example
 * ```ts
 * const type: PercepcionType = 'VENTA_INTERNA';
 * ```
 */
export type PercepcionType = 'VENTA_INTERNA' | 'IMPORTACION' | 'COMBUSTIBLE';

/**
 * Percepción rate metadata.
 *
 * @example
 * ```ts
 * const rate = TaxCalculator.getPercepcionRate('VENTA_INTERNA');
 * // { code: 'VENTA_INTERNA', description: 'Venta interna', rate: 0.02 }
 * ```
 */
export interface PercepcionRate {
	code: PercepcionType;
	description: string;
	rate: number; // Percentage (e.g., 0.02 for 2%)
}

/**
 * Domain service for calculating Peruvian taxes (IGV, detracción, retención).
 *
 * @example
 * ```ts
 * const base = Money.fromAmount(100, "PEN");
 * const igv = TaxCalculator.calculateIGV(base);
 * ```
 */
export class TaxCalculator {
	// IGV Rate (18% - SUNAT 2025)
	private static readonly IGV_RATE = 0.18;

	// Retención Rate (3% - SUNAT)
	private static readonly RETENCION_RATE = 0.03;

	// Detracción Rates by service type (SUNAT)
	private static readonly DETRACCION_RATES: Record<string, DetraccionRate> = {
		// Servicios de transporte de bienes por vía terrestre
		"001": {
			code: "001",
			description: "Transporte de bienes por vía terrestre",
			rate: 0.04,
		},
		// Transporte público de pasajeros
		"002": {
			code: "002",
			description: "Transporte público de pasajeros",
			rate: 0.04,
		},
		// Servicios de alquiler de bienes muebles
		"003": {
			code: "003",
			description: "Alquiler de bienes muebles",
			rate: 0.04,
		},
		// Mantenimiento y reparación de bienes muebles
		"004": {
			code: "004",
			description: "Mantenimiento y reparación de bienes muebles",
			rate: 0.04,
		},
		// Intermediación laboral y tercerización
		"005": {
			code: "005",
			description: "Intermediación laboral y tercerización",
			rate: 0.12,
		},
		// Arrendamiento de bienes inmuebles
		"006": {
			code: "006",
			description: "Arrendamiento de bienes inmuebles",
			rate: 0.05,
		},
		// Otros servicios empresariales
		"007": {
			code: "007",
			description: "Otros servicios empresariales",
			rate: 0.1,
		},
	};

	// Percepción IGV Rates (Decreto Legislativo N° 940)
	private static readonly PERCEPCION_RATES: Record<string, PercepcionRate> = {
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

	/**
	 * Calculate IGV (18%)
	 */
	static calculateIGV(baseAmount: Money): TaxCalculationResult {
		const taxAmount = baseAmount.multiply(TaxCalculator.IGV_RATE);
		const totalAmount = baseAmount.add(taxAmount);

		return {
			baseAmount,
			taxAmount,
			totalAmount,
			taxRate: TaxCalculator.IGV_RATE,
			taxType: "IGV",
		};
	}

	/**
	 * Calculate base amount from total (reverse IGV calculation)
	 * Total = Base * 1.18
	 * Base = Total / 1.18
	 */
	static calculateBaseFromTotal(totalAmount: Money): TaxCalculationResult {
		const baseAmount = totalAmount.divide(1 + TaxCalculator.IGV_RATE);
		const taxAmount = totalAmount.subtract(baseAmount);

		return {
			baseAmount,
			taxAmount,
			totalAmount,
			taxRate: TaxCalculator.IGV_RATE,
			taxType: "IGV",
		};
	}

	/**
	 * Calculate Detracción (SPOT System)
	 */
	static calculateDetraccion(
		totalAmount: Money,
		serviceCode: string,
	): TaxCalculationResult {
		const detraccionRate = TaxCalculator.DETRACCION_RATES[serviceCode];

		if (!detraccionRate) {
			throw new Error(
				`Código de servicio inválido para detracción: ${serviceCode}`,
			);
		}

		const taxAmount = totalAmount.multiply(detraccionRate.rate);

		return {
			baseAmount: totalAmount,
			taxAmount,
			totalAmount,
			taxRate: detraccionRate.rate,
			taxType: "DETRACCION",
		};
	}

	/**
	 * Calculate Retención (Withholding Tax)
	 * Applies to services over certain threshold
	 */
	static calculateRetencion(baseAmount: Money): TaxCalculationResult {
		const taxAmount = baseAmount.multiply(TaxCalculator.RETENCION_RATE);

		return {
			baseAmount,
			taxAmount,
			totalAmount: baseAmount, // Total doesn't change
			taxRate: TaxCalculator.RETENCION_RATE,
			taxType: "RETENCION",
		};
	}

	/**
	 * Calculate Percepción IGV (Régimen de Percepciones)
	 * Applies to purchases from designated "Agentes de Percepción"
	 */
	static calculatePercepcion(
		totalAmount: Money,
		percepcionType: string,
	): TaxCalculationResult {
		const rate = TaxCalculator.PERCEPCION_RATES[percepcionType];

		if (!rate) {
			throw new Error(
				`Tipo de percepción inválido: ${percepcionType}. Use VENTA_INTERNA, IMPORTACION o COMBUSTIBLE`,
			);
		}

		const taxAmount = totalAmount.multiply(rate.rate);

		return {
			baseAmount: totalAmount,
			taxAmount,
			totalAmount: totalAmount.add(taxAmount), // Total + percepcion
			taxRate: rate.rate,
			taxType: "PERCEPCION",
		};
	}

	/**
	 * Check if detracción applies
	 * Applies when:
	 * - Service is in SPOT system
	 * - Amount >= 700 PEN
	 */
	static shouldApplyDetraccion(
		totalAmount: Money,
		serviceCode: string,
	): boolean {
		// Detracción threshold (S/ 700)
		const DETRACCION_THRESHOLD = Money.fromAmount(700, "PEN");

		// Service must be in SPOT system
		const hasValidCode = serviceCode in TaxCalculator.DETRACCION_RATES;

		// Amount must be >= 700 PEN
		const meetsThreshold =
			totalAmount.getCurrency() === "PEN" &&
			totalAmount.greaterThanOrEqual(DETRACCION_THRESHOLD);

		return hasValidCode && meetsThreshold;
	}

	/**
	 * Check if retención applies
	 * Applies when:
	 * - Amount > 700 PEN
	 * - Provider is not designated as "Agente de Retención"
	 */
	static shouldApplyRetencion(
		baseAmount: Money,
		isAgenteRetencion = false,
	): boolean {
		const RETENCION_THRESHOLD = Money.fromAmount(700, "PEN");

		return (
			!isAgenteRetencion &&
			baseAmount.getCurrency() === "PEN" &&
			baseAmount.greaterThan(RETENCION_THRESHOLD)
		);
	}

	/**
	 * Check if percepción IGV applies
	 * Applies when:
	 * - Amount >= 700 PEN
	 * - Currency is PEN
	 * - Amount is positive
	 */
	static shouldApplyPercepcion(totalAmount: Money): boolean {
		const PERCEPCION_THRESHOLD = Money.fromAmount(700, "PEN");

		if (totalAmount.getCurrency() !== "PEN") {
			return false;
		}

		if (!totalAmount.isPositive()) {
			return false;
		}

		return totalAmount.greaterThanOrEqual(PERCEPCION_THRESHOLD);
	}

	/**
	 * Get all available detracción codes
	 */
	static getDetraccionRates(): DetraccionRate[] {
		return Object.values(TaxCalculator.DETRACCION_RATES);
	}

	/**
	 * Get detracción rate by code
	 */
	static getDetraccionRate(code: string): DetraccionRate | undefined {
		return TaxCalculator.DETRACCION_RATES[code];
	}

	/**
	 * Get all available percepción rates
	 */
	static getPercepcionRates(): PercepcionRate[] {
		return Object.values(TaxCalculator.PERCEPCION_RATES);
	}

	/**
	 * Get percepción rate by type
	 */
	static getPercepcionRate(percepcionType: string): PercepcionRate | undefined {
		return TaxCalculator.PERCEPCION_RATES[percepcionType];
	}

	/**
	 * Calculate complete invoice breakdown
	 * Returns base, IGV, detracción if applicable
	 */
	static calculateInvoiceBreakdown(params: {
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

		// Exports are not taxed
		if (isExport) {
			return {
				base: baseAmount,
				igv: Money.zero(baseAmount.getCurrency()),
				total: baseAmount,
				netToPay: baseAmount,
			};
		}

		// Calculate IGV
		let igv = Money.zero(baseAmount.getCurrency());
		if (applyIGV) {
			const igvCalc = TaxCalculator.calculateIGV(baseAmount);
			igv = igvCalc.taxAmount;
		}

		const total = baseAmount.add(igv);

		// Calculate detracción if applicable
		let detraccion: Money | undefined;
		if (
			detraccionCode &&
			TaxCalculator.shouldApplyDetraccion(total, detraccionCode)
		) {
			const detraccionCalc = TaxCalculator.calculateDetraccion(
				total,
				detraccionCode,
			);
			detraccion = detraccionCalc.taxAmount;
		}

		// Net to pay = Total - Detracción
		const netToPay = detraccion ? total.subtract(detraccion) : total;

		return {
			base: baseAmount,
			igv,
			total,
			detraccion,
			netToPay,
		};
	}
}
