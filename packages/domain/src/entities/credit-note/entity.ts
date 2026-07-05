/**
 * CreditNote Domain Entity.
 *
 * @description Represents a Peruvian SUNAT Nota de Crédito (Credit Note),
 * a correcting document that reduces or cancels invoice amounts following
 * strict SUNAT rules. Supports ANULACION (full cancellation), DESCUENTO
 * (discount), DEVOLUCION (return), and OTROS (other) types.
 *
 * @business_rules
 * - Series must be FC01 (Factura credit note) or BC01 (Boleta credit note).
 * - Total MUST equal Base Amount + IGV Amount.
 * - Amount cannot exceed the referenced invoice total.
 * - ANULACION type requires full cancellation of the referenced invoice.
 * - Immutability: Once SENT, financial data cannot be modified.
 *
 * @domain Entity
 * @immutable
 * @since 1.0.0
 */

import type { Currency } from "../../types/currency";
import { DocumentSeries } from "../../value-objects/DocumentSeries";
import { Money } from "../../value-objects/Money";
import type {
	CreditNotePrimitiveData,
	CreditNoteProps,
	CreditNoteStatus,
	CreditNoteType,
} from "./types";

/**
 * CreditNote domain entity representing a SUNAT Nota de Crédito.
 *
 * @example
 * ```ts
 * const cn = CreditNote.create(props);
 * const sent = cn.markAsSent("ACEPTADO");
 * ```
 */
export class CreditNote {
	private constructor(private props: CreditNoteProps) {
		this.validateBusinessRules();
		Object.freeze(this);
	}

	/**
	 * Creates a new CreditNote entity with business rule validation.
	 *
	 * @param props - The credit note properties
	 * @returns A new immutable CreditNote instance
	 */
	static create(props: CreditNoteProps): CreditNote {
		return new CreditNote(props);
	}

	/**
	 * Reconstructs a CreditNote from primitive data (DB or API).
	 *
	 * @param data - Primitive data object
	 * @returns A CreditNote instance
	 */
	static fromPrimitives(data: CreditNotePrimitiveData): CreditNote {
		const currency = data.currency as Currency;

		const props: CreditNoteProps = {
			id: data.id,
			referenceInvoiceId: data.referenceInvoiceId,
			referenceInvoiceTotal: data.referenceInvoiceTotal,
			creditNoteType: data.creditNoteType as CreditNoteType,
			reason: data.reason,
			series: DocumentSeries.create(data.series),
			number: data.number,
			totalAmount: Money.fromCents(data.totalAmount, currency),
			baseAmount: Money.fromCents(data.baseAmount, currency),
			igvAmount: Money.fromCents(data.igvAmount, currency),
			currency,
			status: data.status as CreditNoteStatus,
			sunatResponseCode: data.sunatResponseCode,
			sentToSunatAt: data.sentToSunatAt
				? new Date(data.sentToSunatAt)
				: undefined,
			issueDate: new Date(data.issueDate),
			createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
			updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
		};

		return new CreditNote(props);
	}

	/**
	 * Validates all business rule invariants.
	 *
	 * @throws Error when any rule is violated
	 */
	private validateBusinessRules(): void {
		// Rule 1: Series must be a credit note series (FC01 or BC01)
		if (!this.props.series.isCreditNote()) {
			throw new Error(
				`Serie inválida para nota de crédito: ${this.props.series.toString()}. Debe ser FC01 o BC01.`,
			);
		}

		// Rule 2: Total must equal base + IGV
		const expectedTotal = this.props.baseAmount.add(this.props.igvAmount);
		if (!this.props.totalAmount.equals(expectedTotal)) {
			throw new Error(
				`El total (${this.props.totalAmount.getAmount()}) debe ser igual a base + IGV (${expectedTotal.getAmount()})`,
			);
		}

		// Rule 3: Amount cannot exceed referenced invoice total (if provided)
		if (this.props.referenceInvoiceTotal !== undefined) {
			const currentAmount = this.props.totalAmount.getCents();
			if (currentAmount > this.props.referenceInvoiceTotal) {
				throw new Error(
					`El monto de la nota de crédito (${currentAmount}) no puede exceder el total de la factura referenciada (${this.props.referenceInvoiceTotal})`,
				);
			}
		}

		// Rule 4: Issue date cannot be in the future
		if (this.props.issueDate > new Date()) {
			throw new Error("La fecha de emisión no puede ser futura");
		}

		// Rule 5: Credit note number must be positive
		if (this.props.number <= 0) {
			throw new Error("El número de nota de crédito debe ser positivo");
		}

		// Rule 6: Reason is required
		if (!this.props.reason || this.props.reason.trim().length === 0) {
			throw new Error("La nota de crédito debe tener una razón");
		}
	}

