/**
 * Builder pattern for DebitNote (Nota de Débito) test data.
 *
 * Creates valid SUNAT-compliant debit note test data for nota de débito
 * scenarios, including invoice referencing, additional amount calculation,
 * and automatic IGV (18%) application.
 *
 * NOTE: DebitNote domain entity does not yet exist in @arkelythex/domain.
 * This builder uses a plain props interface as the built type until the
 * domain entity is implemented.
 *
 * @example
 * ```ts
 * const note = new DebitNoteBuilder()
 *   .withReferenceInvoice("inv_test_001")
 *   .withAdditionalAmount(200)
 *   .build();
 * ```
 */
import { DebitNote, DocumentSeries, Money } from "@arkelythex/domain";
import type { DebitNoteStatus, Currency } from "@arkelythex/domain";

import { BaseBuilder } from "./base.builder";

/**
 * Builder input interface — uses string for series during construction.
 */
interface DebitNoteBuilderData {
	id: string;
	referenceInvoiceId: string;
	additionalAmount: Money;
	totalAmount: Money;
	baseAmount: Money;
	igvAmount: Money;
	currency: Currency;
	reason: string;
	series: string;
	number: number;
	status: DebitNoteStatus;
	issueDate: Date;
	createdAt: Date;
	updatedAt: Date;
}

const DEFAULT_DEBIT_NOTE_ID = "dn_test_001";
const DEFAULT_REFERENCE_INVOICE_ID = "inv_test_001";
const DEFAULT_REASON = "Aumento del monto por error en facturación";
const DEFAULT_SERIES = "FD01";
const DEFAULT_NUMBER = 1;
const DEFAULT_ADDITIONAL_AMOUNT = 200;
const DEFAULT_CURRENCY: Currency = "PEN";
const DEFAULT_STATUS: DebitNoteStatus = "DRAFT";

export class DebitNoteBuilder extends BaseBuilder<
	Partial<DebitNoteBuilderData>,
	DebitNote
> {
	constructor() {
		const today = new Date();
		today.setHours(today.getHours() - 1);

		const additionalAmount = Money.fromAmount(
			DEFAULT_ADDITIONAL_AMOUNT,
			DEFAULT_CURRENCY,
		);
		const baseAmount = additionalAmount;
		const igvAmount = additionalAmount.multiply(0.18);
		const totalAmount = additionalAmount.add(igvAmount);

		super({
			id: DEFAULT_DEBIT_NOTE_ID,
			referenceInvoiceId: DEFAULT_REFERENCE_INVOICE_ID,
			additionalAmount,
			totalAmount,
			baseAmount,
			igvAmount,
			currency: DEFAULT_CURRENCY,
			reason: DEFAULT_REASON,
			series: DEFAULT_SERIES,
			number: DEFAULT_NUMBER,
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
	 * Set the additional amount being charged.
	 * Automatically recalculates IGV (18%) and total.
	 *
	 * @param amount - Additional amount before IGV
	 * @param currency - Currency (defaults to PEN)
	 */
	withAdditionalAmount(
		amount: number,
		currency: Currency = DEFAULT_CURRENCY,
	): this {
		const additionalAmount = Money.fromAmount(amount, currency);
		const igvAmount = additionalAmount.multiply(0.18);
		const totalAmount = additionalAmount.add(igvAmount);

		return this.set({
			additionalAmount,
			baseAmount: additionalAmount,
			igvAmount,
			totalAmount,
			currency,
		});
	}

	/**
	 * Set the reason for the debit note.
	 */
	withReason(reason: string): this {
		return this.set({ reason });
	}

	/**
	 * Set the series for the debit note.
	 * SUNAT convention: FD01 for factura debit notes, BD01 for boleta debit notes.
	 */
	withSeries(series: string): this {
		return this.set({ series });
	}

	/**
	 * Set the sequential number for the debit note.
	 */
	withNumber(num: number): this {
		return this.set({ number: num });
	}

	/**
	 * Set the debit note status.
	 */
	withStatus(status: DebitNoteStatus): this {
		return this.set({ status });
	}

	/**
	 * Build the DebitNote domain entity.
	 *
	 * Calculates total = additional amount + IGV (18%).
	 *
	 * @returns An immutable DebitNote entity
	 */
	build(): DebitNote {
		const today = new Date();
		today.setHours(today.getHours() - 1);

		const additionalAmount =
			this.data.additionalAmount ??
			Money.fromAmount(DEFAULT_ADDITIONAL_AMOUNT, DEFAULT_CURRENCY);

		// Recalculate to ensure IGV is current
		const igvAmount = additionalAmount.multiply(0.18);
		const totalAmount = additionalAmount.add(igvAmount);

		return DebitNote.create({
			id: this.data.id ?? DEFAULT_DEBIT_NOTE_ID,
			referenceInvoiceId:
				this.data.referenceInvoiceId ?? DEFAULT_REFERENCE_INVOICE_ID,
			additionalAmount,
			totalAmount,
			baseAmount: additionalAmount,
			igvAmount,
			currency: this.data.currency ?? DEFAULT_CURRENCY,
			reason: this.data.reason ?? DEFAULT_REASON,
			series: DocumentSeries.create(
				this.data.series ?? DEFAULT_SERIES,
			),
			number: this.data.number ?? DEFAULT_NUMBER,
			status: this.data.status ?? DEFAULT_STATUS,
			issueDate: this.data.issueDate ?? today,
			createdAt: this.data.createdAt ?? today,
			updatedAt: this.data.updatedAt ?? today,
		});
	}
}
