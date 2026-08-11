import { Money } from "../../value-objects/Money";
import {
	DETRACCION_NORMA_APLICADA,
	DETRACCION_VERSION_TABLA,
	IGV_NORMA_APLICADA,
	IGV_VERSION_TABLA,
	PERCEPCION_NORMA_APLICADA,
	PERCEPCION_VERSION_TABLA,
	RETENCION_NORMA_APLICADA,
	RETENCION_VERSION_TABLA,
} from "./audit-metadata";
import { DETRACCION_RATES, PERCEPCION_RATES } from "./rates";
import type { TaxCalculationResult } from "./types";
import { shouldApplyDetraccion } from "./validator";

const IGV_RATE = 0.18;
const RETENCION_RATE = 0.03;

export function calculateIGV(baseAmount: Money): TaxCalculationResult {
	const taxAmount = baseAmount.multiply(IGV_RATE);
	const totalAmount = baseAmount.add(taxAmount);

	return {
		baseAmount,
		taxAmount,
		totalAmount,
		taxRate: IGV_RATE,
		taxType: "IGV",
		normaAplicada: IGV_NORMA_APLICADA,
		versionTabla: IGV_VERSION_TABLA,
	};
}

export function calculateBaseFromTotal(
	totalAmount: Money,
): TaxCalculationResult {
	const baseAmount = totalAmount.divide(1 + IGV_RATE);
	const taxAmount = totalAmount.subtract(baseAmount);

	return {
		baseAmount,
		taxAmount,
		totalAmount,
		taxRate: IGV_RATE,
		taxType: "IGV",
		normaAplicada: IGV_NORMA_APLICADA,
		versionTabla: IGV_VERSION_TABLA,
	};
}

export function calculateDetraccion(
	totalAmount: Money,
	serviceCode: string,
): TaxCalculationResult {
	const detraccionRate = DETRACCION_RATES[serviceCode];

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
		normaAplicada: DETRACCION_NORMA_APLICADA,
		versionTabla: DETRACCION_VERSION_TABLA,
	};
}

export function calculateRetencion(baseAmount: Money): TaxCalculationResult {
	const taxAmount = baseAmount.multiply(RETENCION_RATE);

	return {
		baseAmount,
		taxAmount,
		totalAmount: baseAmount,
		taxRate: RETENCION_RATE,
		taxType: "RETENCION",
		normaAplicada: RETENCION_NORMA_APLICADA,
		versionTabla: RETENCION_VERSION_TABLA,
	};
}

export function calculatePercepcion(
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
		normaAplicada: PERCEPCION_NORMA_APLICADA,
		versionTabla: PERCEPCION_VERSION_TABLA,
	};
}

export function calculateInvoiceBreakdown(params: {
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
		const igvCalc = calculateIGV(baseAmount);
		igv = igvCalc.taxAmount;
	}

	const total = baseAmount.add(igv);

	let detraccion: Money | undefined;
	if (detraccionCode && shouldApplyDetraccion(total, detraccionCode)) {
		const detraccionCalc = calculateDetraccion(total, detraccionCode);
		detraccion = detraccionCalc.taxAmount;
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
