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

import { DNI } from "../value-objects/DNI";
import { DocumentSeries } from "../value-objects/DocumentSeries";
import { Money } from "../value-objects/Money";
import { RUC } from "../value-objects/RUC";

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
export type Currency = import("../types/currency").Currency;

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
		this.validateBusinessRules();
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
	 * Valida las reglas de negocio invariantes de la factura.
	 * Lanza errores si alguna regla no se cumple.
	 */
	private validateBusinessRules(): void {
		// Rule 1: Factura requires RUC
		if (this.props.series.isFactura() && !this.props.clientRUC) {
			throw new Error("Las facturas requieren RUC del cliente (regla SUNAT)");
		}

		// Rule 2: Total must equal base + IGV
		const expectedTotal = this.props.baseAmount.add(this.props.igvAmount);
		if (!this.props.totalAmount.equals(expectedTotal)) {
			throw new Error(
				`El total (${this.props.totalAmount.getAmount()}) debe ser igual a base + IGV (${expectedTotal.getAmount()})`,
			);
		}

		// Rule 7 (Moved up): Must have at least one item
		// Validamos esto antes de sumar los items para evitar errores confusos
		if (this.props.items.length === 0) {
			throw new Error("La factura debe tener al menos un item");
		}

		// Rule 3: Items total must match invoice total
		const itemsTotal = this.calculateItemsTotal();
		if (!itemsTotal.equals(this.props.totalAmount)) {
			throw new Error(
				`La suma de items (${itemsTotal.getAmount()}) no coincide con el total (${this.props.totalAmount.getAmount()})`,
			);
		}

		// Rule 4: Issue date cannot be in the future
		if (this.props.issueDate > new Date()) {
			throw new Error("La fecha de emisión no puede ser futura");
		}

		// Rule 5: Due date must be after issue date
		if (this.props.dueDate && this.props.dueDate < this.props.issueDate) {
			throw new Error(
				"La fecha de vencimiento debe ser posterior a la emisión",
			);
		}

		// Rule 6: Invoice number must be positive
		if (this.props.number <= 0) {
			throw new Error("El número de factura debe ser positivo");
		}
	}

	/**
	 * Calcula el total sumando los totales de cada ítem.
	 */
	private calculateItemsTotal(): Money {
		return this.props.items.reduce(
			(acc, item) => acc.add(item.total),
			Money.zero(this.props.totalAmount.getCurrency()),
		);
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
