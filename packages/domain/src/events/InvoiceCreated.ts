/**
 * InvoiceCreated Domain Event
 * Triggered when a new invoice is created
 */

import { DomainEvent } from "./DomainEvent";

/**
 * Domain event emitted when a new invoice is created.
 *
 * @example
 * ```ts
 * const event = new InvoiceCreated(
 *   "inv_123",
 *   "F001",
 *   1234,
 *   "ACME S.A.C.",
 *   11800,
 *   "PEN",
 * );
 *
 * const payload = event.toJSON();
 * ```
 */
export class InvoiceCreated extends DomainEvent {
	constructor(
		public readonly invoiceId: string,
		public readonly series: string,
		public readonly number: number,
		public readonly clientName: string,
		public readonly totalAmount: number,
		public readonly currency: string,
	) {
		super();
	}

	get eventName(): string {
		return "invoice.created";
	}

	protected getPayload(): Record<string, unknown> {
		return {
			invoiceId: this.invoiceId,
			series: this.series,
			number: this.number,
			clientName: this.clientName,
			totalAmount: this.totalAmount,
			currency: this.currency,
		};
	}
}
