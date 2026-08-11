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

import type { TaxIdentifier } from "../types/tax-identifier";
import { DNI } from "../value-objects/DNI";
import { DocumentSeries } from "../value-objects/DocumentSeries";
import { Money } from "../value-objects/Money";
import { RUC } from "../value-objects/RUC";

/**
 * Estados posibles de una factura (legacy, Perú-centric).
 *
 * @deprecated Use {@link FiscalStatus} for country-agnostic fiscal lifecycle.
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
 * Generic fiscal lifecycle status — country-agnostic.
 * Covers the common lifecycle across LATAM tax authorities.
 *
 * @example
 * ```ts
 * const fs: FiscalStatus = "DRAFT";
 * ```
 */
export type FiscalStatus =
	| "DRAFT"
	| "PENDING_REVIEW"
	| "SUBMITTED"
	| "ACCEPTED"
	| "REJECTED"
	| "CANCELLED";

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
 * Generic lifecycle fields (`buyerTaxId`, `taxAmount`, `fiscalStatus`)
 * coexist with legacy Peru-specific fields for backward compatibility.
 * New consumers SHOULD use the generic fields; old consumers continue
 * to work with `clientRUC`/`clientDNI`, `igvAmount`, and InvoiceStatus.
 *
 * @example
 * ```ts
 * const props: InvoiceProps = {
 *   id: "inv_1",
 *   series: DocumentSeries.create("F001"),
 *   number: 1,
 *   issueDate: new Date(),
 *   clientName: "Cliente",
 *   buyerTaxId: RUC.create("20546296564"), // generic (preferred)
 *   baseAmount: Money.fromAmount(100, "PEN"),
 *   igvAmount: Money.fromAmount(18, "PEN"),
 *   taxAmount: Money.fromAmount(18, "PEN"),  // generic (preferred)
 *   totalAmount: Money.fromAmount(118, "PEN"),
 *   status: "DRAFT",
 *   fiscalStatus: "DRAFT",                   // generic (preferred)
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
	dueDate?: Date | undefined;
	clientName: string;

	// ── Generic buyer tax ID (country-agnostic) ──
	/** Generic buyer tax identifier. Preferred over clientRUC/clientDNI. */
	buyerTaxId?: TaxIdentifier | undefined;
	/** @deprecated Use buyerTaxId instead. */
	clientRUC?: RUC | undefined;
	/** @deprecated Use buyerTaxId instead. */
	clientDNI?: DNI | undefined;

	clientAddress?: string | undefined;
	baseAmount: Money;

	// ── Generic tax amount (IGV in PE, IVA in MX/AR, VAT in CL) ──
	/** Generic tax amount. Preferred over igvAmount. */
	taxAmount?: Money;
	/** @deprecated Use taxAmount instead. */
	igvAmount: Money;

	totalAmount: Money;

	/** @deprecated Use fiscalStatus instead. */
	status: InvoiceStatus;
	/** Generic fiscal lifecycle status. Preferred over status. */
	fiscalStatus?: FiscalStatus;

	items: InvoiceItem[];
	notes?: string | undefined;

	// ── Legacy SUNAT fields ──
	/** @deprecated Will be abstracted behind TaxAuthorityPort. */
	sunatResponseCode?: string | undefined;
	/** @deprecated Will be abstracted behind TaxAuthorityPort. */
	sentToSunatAt?: Date | undefined;

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
 * const data: InvoicePrimitiveData = {
 *   id: "inv_1", series: "F001", number: 1, issueDate: new Date(),
 *   clientName: "Cliente", buyerTaxId: "20546296564", buyerTaxType: "RUC",
 *   baseAmount: 10000, igvAmount: 1800, taxAmount: 1800,
 *   totalAmount: 11800, currency: "PEN", status: "DRAFT",
 *   fiscalStatus: "DRAFT",
 * };
 * ```
 */
export interface InvoicePrimitiveData {
	id: string;
	series: string;
	number: string | number;
	issueDate: string | Date;
	dueDate?: string | Date;
	clientName: string;

