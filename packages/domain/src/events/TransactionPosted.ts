/**
 * TransactionPosted Domain Event
 * Triggered when a transaction is posted (made permanent)
 */

import { DomainEvent } from "./DomainEvent";

/**
 * Domain event emitted when a transaction is posted (made permanent).
 *
 * @example
 * ```ts
 * const event = new TransactionPosted(
 *   "trx_123",
 *   "SALE",
 *   11800,
 *   "PEN",
 *   "user_123",
 * );
 *
 * const payload = event.toJSON();
 * ```
 */
export class TransactionPosted extends DomainEvent {
	constructor(
		public readonly transactionId: string,
		public readonly type: string,
		public readonly amount: number,
		public readonly currency: string,
		public readonly postedBy: string,
	) {
		super();
	}

	get eventName(): string {
		return "transaction.posted";
	}

	protected getPayload(): Record<string, unknown> {
		return {
			transactionId: this.transactionId,
			type: this.type,
			amount: this.amount,
			currency: this.currency,
			postedBy: this.postedBy,
		};
	}
}
