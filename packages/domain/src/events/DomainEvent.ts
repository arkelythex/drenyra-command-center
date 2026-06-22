/**
 * Base Domain Event
 * All domain events must extend this class
 *
 * @example
 * ```ts
 * class ExampleEvent extends DomainEvent {
 *   get eventName(): string {
 *     return "example.event";
 *   }
 *
 *   protected getPayload(): Record<string, unknown> {
 *     return { foo: "bar" };
 *   }
 * }
 *
 * const event = new ExampleEvent();
 * const json = event.toJSON();
 * ```
 */

export abstract class DomainEvent {
	public readonly occurredOn: Date;
	public readonly eventId: string;

	constructor() {
		this.occurredOn = new Date();
		this.eventId = crypto.randomUUID();
	}

	abstract get eventName(): string;

	toPayload(): Record<string, unknown> {
		return this.getPayload();
	}

	toJSON(): Record<string, unknown> {
		return {
			eventId: this.eventId,
			eventName: this.eventName,
			occurredOn: this.occurredOn.toISOString(),
			...this.getPayload(),
		};
	}

	protected abstract getPayload(): Record<string, unknown>;
}
