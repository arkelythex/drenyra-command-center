/**
 * Invoice Entity.
 *
 * @description Central domain entity representing a Peruvian Electronic Invoice (CPE),
 * covering both "Facturas" (B2B) and "Boletas" (B2C). It encapsulates strict
 * SUNAT business rules, financial precision via the Money value object, and
 * document lifecycle management (Draft -> Sent -> Accepted/Rejected).
 *
 * @business_rules
 * - Facturas (Series F) MANDATORILY require a client RUC.
 * - Boletas (Series B) can have DNI or remain anonymous for small amounts.
 * - Invariant: Total Amount MUST equal Base Amount + IGV Amount.
 * - Immutability: Once SENT to SUNAT, the core financial data cannot be modified.
 * - Continuity: Series and numbers must follow strict sequential patterns.
 *
 * @since 1.0.0
 */

import { DNI } from "../../value-objects/DNI";
import { DocumentSeries } from "../../value-objects/DocumentSeries";
import { Money } from "../../value-objects/Money";
import { RUC } from "../../value-objects/RUC";
import type {
	Currency,
	InvoiceItem,
	InvoicePrimitiveData,
	InvoiceProps,
	InvoiceStatus,
} from "./types";
import { validateInvoiceBusinessRules } from "./validators";

/**
 * Clase que representa una Factura y encapsula su lógica de negocio.
 *
 * @example
 * ```ts
 * const invoice = Invoice.create({} as InvoiceProps);
 * ```
 */
export class Invoice {
	private constructor(private props: InvoiceProps) {
		validateInvoiceBusinessRules(this.props);
		Object.freeze(this);
	}

	/**
	 * Crea una nueva instancia de Factura.
	 *
	 * @param props - Propiedades iniciales de la factura.
	 * @returns Una nueva instancia de Factura.
	 */
	static create(props: InvoiceProps): Invoice {
		return new Invoice(props);
	}

	/**
	 * Reconstruye una Factura a partir de datos primitivos (ej. desde BD o API).
	 *
	 * @param plainData - Objeto con datos primitivos.
	 * @returns Una instancia de Factura.
	 */
	static fromPrimitives(plainData: InvoicePrimitiveData): Invoice {
		const currency = plainData.currency as Currency;

		const props: InvoiceProps = {
			id: plainData.id,
			series: DocumentSeries.create(plainData.series),
			number: Number(plainData.number),
			issueDate: new Date(plainData.issueDate),
			dueDate: plainData.dueDate ? new Date(plainData.dueDate) : undefined,
			clientName: plainData.clientName,
			clientRUC: plainData.clientRUC
				? RUC.create(plainData.clientRUC)
				: undefined,
			clientDNI: plainData.clientDNI
				? DNI.create(plainData.clientDNI)
				: undefined,
			clientAddress: plainData.clientAddress,
			baseAmount: Money.fromCents(plainData.baseAmount, currency),
			igvAmount: Money.fromCents(plainData.igvAmount, currency),
			totalAmount: Money.fromCents(plainData.totalAmount, currency),
			status: plainData.status as InvoiceStatus,
			items: (plainData.items || []).map((item) => ({
				id: item.id,
				description: item.description,
				quantity: Number(item.quantity),
				unitPrice: Money.fromCents(item.unitPrice, currency),
				subtotal: Money.fromCents(item.subtotal, currency),
				igv: Money.fromCents(item.igv, currency),
				total: Money.fromCents(item.total, currency),
			})),
			notes: plainData.notes,
			sunatResponseCode: plainData.sunatResponseCode,
			sentToSunatAt: plainData.sentToSunatAt
				? new Date(plainData.sentToSunatAt)
				: undefined,
			createdAt: plainData.createdAt
				? new Date(plainData.createdAt)
				: new Date(),
			updatedAt: plainData.updatedAt
				? new Date(plainData.updatedAt)
				: new Date(),
		};

		return new Invoice(props);
	}

	/**
	 * Obtiene el número completo de la factura (ej. "F001-00001234").
	 *
	 * @returns Cadena con la serie y número formateados.
	 */
	getFullNumber(): string {
		return `${this.props.series.toString()}-${this.props.number.toString().padStart(8, "0")}`;
	}

