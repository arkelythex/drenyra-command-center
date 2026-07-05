/**
 * Builder pattern for CreditNote (Nota de Crédito) test data.
 *
 * Creates valid SUNAT-compliant credit note test data for nota de crédito
 * scenarios, including invoice referencing, amount validation, and
 * automatic ANULACION detection.
 *
 * NOTE: CreditNote domain entity does not yet exist in @drenyra/domain.
 * This builder uses a plain props interface as the built type until the
 * domain entity is implemented.
 *
 * @example
 * ```ts
 * const note = new CreditNoteBuilder()
 *   .withReferenceInvoice("inv_test_001")
 *   .withReason("Anulación por error")
 *   .withAmount(1000)
 *   .build();
 * ```
 */

import type {
	CreditNoteStatus,
	CreditNoteType,
	Currency,
} from "@drenyra/domain";
import { CreditNote, DocumentSeries, Money } from "@drenyra/domain";

import { BaseBuilder } from "./base.builder";

/**
 * Builder input interface — uses string for series during construction.
 */
interface CreditNoteBuilderData {
	id: string;
	referenceInvoiceId: string;
	referenceInvoiceTotal?: number;
	creditNoteType: CreditNoteType;
	reason: string;
	series: string;
	number: number;
	totalAmount: Money;
	baseAmount: Money;
	igvAmount: Money;
	currency: Currency;
	status: CreditNoteStatus;
	issueDate: Date;
	createdAt: Date;
	updatedAt: Date;
}

const DEFAULT_CREDIT_NOTE_ID = "cn_test_001";
const DEFAULT_REFERENCE_INVOICE_ID = "inv_test_001";
const DEFAULT_REASON = "Anulación por error del cliente";
const DEFAULT_TYPE: CreditNoteType = "OTROS";
const DEFAULT_SERIES = "FC01";
const DEFAULT_NUMBER = 1;
const DEFAULT_AMOUNT = 1000;
const DEFAULT_CURRENCY: Currency = "PEN";
const DEFAULT_STATUS: CreditNoteStatus = "DRAFT";

export class CreditNoteBuilder extends BaseBuilder<
	Partial<CreditNoteBuilderData>,
	CreditNote
> {
	private referenceInvoiceTotal: number | null = null;

	constructor() {
		const today = new Date();
		today.setHours(today.getHours() - 1);

		const baseAmount = Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY);
		const igvAmount = baseAmount.multiply(0.18);
		const totalAmount = baseAmount.add(igvAmount);

		super({
			id: DEFAULT_CREDIT_NOTE_ID,
			referenceInvoiceId: DEFAULT_REFERENCE_INVOICE_ID,
			creditNoteType: DEFAULT_TYPE,
			reason: DEFAULT_REASON,
			series: DEFAULT_SERIES,
			number: DEFAULT_NUMBER,
			totalAmount,
			baseAmount,
			igvAmount,
			currency: DEFAULT_CURRENCY,
			status: DEFAULT_STATUS,
			issueDate: today,
			createdAt: today,
			updatedAt: today,
		});
	}

	/**
	 * Set the referenced invoice ID.
	 */
	withReferenceInvoice(invoiceId: string): this {
		return this.set({ referenceInvoiceId: invoiceId });
	}

	/**
	 * Set the reason for the credit note.
	 */
	withReason(reason: string): this {
		return this.set({ reason });
	}

	/**
	 * Set the credit note type.
	 */
	withCreditNoteType(type: CreditNoteType): this {
		return this.set({ creditNoteType: type });
	}

	/**
	 * Set the total amount of the credit note.
	 * Automatically recalculates base and IGV amounts.
	 *
	 * When the amount equals the referenced invoice total,
	 * the type is automatically set to ANULACION.
	 *
	 * @param amount - Total amount for the credit note
	 * @param currency - Currency (defaults to PEN)
	 */
	withAmount(amount: number, currency: Currency = DEFAULT_CURRENCY): this {
		const baseAmount = Money.fromAmount(amount / 1.18, currency);
		const igvAmount = baseAmount.multiply(0.18);
		const totalAmount = baseAmount.add(igvAmount);

		return this.set({
			totalAmount,
			baseAmount,
			igvAmount,
			currency,
		});
	}

	/**
	 * Set the series for the credit note.
	 * SUNAT convention: FC01 for factura credit notes, BC01 for boleta credit notes.
	 */
	withSeries(series: string): this {
		return this.set({ series });
	}

	/**
	 * Set the sequential number for the credit note.
	 */
	withNumber(num: number): this {
		return this.set({ number: num });
	}

	/**
	 * Set the credit note status.
	 */
	withStatus(status: CreditNoteStatus): this {
		return this.set({ status });
	}

	/**
	 * Set the referenced invoice total for amount validation.
	 * If the credit note amount equals this total, the type
	 * is automatically set to ANULACION.
	 */
	withReferenceInvoiceTotal(total: number): this {
		this.referenceInvoiceTotal = total;
		return this;
	}

	/**
	 * Build the CreditNote domain entity.
	 *
	 * Validates that the credit note amount does not exceed the
	 * referenced invoice total (if provided).
	 *
	 * @returns An immutable CreditNote entity
	 * @throws Error if the credit note amount exceeds the invoice total
	 */
	build(): CreditNote {
		// Determine if this is a full cancellation
		const currentAmount = this.data.totalAmount?.getAmount() ?? DEFAULT_AMOUNT;
		if (
			this.referenceInvoiceTotal !== null &&
			currentAmount > this.referenceInvoiceTotal
		) {
			throw new Error(
				`El monto de la nota de crédito (${currentAmount}) no puede exceder el total de la factura referenciada (${this.referenceInvoiceTotal})`,
			);
		}

		// Auto-detect ANULACION if amount equals invoice total
		let creditNoteType = this.data.creditNoteType ?? DEFAULT_TYPE;
		if (
			this.referenceInvoiceTotal !== null &&
			Math.abs(currentAmount - this.referenceInvoiceTotal) < 0.001
		) {
			creditNoteType = "ANULACION";
		}

		const today = new Date();
		today.setHours(today.getHours() - 1);

		return CreditNote.create({
			id: this.data.id ?? DEFAULT_CREDIT_NOTE_ID,
			referenceInvoiceId:
				this.data.referenceInvoiceId ?? DEFAULT_REFERENCE_INVOICE_ID,
			referenceInvoiceTotal: this.referenceInvoiceTotal ?? undefined,
			creditNoteType,
			reason: this.data.reason ?? DEFAULT_REASON,
			series: DocumentSeries.create(this.data.series ?? DEFAULT_SERIES),
			number: this.data.number ?? DEFAULT_NUMBER,
			totalAmount:
				this.data.totalAmount ??
				Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY).add(
					Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY).multiply(0.18),
				),
			baseAmount:
				this.data.baseAmount ??
				Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY),
			igvAmount:
				this.data.igvAmount ??
				Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY).multiply(0.18),
			currency: this.data.currency ?? DEFAULT_CURRENCY,
			status: this.data.status ?? DEFAULT_STATUS,
			issueDate: this.data.issueDate ?? today,
			createdAt: this.data.createdAt ?? today,
			updatedAt: this.data.updatedAt ?? today,
		});
	}
}
