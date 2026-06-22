import type { Money } from "../../value-objects/Money";

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