	/**
	 * Marca la factura como enviada a SUNAT.
	 *
	 * @param sunatResponseCode - Código de respuesta recibido de SUNAT.
	 * @returns Una nueva instancia de Invoice con el estado actualizado.
	 */
	markAsSent(sunatResponseCode: string): Invoice {
		if (this.props.status !== "PENDING") {
			throw new Error("Solo se pueden enviar facturas en estado PENDING");
		}

		return new Invoice({
			...this.props,
			status: "SENT",
			sunatResponseCode,
			sentToSunatAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * Marca la factura como aceptada por SUNAT.
	 *
	 * @returns Una nueva instancia de Invoice con el estado actualizado.
	 */
	markAsAccepted(): Invoice {
		if (this.props.status !== "SENT") {
			throw new Error("Solo se pueden aceptar facturas en estado SENT");
		}

		return new Invoice({
			...this.props,
			status: "ACCEPTED",
			updatedAt: new Date(),
		});
	}

	/**
	 * Marca la factura como rechazada por SUNAT.
	 *
	 * @param reason - Razón del rechazo.
	 * @returns Una nueva instancia de Invoice con el estado actualizado y la nota de rechazo.
	 */
	markAsRejected(reason: string): Invoice {
		if (this.props.status !== "SENT") {
			throw new Error("Solo se pueden rechazar facturas en estado SENT");
		}

		return new Invoice({
			...this.props,
			status: "REJECTED",
			notes: reason,
			updatedAt: new Date(),
		});
	}

	/**
	 * Anula la factura (solo si no ha sido enviada a SUNAT).
	 *
	 * @returns Una nueva instancia de Invoice con estado CANCELLED.
	 */
	cancel(): Invoice {
		if (this.props.status === "SENT" || this.props.status === "ACCEPTED") {
			throw new Error(
				"No se pueden cancelar facturas enviadas a SUNAT. Use Nota de Crédito.",
			);
		}

		return new Invoice({
			...this.props,
			status: "CANCELLED",
			updatedAt: new Date(),
		});
	}

	/**
	 * Verifica si la factura puede ser modificada.
	 *
	 * @returns `true` si está en borrador o pendiente, `false` de lo contrario.
	 */
	canBeModified(): boolean {
		return this.props.status === "DRAFT" || this.props.status === "PENDING";
	}

	/**
	 * Verifica si la factura está vencida.
	 *
	 * @returns `true` si la fecha de vencimiento ya pasó y no está anulada.
	 */
	isOverdue(): boolean {
		if (!this.props.dueDate) {
			return false;
		}
		return this.props.dueDate < new Date() && this.props.status !== "CANCELLED";
	}

	/**
	 * Compara si dos facturas son iguales basándose en su ID.
	 *
	 * @param other - Otra factura a comparar.
	 * @returns `true` si tienen el mismo ID.
	 */
	equals(other: Invoice | null | undefined): boolean {
		if (!other) {
			return false;
		}
		return this.props.id === other.props.id;
	}

	// Getters
	get id(): string {
		return this.props.id;
	}

	get series(): DocumentSeries {
		return this.props.series;
	}

	get number(): number {
		return this.props.number;
	}

	get issueDate(): Date {
		return this.props.issueDate;
	}

	get dueDate(): Date | undefined {
		return this.props.dueDate;
	}

	get clientName(): string {
		return this.props.clientName;
	}

	get clientRUC(): RUC | undefined {
		return this.props.clientRUC;
	}

	get clientDNI(): DNI | undefined {
		return this.props.clientDNI;
	}

	get clientAddress(): string | undefined {
		return this.props.clientAddress;
	}

	get baseAmount(): Money {
		return this.props.baseAmount;
	}

	get igvAmount(): Money {
		return this.props.igvAmount;
	}

	get totalAmount(): Money {
		return this.props.totalAmount;
	}

	get status(): InvoiceStatus {
		return this.props.status;
	}

	get items(): readonly InvoiceItem[] {
		return this.props.items;
	}

	get notes(): string | undefined {
		return this.props.notes;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get sentToSunatAt(): Date | undefined {
		return this.props.sentToSunatAt;
	}

	get sunatResponseCode(): string | undefined {
		return this.props.sunatResponseCode;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	/**
	 * Serializa la entidad a un objeto plano JSON (para persistencia o API).
	 *
	 * @returns Objeto plano con los datos de la factura.
	 */
	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			series: this.props.series.toString(),
			number: this.props.number,
			issueDate: this.props.issueDate.toISOString(),
			dueDate: this.props.dueDate?.toISOString(),
			clientName: this.props.clientName,
			clientRUC: this.props.clientRUC?.toString(),
			clientDNI: this.props.clientDNI?.toString(),
			clientAddress: this.props.clientAddress,
			baseAmount: this.props.baseAmount.toJSON(),
			igvAmount: this.props.igvAmount.toJSON(),
			totalAmount: this.props.totalAmount.toJSON(),
			status: this.props.status,
			items: this.props.items,
			notes: this.props.notes,
			sunatResponseCode: this.props.sunatResponseCode,
			sentToSunatAt: this.props.sentToSunatAt?.toISOString(),
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