	// ─── State Transitions ───────────────────────────────────────

	/**
	 * Marks the credit note as sent to SUNAT.
	 *
	 * @param sunatResponseCode - SUNAT response code
	 * @returns A new CreditNote instance with SENT status
	 */
	markAsSent(sunatResponseCode: string): CreditNote {
		if (this.props.status !== "DRAFT") {
			throw new Error("Solo se pueden enviar notas de crédito en estado DRAFT");
		}

		return new CreditNote({
			...this.props,
			status: "SENT",
			sunatResponseCode,
			sentToSunatAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * Marks the credit note as accepted by SUNAT.
	 *
	 * @returns A new CreditNote instance with ACCEPTED status
	 */
	markAsAccepted(): CreditNote {
		if (this.props.status !== "SENT") {
			throw new Error("Solo se pueden aceptar notas de crédito en estado SENT");
		}

		return new CreditNote({
			...this.props,
			status: "ACCEPTED",
			updatedAt: new Date(),
		});
	}

	/**
	 * Marks the credit note as rejected by SUNAT.
	 *
	 * @param reason - Rejection reason
	 * @returns A new CreditNote instance with REJECTED status
	 */
	markAsRejected(reason: string): CreditNote {
		if (this.props.status !== "SENT") {
			throw new Error(
				"Solo se pueden rechazar notas de crédito en estado SENT",
			);
		}

		return new CreditNote({
			...this.props,
			status: "REJECTED",
			reason,
			updatedAt: new Date(),
		});
	}

	// ─── Business Queries ────────────────────────────────────────

	/**
	 * Checks if this credit note represents a full invoice cancellation.
	 */
	isFullCancellation(): boolean {
		return this.props.creditNoteType === "ANULACION";
	}

	/**
	 * Determines whether the credit note can be modified.
	 */
	canBeModified(): boolean {
		return this.props.status === "DRAFT";
	}

	/**
	 * Compares two credit notes by ID.
	 */
	equals(other: CreditNote | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	/**
	 * Gets the full document number (e.g., "FC01-00000001").
	 */
	getFullNumber(): string {
		return `${this.props.series.toString()}-${this.props.number.toString().padStart(8, "0")}`;
	}

	// ─── Getters ─────────────────────────────────────────────────

	get id(): string {
		return this.props.id;
	}
	get referenceInvoiceId(): string {
		return this.props.referenceInvoiceId;
	}
	get referenceInvoiceTotal(): number | undefined {
		return this.props.referenceInvoiceTotal;
	}
	get creditNoteType(): CreditNoteType {
		return this.props.creditNoteType;
	}
	get reason(): string {
		return this.props.reason;
	}
	get series(): DocumentSeries {
		return this.props.series;
	}
	get number(): number {
		return this.props.number;
	}
	get totalAmount(): Money {
		return this.props.totalAmount;
	}
	get baseAmount(): Money {
		return this.props.baseAmount;
	}
	get igvAmount(): Money {
		return this.props.igvAmount;
	}
	get currency(): Currency {
		return this.props.currency;
	}
	get status(): CreditNoteStatus {
		return this.props.status;
	}
	get sunatResponseCode(): string | undefined {
		return this.props.sunatResponseCode;
	}
	get sentToSunatAt(): Date | undefined {
		return this.props.sentToSunatAt;
	}
	get issueDate(): Date {
		return this.props.issueDate;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	/**
	 * Serializes to a plain JSON object.
	 */
	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			referenceInvoiceId: this.props.referenceInvoiceId,
			referenceInvoiceTotal: this.props.referenceInvoiceTotal,
			creditNoteType: this.props.creditNoteType,
			reason: this.props.reason,
			series: this.props.series.toString(),
			number: this.props.number,
			totalAmount: this.props.totalAmount.toJSON(),
			baseAmount: this.props.baseAmount.toJSON(),
			igvAmount: this.props.igvAmount.toJSON(),
			currency: this.props.currency,
			status: this.props.status,
			sunatResponseCode: this.props.sunatResponseCode,
			sentToSunatAt: this.props.sentToSunatAt?.toISOString(),
			issueDate: this.props.issueDate.toISOString(),
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
