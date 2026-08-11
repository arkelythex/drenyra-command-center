/**
 * DebitNote Domain Entity.
 *
 * @description Represents a Peruvian SUNAT Nota de Débito (Debit Note),
 * a correcting document that increases invoice amounts following strict
 * SUNAT rules. Used to charge additional amounts not included in the
 * original invoice.
 *
 * @business_rules
 * - Series must be FD01 (Factura debit note) or BD01 (Boleta debit note).
 * - Total MUST equal Base Amount + IGV Amount.
 * - The additional amount (baseAmount) represents the extra charge.
 * - Immutability: Once SENT, financial data cannot be modified.
 *
 * @domain Entity
 * @immutable
 * @since 1.0.0
 */

import type { Currency } from "../types/currency";
import { DocumentSeries } from "../value-objects/DocumentSeries";
import { Money } from "../value-objects/Money";

/**
 * Debit note lifecycle status.
 *
 * - DRAFT: Initial state, editable
 * - SENT: Sent to SUNAT
 * - ACCEPTED: Accepted by SUNAT
 * - REJECTED: Rejected by SUNAT
 */
export type DebitNoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

/**
 * Properties for creating a DebitNote entity.
 */
export interface DebitNoteProps {
	id: string;
	referenceInvoiceId: string;
	additionalAmount: Money;
	totalAmount: Money;
	baseAmount: Money;
	igvAmount: Money;
	currency: Currency;
	reason: string;
	series: DocumentSeries;
	number: number;
	status: DebitNoteStatus;
	sunatResponseCode?: string | undefined;
	sentToSunatAt?: Date | undefined;
	issueDate: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Primitive data representation for reconstructing DebitNote from DB/API.
 */
export interface DebitNotePrimitiveData {
	id: string;
	referenceInvoiceId: string;
	additionalAmount: number;
	totalAmount: number;
	baseAmount: number;
	igvAmount: number;
	currency: string;
	reason: string;
	series: string;
	number: number;
	status: string;
	sunatResponseCode?: string;
	sentToSunatAt?: string | Date;
	issueDate: string | Date;
	createdAt?: string | Date;
	updatedAt?: string | Date;
}

/**
 * DebitNote domain entity representing a SUNAT Nota de Débito.
 *
 * @example
 * ```ts
 * const dn = DebitNote.create(props);
 * const sent = dn.markAsSent("ACEPTADO");
 * ```
 */
export class DebitNote {
	private constructor(private props: DebitNoteProps) {
		this.validateBusinessRules();
		Object.freeze(this);
	}

	/**
	 * Creates a new DebitNote entity with business rule validation.
	 *
	 * @param props - The debit note properties
	 * @returns A new immutable DebitNote instance
	 */
	static create(props: DebitNoteProps): DebitNote {
		return new DebitNote(props);
	}

	/**
	 * Reconstructs a DebitNote from primitive data (DB or API).
	 *
	 * @param data - Primitive data object
	 * @returns A DebitNote instance
	 */
	static fromPrimitives(data: DebitNotePrimitiveData): DebitNote {
		const currency = data.currency as Currency;

		const props: DebitNoteProps = {
			id: data.id,
			referenceInvoiceId: data.referenceInvoiceId,
			additionalAmount: Money.fromCents(data.additionalAmount, currency),
			totalAmount: Money.fromCents(data.totalAmount, currency),
			baseAmount: Money.fromCents(data.baseAmount, currency),
			igvAmount: Money.fromCents(data.igvAmount, currency),
			currency,
			reason: data.reason,
			series: DocumentSeries.create(data.series),
			number: data.number,
			status: data.status as DebitNoteStatus,
			sunatResponseCode: data.sunatResponseCode,
			sentToSunatAt: data.sentToSunatAt
				? new Date(data.sentToSunatAt)
				: undefined,
			issueDate: new Date(data.issueDate),
			createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
			updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
		};

		return new DebitNote(props);
	}

