/**
 * EventEmitter — Port interface for publishing domain events
 *
 * Framework-free: implement with any messaging infrastructure
 * (in-memory bus, RabbitMQ, Kafka, SQS, etc.)
 */

import type { DomainEvent } from "@arkelythex/domain";

export interface EventEmitter {
	emit(event: DomainEvent): Promise<void>;
	emitMany(events: DomainEvent[]): Promise<void>;
}
