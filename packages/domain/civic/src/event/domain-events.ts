/**
 * Civic Domain Events
 *
 * Domain events for the Arkelythex civic vertical.
 * Each event extends the base DomainEvent from @arkelythex/domain.
 */

import { DomainEvent } from "@arkelythex/domain";
import type { FraudIndicator } from "../value-object/FraudIndicator";

/**
 * ActValidatedEvent — emitted when an electoral act is validated
 */
export class ActValidatedEvent extends DomainEvent {
	constructor(
		public readonly aggregateId: string,
		public readonly actId: string,
		public readonly validatorId: string,
		public readonly result: "approved" | "rejected" | "needs-review",
	) {
		super();
	}

	get eventName(): string {
		return "civic.act.validated";
	}

	protected getPayload(): Record<string, unknown> {
		return {
			aggregateId: this.aggregateId,
			aggregateType: "ElectoralAct",
			actId: this.actId,
			validatorId: this.validatorId,
			result: this.result,
		};
	}
}

/**
 * FraudDetectedEvent — emitted when fraud is detected in an election
 */
export class FraudDetectedEvent extends DomainEvent {
	constructor(
		public readonly aggregateId: string,
		public readonly electionId: string,
		public readonly actId: string,
		public readonly indicator: FraudIndicator,
		public readonly severity: string,
	) {
		super();
	}

	get eventName(): string {
		return "civic.fraud.detected";
	}

	protected getPayload(): Record<string, unknown> {
		return {
			aggregateId: this.aggregateId,
			aggregateType: "Election",
			electionId: this.electionId,
			actId: this.actId,
			indicator: this.indicator.toJSON(),
			severity: this.severity,
		};
	}
}

/**
 * AuditCompletedEvent — emitted when an audit trail is completed
 */
export class AuditCompletedEvent extends DomainEvent {
	constructor(
		public readonly aggregateId: string,
		public readonly actId: string,
		public readonly auditId: string,
		public readonly findings: readonly string[],
	) {
		super();
	}

	get eventName(): string {
		return "civic.audit.completed";
	}

	protected getPayload(): Record<string, unknown> {
		return {
			aggregateId: this.aggregateId,
			aggregateType: "AuditTrail",
			actId: this.actId,
			auditId: this.auditId,
			findings: [...this.findings],
		};
	}
}

/**
 * CaseEscalatedEvent — emitted when a civic case is escalated
 */
export class CaseEscalatedEvent extends DomainEvent {
	constructor(
		public readonly aggregateId: string,
		public readonly caseId: string,
		public readonly reason: string,
		public readonly escalatedTo: string,
	) {
		super();
	}

	get eventName(): string {
		return "civic.case.escalated";
	}

	protected getPayload(): Record<string, unknown> {
		return {
			aggregateId: this.aggregateId,
			aggregateType: "CivicCase",
			caseId: this.caseId,
			reason: this.reason,
			escalatedTo: this.escalatedTo,
		};
	}
}