	/**
	 * Validates all business rule invariants.
	 *
	 * @throws Error when any rule is violated
	 */
	private validateBusinessRules(): void {
		// Rule 1: Series must be a debit note series (FD01 or BD01)
		if (!this.props.series.isDebitNote()) {
			throw new Error(
				`Serie inválida para nota de débito: ${this.props.series.toString()}. Debe ser FD01 o BD01.`,
			);
		}

		// Rule 2: Total must equal base + IGV
		const expectedTotal = this.props.baseAmount.add(this.props.igvAmount);
		if (!this.props.totalAmount.equals(expectedTotal)) {
			throw new Error(
				`El total (${this.props.totalAmount.getAmount()}) debe ser igual a base + IGV (${expectedTotal.getAmount()})`,
			);
		}

		// Rule 3: Additional amount must be positive
		if (!this.props.baseAmount.isPositive()) {
			throw new Error(
				"El monto adicional de la nota de débito debe ser positivo",
			);
		}

		// Rule 4: Issue date cannot be in the future
		if (this.props.issueDate > new Date()) {
			throw new Error("La fecha de emisión no puede ser futura");
		}

		// Rule 5: Debit note number must be positive
		if (this.props.number <= 0) {
			throw new Error("El número de nota de débito debe ser positivo");
		}

		// Rule 6: Reason is required
		if (!this.props.reason || this.props.reason.trim().length === 0) {
			throw new Error("La nota de débito debe tener una razón");
		}
	}

	// ─── State Transitions ───────────────────────────────────────

	/**
	 * Marks the debit note as sent to SUNAT.
	 *
	 * @param sunatResponseCode - SUNAT response code
	 * @returns A new DebitNote instance with SENT status
	 */
	markAsSent(sunatResponseCode: string): DebitNote {
		if (this.props.status !== "DRAFT") {
			throw new Error("Solo se pueden enviar notas de débito en estado DRAFT");
		}

		return new DebitNote({
			...this.props,
			status: "SENT",
			sunatResponseCode,
			sentToSunatAt: new Date(),
			updatedAt: new Date(),
		});
	}

	/**
	 * Marks the debit note as accepted by SUNAT.
	 *
	 * @returns A new DebitNote instance with ACCEPTED status
	 */
	markAsAccepted(): DebitNote {
		if (this.props.status !== "SENT") {
			throw new Error("Solo se pueden aceptar notas de débito en estado SENT");
		}

		return new DebitNote({
			...this.props,
			status: "ACCEPTED",
			updatedAt: new Date(),
		});
	}

	/**
	 * Marks the debit note as rejected by SUNAT.
	 *
	 * @param reason - Rejection reason
	 * @returns A new DebitNote instance with REJECTED status
	 */
	markAsRejected(reason: string): DebitNote {
		if (this.props.status !== "SENT") {
			throw new Error("Solo se pueden rechazar notas de débito en estado SENT");
		}

		return new DebitNote({
			...this.props,
			status: "REJECTED",
			reason,
			updatedAt: new Date(),
		});
	}

	// ─── Business Queries ────────────────────────────────────────

	/**
	 * Determines whether the debit note can be modified.
	 */
	canBeModified(): boolean {
		return this.props.status === "DRAFT";
	}

	/**
	 * Compares two debit notes by ID.
	 */
	equals(other: DebitNote | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	/**
	 * Gets the full document number (e.g., "FD01-00000001").
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
	get additionalAmount(): Money {
		return this.props.additionalAmount;
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
	get reason(): string {
		return this.props.reason;
	}
	get series(): DocumentSeries {
		return this.props.series;
	}
	get number(): number {
		return this.props.number;
	}
	get status(): DebitNoteStatus {
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
			additionalAmount: this.props.additionalAmount.toJSON(),
			totalAmount: this.props.totalAmount.toJSON(),
			baseAmount: this.props.baseAmount.toJSON(),
			igvAmount: this.props.igvAmount.toJSON(),
			currency: this.props.currency,
			reason: this.props.reason,
			series: this.props.series.toString(),
			number: this.props.number,
			status: this.props.status,
			sunatResponseCode: this.props.sunatResponseCode,
			sentToSunatAt: this.props.sentToSunatAt?.toISOString(),
			issueDate: this.props.issueDate.toISOString(),
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