	// ── Generic buyer tax ID ──
	buyerTaxId?: string;
	buyerTaxType?: string;
	/** @deprecated Use buyerTaxId instead. */
	clientRUC?: string;
	/** @deprecated Use buyerTaxId instead. */
	clientDNI?: string;

	clientAddress?: string;
	baseAmount: number;
	igvAmount: number;

	// ── Generic tax amount ──
	/** Generic tax amount in cents. Preferred over igvAmount. */
	taxAmount?: number;

	totalAmount: number;
	currency: string;
	status: string;
	/** Generic fiscal lifecycle status. Preferred over status. */
	fiscalStatus?: string;

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

	// ── Legacy SUNAT fields ──
	/** @deprecated Will be abstracted behind TaxAuthorityPort. */
	sunatResponseCode?: string;
	/** @deprecated Will be abstracted behind TaxAuthorityPort. */
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

		// Resolve buyer tax ID: prefer buyerTaxId, fall back to clientRUC/clientDNI
		let buyerTaxId: TaxIdentifier | undefined;
		if (plainData.buyerTaxId && plainData.buyerTaxType) {
			if (plainData.buyerTaxType === "RUC") {
				buyerTaxId = RUC.create(plainData.buyerTaxId);
			} else if (plainData.buyerTaxType === "DNI") {
				buyerTaxId = DNI.create(plainData.buyerTaxId);
			}
		} else if (plainData.clientRUC) {
			buyerTaxId = RUC.create(plainData.clientRUC);
		} else if (plainData.clientDNI) {
			buyerTaxId = DNI.create(plainData.clientDNI);
		}

