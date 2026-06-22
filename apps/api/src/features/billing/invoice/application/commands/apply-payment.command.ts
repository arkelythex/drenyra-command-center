/**
 * Apply Payment Command
 * Records a payment against an invoice
 *
 * @layer Application (Command)
 * @pattern CQRS Write Model
 */

import type { Currency } from "@arkelythex/domain";
import { Money } from "@arkelythex/domain";
import type { IInvoiceRepository } from "../../domain/invoice.repository.interface";
import { InvoiceRepository } from "../../infrastructure/invoice.repository";

export interface ApplyPaymentInput {
	invoiceId: string;
	amount: string;
	currency: Currency;
}

/**
 * @deprecated Use applyInvoicePayment() function instead.
 */
export class ApplyPaymentCommand {
	constructor(
		private readonly repository: IInvoiceRepository = new InvoiceRepository(),
	) {}

	async execute(input: ApplyPaymentInput): Promise<void> {
		const invoice = await this.repository.findById(input.invoiceId);
		if (!invoice) {
			throw new Error("Invoice not found");
		}

		if (invoice.currency !== input.currency) {
			throw new Error(
				`Currency mismatch: invoice is in ${invoice.currency}, payment is in ${input.currency}`,
			);
		}

		const paymentAmount = Money.fromAmount(
			parseFloat(input.amount),
			input.currency,
		);
		if (paymentAmount.toNumber() > invoice.balanceDue.toNumber()) {
			throw new Error(
				`Payment amount ${input.amount} exceeds balance due ${invoice.balanceDue.toString()}`,
			);
		}

		await this.repository.applyPayment(input.invoiceId, input.amount);
	}
}

export async function applyInvoicePayment(
	input: ApplyPaymentInput,
): Promise<void> {
	const repository = new InvoiceRepository();

	const invoice = await repository.findById(input.invoiceId);
	if (!invoice) {
		throw new Error("Invoice not found");
	}

	if (invoice.currency !== input.currency) {
		throw new Error(
			`Currency mismatch: invoice is in ${invoice.currency}, payment is in ${input.currency}`,
		);
	}

	const paymentAmount = Money.fromAmount(
		parseFloat(input.amount),
		input.currency,
	);
	if (paymentAmount.toNumber() > invoice.balanceDue.toNumber()) {
		throw new Error(
			`Payment amount ${input.amount} exceeds balance due ${invoice.balanceDue.toString()}`,
		);
	}

	await repository.applyPayment(input.invoiceId, input.amount);
}
