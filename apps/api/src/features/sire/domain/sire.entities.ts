/**
 * SIRE Domain - Registro de Compras y Ventas
 * SUNAT SIRE (Sistema Integrado de Registros Electrónicos)
 *
 * @principle Domain-Driven Design
 * @deadline Junio 2026 - Obligatorio para principales contribuyentes
 */

import { Money } from "@arkelythex/domain";

/**
 * SirePeriod type.
 *
 * @example
 * ```ts
 * const value: SirePeriod = {} as SirePeriod;
 * console.log(value);
 * ```
 */
export type SirePeriod = `${number}-${string}`; // YYYY-MM

/**
 * SireRegistro interface.
 *
 * @example
 * ```ts
 * const value: SireRegistro = {} as SireRegistro;
 * console.log(value);
 * ```
 */
export interface SireRegistro {
	id: string;
	companyId: string;
	period: SirePeriod; // 2026-01
	documentType: string; // 01=Factura, 03=Boleta, 07=Nota Crédito
	documentNumber: string; // F001-12345678
	issueDate: Date;
	supplierCustomerRuc?: string;
	supplierCustomerName: string;
	baseAmount: Money;
	igvAmount: Money;
	totalAmount: Money;
	currency: "PEN" | "USD";
	exchangeRate: number;
	status: "PENDIENTE" | "ACEPTADO" | "RECHAZADO";
	sunatObservation?: string;
}

/**
 * RegistroCompras class.
 *
 * @example
 * ```ts
 * const value = new RegistroCompras();
 * console.log(value);
 * ```
 */
export class RegistroCompras implements SireRegistro {
	constructor(
		public readonly id: string,
		public readonly companyId: string,
		public readonly period: SirePeriod,
		public readonly documentType: string,
		public readonly documentNumber: string,
		public readonly issueDate: Date,
		public readonly supplierCustomerRuc: string | undefined,
		public readonly supplierCustomerName: string,
		public readonly baseAmount: Money,
		public readonly igvAmount: Money,
		public readonly totalAmount: Money,
		public readonly currency: "PEN" | "USD",
		public readonly exchangeRate: number,
		public readonly status:
			| "PENDIENTE"
			| "ACEPTADO"
			| "RECHAZADO" = "PENDIENTE",
		public readonly sunatObservation?: string,
		public readonly deductionType?: string, // Tipo de deducción para compras
	) {}

	/**
	 * Determina si el registro es deducible para impuesto a la renta
	 */
	isDeductible(): boolean {
		return (
			this.status === "ACEPTADO" &&
			this.documentType !== "03" && // Boletas no son deducibles
			this.totalAmount.getAmount() > 0
		);
	}

	/**
	 * Calcula el crédito fiscal (IGV) disponible
	 */
	getCreditoFiscal(): Money {
		if (this.status !== "ACEPTADO") {
			return Money.zero(this.currency);
		}
		return this.igvAmount;
	}
}

/**
 * RegistroVentas class.
 *
 * @example
 * ```ts
 * const value = new RegistroVentas();
 * console.log(value);
 * ```
 */
export class RegistroVentas implements SireRegistro {
	constructor(
		public readonly id: string,
		public readonly companyId: string,
		public readonly period: SirePeriod,
		public readonly documentType: string,
		public readonly documentNumber: string,
		public readonly issueDate: Date,
		public readonly supplierCustomerRuc: string | undefined, // Undefined para boletas
		public readonly supplierCustomerName: string,
		public readonly baseAmount: Money,
		public readonly igvAmount: Money,
		public readonly totalAmount: Money,
		public readonly currency: "PEN" | "USD",
		public readonly exchangeRate: number,
		public readonly status:
			| "PENDIENTE"
			| "ACEPTADO"
			| "RECHAZADO" = "PENDIENTE",
		public readonly sunatObservation?: string,
		public readonly tipoOperacion?: string, // 1=Ventas internas, 2=Exportación
	) {}

	/**
	 * Determina si es una operación gravada con IGV
	 */
	isGravada(): boolean {
		return this.igvAmount.getAmount() > 0;
	}

	/**
	 * Calcula el IGV a pagar (para ventas)
	 */
	getIGVAPagar(): Money {
		return this.igvAmount;
	}
}

/**
 * SireSummary interface.
 *
 * @example
 * ```ts
 * const value: SireSummary = {} as SireSummary;
 * console.log(value);
 * ```
 */
export interface SireSummary {
	period: SirePeriod;
	totalRegistros: number;
	totalBase: Money;
	totalIGV: Money;
	total: Money;
	aceptados: number;
	rechazados: number;
	pendientes: number;
}
