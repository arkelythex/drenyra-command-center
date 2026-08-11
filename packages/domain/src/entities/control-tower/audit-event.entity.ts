import type { AuditEventType, FiscalScope } from "../../drenyra/types";
import type { AuditEventPrimitiveData, AuditEventProps } from "./types";
import { validateAuditEventProps } from "./validators";

export class AuditEvent {
	private constructor(private props: AuditEventProps) {
		validateAuditEventProps(this.props);
		Object.freeze(this);
	}

	static create(props: AuditEventProps): AuditEvent {
		return new AuditEvent(props);
	}

	static fromPrimitives(data: AuditEventPrimitiveData): AuditEvent {
		const props: AuditEventProps = {
			id: data.id,
			...(data.caseId !== undefined ? { caseId: data.caseId } : {}),
			scope: {
				companyId: data.scope.companyId,
				companyRuc: data.scope.companyRuc,
				...(data.scope.organizationId !== undefined
					? { organizationId: data.scope.organizationId }
					: {}),
				period: data.scope.period,
				countryCode: data.scope.countryCode as "PE",
			},
			eventType: data.eventType as AuditEventType,
			actorId: data.actorId,
			message: data.message,
			occurredAt:
				data.occurredAt instanceof Date
					? data.occurredAt
					: new Date(data.occurredAt),
			metadata: data.metadata ?? {},
		};
		return new AuditEvent(props);
	}

	equals(other: AuditEvent | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	get id(): string {
		return this.props.id;
	}
	get caseId(): string | undefined {
		return this.props.caseId;
	}
	get scope(): FiscalScope {
		return this.props.scope;
	}
	get eventType(): AuditEventType {
		return this.props.eventType;
	}
	get actorId(): string {
		return this.props.actorId;
	}
	get message(): string {
		return this.props.message;
	}
	get occurredAt(): Date {
		return this.props.occurredAt;
	}
	get metadata(): Record<string, unknown> {
		return { ...this.props.metadata };
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			caseId: this.props.caseId,
			scope: this.props.scope,
			eventType: this.props.eventType,
			actorId: this.props.actorId,
			message: this.props.message,
			occurredAt: this.props.occurredAt.toISOString(),
			metadata: this.props.metadata,
		};
	}
}
