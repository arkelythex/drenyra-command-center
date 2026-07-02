/**
 * TaxCalculator Domain Service
 *
 * Facade over the active TaxRegime. By default delegates to PeruGeneralRegime.
 * Use `TaxCalculator.setRegime()` to swap the implementation for a different country.
 *
 * @module services/TaxCalculator
 */

import type { Money } from "../value-objects/Money";
import { PeruGeneralRegime } from "./tax-regime/peru";
import type { TaxRegime } from "./tax-regime/types";

// ── Re-export types for backward compatibility ─────────────────────

export type TaxType = import("./tax-regime/peru").TaxType;
export type TaxCalculationResult =
	import("./tax-regime/peru").TaxCalculationResult;
export type DetraccionRate = import("./tax-regime/peru").DetraccionRate;
export type PercepcionRate = import("./tax-regime/peru").PercepcionRate;
export type PercepcionType = import("./tax-regime/peru").PercepcionType;

// ── Facade ─────────────────────────────────────────────────────────

/**
 * Domain service for calculating taxes.
 *
 * Defaults to Peruvian tax rules (IGV, detracción, retención, percepción).
 * Swap the regime with `setRegime()` for multi-country support.
 *
 * @example
 * ```ts
 * const base = Money.fromAmount(100, "PEN");
 * const igv = TaxCalculator.calculateIGV(base);
 * ```
 */
export class TaxCalculator {
	private static regime: TaxRegime = new PeruGeneralRegime();

	/**
	 * Swap the active tax regime (e.g., for a different country).
	 */
	static setRegime(regime: TaxRegime): void {
		TaxCalculator.regime = regime;
	}

	/**
	 * Get the active tax regime.
	 */
	static getRegime(): TaxRegime {
		return TaxCalculator.regime;
	}

	/**
	 * Calculate IGV (18% in Peru).
	 */
	static calculateIGV(baseAmount: Money): TaxCalculationResult {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.calculateIGV(baseAmount);
	}

	/**
	 * Calculate base amount from total (reverse IGV calculation).
	 */
	static calculateBaseFromTotal(totalAmount: Money): TaxCalculationResult {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.calculateBaseFromTotal(totalAmount);
	}

	/**
	 * Calculate Detracción (SPOT System — Peru only).
	 */
	static calculateDetraccion(
		totalAmount: Money,
		serviceCode: string,
	): TaxCalculationResult {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.calculateDetraccion(totalAmount, serviceCode);
	}

	/**
	 * Calculate Retención (Withholding Tax — Peru only).
	 */
	static calculateRetencion(baseAmount: Money): TaxCalculationResult {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.calculateRetencion(baseAmount);
	}

	/**
	 * Calculate Percepción IGV (Peru only).
	 */
	static calculatePercepcion(
		totalAmount: Money,
		percepcionType: string,
	): TaxCalculationResult {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.calculatePercepcion(totalAmount, percepcionType);
	}

	/**
	 * Check if detracción applies (Peru only).
	 */
	static shouldApplyDetraccion(
		totalAmount: Money,
		serviceCode: string,
	): boolean {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.shouldApplyDetraccion(totalAmount, serviceCode);
	}

	/**
	 * Check if retención applies (Peru only).
	 */
	static shouldApplyRetencion(
		baseAmount: Money,
		isAgenteRetencion = false,
	): boolean {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.shouldApplyRetencion(baseAmount, isAgenteRetencion);
	}

	/**
	 * Check if percepción IGV applies (Peru only).
	 */
	static shouldApplyPercepcion(totalAmount: Money): boolean {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.shouldApplyPercepcion(totalAmount);
	}

	/**
	 * Get all available detracción codes.
	 */
	static getDetraccionRates(): DetraccionRate[] {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.getDetraccionRates();
	}

	/**
	 * Get detracción rate by code.
	 */
	static getDetraccionRate(code: string): DetraccionRate | undefined {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.getDetraccionRate(code);
	}

	/**
	 * Get all available percepción rates.
	 */
	static getPercepcionRates(): PercepcionRate[] {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.getPercepcionRates();
	}

	/**
	 * Get percepción rate by type.
	 */
	static getPercepcionRate(percepcionType: string): PercepcionRate | undefined {
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.getPercepcionRate(percepcionType);
	}

	/**
	 * Calculate complete invoice breakdown.
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
		const peru = TaxCalculator.ensurePeruRegime();
		return peru.calculateInvoiceBreakdown(params);
	}

	/**
	 * Ensures the active regime is PeruGeneralRegime and returns it.
	 * Throws if a non-Peru regime is active (these methods are Peru-specific).
	 */
	private static ensurePeruRegime(): PeruGeneralRegime {
		if (TaxCalculator.regime instanceof PeruGeneralRegime) {
			return TaxCalculator.regime;
		}
		// Fallback: wrap with Peru default
		TaxCalculator.regime = new PeruGeneralRegime();
		return TaxCalculator.regime as PeruGeneralRegime;
	}
}
