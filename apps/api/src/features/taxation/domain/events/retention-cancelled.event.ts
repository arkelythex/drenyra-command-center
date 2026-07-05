import { DomainEvent } from "@drenyra/domain/events/DomainEvent";

/**
 * Domain event emitted when a retention is cancelled.
 *
 * @example
 * ```ts
 * const event = new RetentionCancelled('c1', 'r1', 'duplicate', new Date());
 * ```
 */
export class RetentionCancelled extends DomainEvent {
	constructor(
		public readonly companyId: string,
		public readonly retentionId: string,
		public readonly reason: string,
		public readonly cancelledAt: Date,
	) {
		super();
	}

	get eventName(): string {
		return "taxation.retention.cancelled";
	}

	protected getPayload(): Record<string, unknown> {
		return this.toPayload();
	}

	/** Public serialization for EventBus publishing. */
	toPayload(): Record<string, unknown> {
		return {
			companyId: this.companyId,
			retentionId: this.retentionId,
			reason: this.reason,
			cancelledAt: this.cancelledAt.toISOString(),
		};
	}
}
