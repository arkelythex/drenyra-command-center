import { DomainEvent } from "@drenyra/domain/events/DomainEvent";
import type { Money } from "@drenyra/domain/value-objects/Money";

/**
 * Domain event emitted when a declared retention is paid.
 *
 * @example
 * ```ts
 * const event = new RetentionPaid('c1', 'r1', 'tx1', amount, new Date());
 * ```
 */
export class RetentionPaid extends DomainEvent {
	constructor(
		public readonly companyId: string,
		public readonly retentionId: string,
		public readonly bankTransactionId: string,
		public readonly retentionAmount: Money,
		public readonly paidAt: Date,
	) {
		super();
	}

	get eventName(): string {
		return "taxation.retention.paid";
	}

	protected getPayload(): Record<string, unknown> {
		return this.toPayload();
	}

	/** Public serialization for EventBus publishing. */
	toPayload(): Record<string, unknown> {
		return {
			companyId: this.companyId,
			retentionId: this.retentionId,
			bankTransactionId: this.bankTransactionId,
			retentionAmountCents: this.retentionAmount.getCents(),
			currency: this.retentionAmount.getCurrency(),
			paidAt: this.paidAt.toISOString(),
		};
	}
}
