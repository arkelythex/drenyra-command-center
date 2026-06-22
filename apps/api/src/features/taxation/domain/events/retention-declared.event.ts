import { DomainEvent } from "@arkelythex/domain/events/DomainEvent";
import type { Money } from "@arkelythex/domain/value-objects/Money";

/**
 * Domain event emitted when a retention is declared to SUNAT.
 *
 * @example
 * ```ts
 * const event = new RetentionDeclared('c1', 'r1', '2026-03', 'PDT-001', amount, new Date());
 * ```
 */
export class RetentionDeclared extends DomainEvent {
	constructor(
		public readonly companyId: string,
		public readonly retentionId: string,
		public readonly declarationPeriod: string,
		public readonly pdtReference: string,
		public readonly retentionAmount: Money,
		public readonly declaredAt: Date,
	) {
		super();
	}

	get eventName(): string {
		return "taxation.retention.declared";
	}

	protected getPayload(): Record<string, unknown> {
		return this.toPayload();
	}

	/** Public serialization for EventBus publishing. */
	toPayload(): Record<string, unknown> {
		return {
			companyId: this.companyId,
			retentionId: this.retentionId,
			declarationPeriod: this.declarationPeriod,
			pdtReference: this.pdtReference,
			retentionAmountCents: this.retentionAmount.getCents(),
			currency: this.retentionAmount.getCurrency(),
			declaredAt: this.declaredAt.toISOString(),
		};
	}
}
