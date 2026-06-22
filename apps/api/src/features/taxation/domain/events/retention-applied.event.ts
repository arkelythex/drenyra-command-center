import { DomainEvent } from "@arkelythex/domain/events/DomainEvent";
import type { Money } from "@arkelythex/domain/value-objects/Money";

/**
 * Domain event emitted when a retention is created from a bill.
 *
 * @example
 * ```ts
 * const event = new RetentionApplied('c1', 'r1', 'b1', '20100070970', base, amount, '2026-03', new Date());
 * ```
 */
export class RetentionApplied extends DomainEvent {
	constructor(
		public readonly companyId: string,
		public readonly retentionId: string,
		public readonly billId: string,
		public readonly supplierRuc: string,
		public readonly baseAmount: Money,
		public readonly retentionAmount: Money,
		public readonly declarationPeriod: string,
		public readonly sunatDueDate: Date,
	) {
		super();
	}

	get eventName(): string {
		return "taxation.retention.applied";
	}

	protected getPayload(): Record<string, unknown> {
		return this.toPayload();
	}

	/**
	 * Public serialization for EventBus publishing.
	 *
	 * @example
	 * ```ts
	 * eventBus.publish('taxation.retention.applied', event.toPayload());
	 * ```
	 */
	toPayload(): Record<string, unknown> {
		return {
			companyId: this.companyId,
			retentionId: this.retentionId,
			billId: this.billId,
			supplierRuc: this.supplierRuc,
			baseAmountCents: this.baseAmount.getCents(),
			retentionAmountCents: this.retentionAmount.getCents(),
			currency: this.baseAmount.getCurrency(),
			declarationPeriod: this.declarationPeriod,
			sunatDueDate: this.sunatDueDate.toISOString(),
		};
	}
}
