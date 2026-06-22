/**
 * InvoiceSentToSunat Domain Event
 * Triggered when an invoice is sent to SUNAT
 */

import { DomainEvent } from "./DomainEvent";

/**
 * Domain event emitted when an invoice is sent to SUNAT.
 *
 * @example
 * ```ts
 * const event = new InvoiceSentToSunat("inv_123", "0");
 * const payload = event.toJSON();
 * ```
 */
export class InvoiceSentToSunat extends DomainEvent {
	constructor(
		public readonly invoiceId: string,
		public readonly sunatResponseCode: string,
	) {
		super();
	}

	get eventName(): string {
		return "invoice.sent_to_sunat";
	}

	protected getPayload(): Record<string, unknown> {
		return {
			invoiceId: this.invoiceId,
			sunatResponseCode: this.sunatResponseCode,
		};
	}
}
