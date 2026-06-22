import { DNI } from "../../value-objects/DNI";
import { DocumentSeries } from "../../value-objects/DocumentSeries";
import { Money } from "../../value-objects/Money";
import { RUC } from "../../value-objects/RUC";

/**
 * Estados posibles de una factura.
 *
 * @example
 * ```ts
 * const s: InvoiceStatus = "DRAFT";
 * ```
 */
export type InvoiceStatus =
	| "DRAFT" // Borrador
	| "PENDING" // Pendiente de envío
	| "SENT" // Enviado a SUNAT
	| "ACCEPTED" // Aceptado por SUNAT
	| "REJECTED" // Rechazado por SUNAT
	| "CANCELLED"; // Anulado

/**
 * Monedas soportadas.
 *
 * @example
 * ```ts
 * const c: Currency = "PEN";
 * ```
 */
export type Currency = import("../../types/currency").Currency;

/**
 * Propiedades de la entidad Factura.
 *
 * @example
 * ```ts
 * const props: InvoiceProps = {
 *   id: "inv_1",
 *   series: DocumentSeries.create("F001"),
 *   number: 1,
 *   issueDate: new Date(),
 *   clientName: "Cliente",
 *   baseAmount: Money.fromAmount(100, "PEN"),
 *   igvAmount: Money.fromAmount(18, "PEN"),
 *   totalAmount: Money.fromAmount(118, "PEN"),
 *   status: "DRAFT",
 *   items: [],
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * } as InvoiceProps;
 * ```
 */
export interface InvoiceProps {
	id: string;
	series: DocumentSeries;
	number: number;
	issueDate: Date;
	dueDate?: Date;
	clientName: string;
	clientRUC?: RUC;
	clientDNI?: DNI;
	clientAddress?: string;
	baseAmount: Money;
	igvAmount: Money;
	totalAmount: Money;
	status: InvoiceStatus;
	items: InvoiceItem[];
	notes?: string;
	sunatResponseCode?: string;
	sentToSunatAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Ítem individual dentro de una factura.
 *
 * @example
 * ```ts
 * const item: InvoiceItem = {
 *   id: "item_1",
 *   description: "Servicio",
 *   quantity: 1,
 *   unitPrice: Money.fromAmount(100, "PEN"),
 *   subtotal: Money.fromAmount(84.75, "PEN"),
 *   igv: Money.fromAmount(15.25, "PEN"),
 *   total: Money.fromAmount(100, "PEN"),
 * };
 * ```
 */
export interface InvoiceItem {
	id: string;
	description: string;
	quantity: number;
	unitPrice: Money;
	subtotal: Money;
	igv: Money;
	total: Money;
}

/**
 * Datos primitivos para reconstruir una factura (desde BD o API).
 *
 * @example
 * ```ts
 * const data: InvoicePrimitiveData = { id: "inv_1", series: "F001", number: 1, issueDate: new Date(), clientName: "Cliente", baseAmount: 10000, igvAmount: 1800, totalAmount: 11800, currency: "PEN", status: "DRAFT" };
 * ```
 */
export interface InvoicePrimitiveData {
	id: string;
	series: string;
	number: string | number;
	issueDate: string | Date;
	dueDate?: string | Date;
	clientName: string;
	clientRUC?: string;
	clientDNI?: string;
	clientAddress?: string;
	baseAmount: number;
	igvAmount: number;
	totalAmount: number;
	currency: string;
	status: string;
	items?: Array<{
		id: string;
		description: string;
		quantity: string | number;
		unitPrice: number;
		subtotal: number;
		igv: number;
		total: number;
	}>;
	notes?: string;
	sunatResponseCode?: string;
	sentToSunatAt?: string | Date;
	createdAt?: string | Date;
	updatedAt?: string | Date;
}