		const props: InvoiceProps = {
			id: plainData.id,
			series: DocumentSeries.create(plainData.series),
			number: Number(plainData.number),
			issueDate: new Date(plainData.issueDate),
			dueDate: plainData.dueDate ? new Date(plainData.dueDate) : undefined,
			clientName: plainData.clientName,
			buyerTaxId,
			clientRUC: plainData.clientRUC
				? RUC.create(plainData.clientRUC)
				: undefined,
			clientDNI: plainData.clientDNI
				? DNI.create(plainData.clientDNI)
				: undefined,
			clientAddress: plainData.clientAddress,
			baseAmount: Money.fromCents(plainData.baseAmount, currency),
			taxAmount:
				plainData.taxAmount != null
					? Money.fromCents(plainData.taxAmount, currency)
					: Money.fromCents(plainData.igvAmount, currency),
			igvAmount: Money.fromCents(plainData.igvAmount, currency),
			totalAmount: Money.fromCents(plainData.totalAmount, currency),
			status: plainData.status as InvoiceStatus,
			fiscalStatus: (plainData.fiscalStatus ??
				plainData.status) as FiscalStatus,
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
	// ── Generic lifecycle transitions ──

	/**
	 * Mark as submitted (sent to tax authority).
	 * Updates both legacy status and generic fiscalStatus.
	 */
	markAsSent(authorityResponseCode?: string): Invoice {
		const currentStatus = this.props.fiscalStatus ?? this.props.status;
		if (currentStatus !== "PENDING_REVIEW" && this.props.status !== "PENDING") {
			throw new Error("Solo se pueden enviar facturas en estado PENDING");
		}

		return new Invoice({
			...this.props,
			status: "SENT",
			fiscalStatus: "SUBMITTED",
			sunatResponseCode: authorityResponseCode,
			sentToSunatAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * Mark as accepted by the tax authority.
	 * Updates both legacy status and generic fiscalStatus.
	 */
	markAsAccepted(): Invoice {
		const currentStatus = this.props.fiscalStatus ?? this.props.status;
		if (currentStatus !== "SUBMITTED" && this.props.status !== "SENT") {
			throw new Error("Solo se pueden aceptar facturas en estado SENT");
		}

		return new Invoice({
			...this.props,
			status: "ACCEPTED",
			fiscalStatus: "ACCEPTED",
			updatedAt: new Date(),
		});
	}

	/**
	 * Mark as rejected by the tax authority.
	 * Updates both legacy status and generic fiscalStatus.
	 *
	 * @param reason - Razón del rechazo.
	 */
	markAsRejected(reason: string): Invoice {
		const currentStatus = this.props.fiscalStatus ?? this.props.status;
		if (currentStatus !== "SUBMITTED" && this.props.status !== "SENT") {
			throw new Error("Solo se pueden rechazar facturas en estado SENT");
		}

		return new Invoice({
			...this.props,
			status: "REJECTED",
			fiscalStatus: "REJECTED",
			notes: reason,
			updatedAt: new Date(),
		});
	}

	/**
	 * Anula la factura.
	 * Updates both legacy status and generic fiscalStatus.
	 */
	cancel(): Invoice {
		const currentStatus = this.props.fiscalStatus ?? this.props.status;
		if (
			currentStatus === "SUBMITTED" ||
			currentStatus === "ACCEPTED" ||
			this.props.status === "SENT" ||
			this.props.status === "ACCEPTED"
		) {
			throw new Error(
				"No se pueden cancelar facturas enviadas a SUNAT. Use Nota de Crédito.",
			);
		}

		return new Invoice({
			...this.props,
			status: "CANCELLED",
			fiscalStatus: "CANCELLED",
			updatedAt: new Date(),
		});
	}

	/**
	 * Verifica si la factura puede ser modificada.
	 *
	 * @returns `true` si está en borrador o pendiente/review, `false` de lo contrario.
	 */
	canBeModified(): boolean {
		const s = this.props.fiscalStatus ?? this.props.status;
		return (
			s === "DRAFT" || s === "PENDING_REVIEW" || this.props.status === "PENDING"
		);
	}

	/**
	 * Verifica si la factura está vencida.
	 */
	isOverdue(): boolean {
		if (!this.props.dueDate) {
			return false;
		}
		const s = this.props.fiscalStatus ?? this.props.status;
		return this.props.dueDate < new Date() && s !== "CANCELLED";
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

	// ── Getters (legacy) ──
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

	/** @deprecated Use buyerTaxId instead. */
	get clientRUC(): RUC | undefined {
		return this.props.clientRUC;
	}

	/** @deprecated Use buyerTaxId instead. */
	get clientDNI(): DNI | undefined {
		return this.props.clientDNI;
	}

	get clientAddress(): string | undefined {
		return this.props.clientAddress;
	}

	get baseAmount(): Money {
		return this.props.baseAmount;
	}

	/** @deprecated Use taxAmount instead. */
	get igvAmount(): Money {
		return this.props.igvAmount;
	}

	get totalAmount(): Money {
		return this.props.totalAmount;
	}

	/** @deprecated Use fiscalStatus instead. */
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

	/** @deprecated Will be abstracted behind TaxAuthorityPort. */
	get sentToSunatAt(): Date | undefined {
		return this.props.sentToSunatAt;
	}

	/** @deprecated Will be abstracted behind TaxAuthorityPort. */
	get sunatResponseCode(): string | undefined {
		return this.props.sunatResponseCode;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	// ── Getters (generic) ──

	/**
	 * Generic buyer tax identifier (RUC in PE, RFC in MX, CUIT in AR, etc.).
	 * Preferred over `clientRUC` / `clientDNI`.
	 */
	get buyerTaxId(): TaxIdentifier | undefined {
		return this.props.buyerTaxId;
	}

	/**
	 * Generic tax amount (IGV in PE, IVA in MX/AR, VAT in CL).
	 * Preferred over `igvAmount`.
	 */
	get taxAmount(): Money | undefined {
		return this.props.taxAmount;
	}

	/**
	 * Generic fiscal lifecycle status.
	 * Preferred over `status`.
	 */
	get fiscalStatus(): FiscalStatus | undefined {
		return this.props.fiscalStatus;
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
			// Generic fields
			buyerTaxId: this.props.buyerTaxId?.toString(),
			buyerTaxType: this.props.buyerTaxId?.type,
			taxAmount: this.props.taxAmount?.toJSON(),
			fiscalStatus: this.props.fiscalStatus,
			// Legacy fields
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
