/**
 * Events barrel — re-exports all domain events and the event emitter interface
 */

export {
	ActValidatedEvent,
	AuditCompletedEvent,
	CaseEscalatedEvent,
	FraudDetectedEvent,
} from "./domain-events";
export type { EventEmitter } from "./event-emitter";
