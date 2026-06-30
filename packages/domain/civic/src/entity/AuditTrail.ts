/**
 * AuditTrail — Entity representing an audit trail entry (append-only)
 *
 * Business rules:
 * - Append-only: evidence can be added but never removed
 * - Immutable (Object.freeze)
 */

import { randomUUID } from "node:crypto";

export interface AuditTrailProps {
	readonly id?: string;
	readonly actId: string;
	readonly action: string;
	readonly actor: string;
	readonly timestamp: Date;
	readonly evidence?: readonly string[];
	readonly metadata?: Record<string, unknown>;
	readonly createdAt?: Date;
}

export class AuditTrail {
	private constructor(private readonly props: AuditTrailProps) {
		Object.freeze(this);
	}

	static create(props: AuditTrailProps): AuditTrail {
		return new AuditTrail({
			id: props.id ?? randomUUID(),
			actId: props.actId,
			action: props.action,
			actor: props.actor,
			timestamp: props.timestamp,
			evidence: props.evidence ?? [],
			metadata: props.metadata ?? {},
			createdAt: props.createdAt ?? new Date(),
		});
	}

	addEvidence(evidenceHash: string): AuditTrail {
		return new AuditTrail({
			...this.props,
			evidence: [...this.props.evidence!, evidenceHash],
		});
	}

	addMetadata(key: string, value: unknown): AuditTrail {
		return new AuditTrail({
			...this.props,
			metadata: { ...this.props.metadata, [key]: value },
		});
	}

	get id(): string {
		return this.props.id!;
	}

	get actId(): string {
		return this.props.actId;
	}

	get action(): string {
		return this.props.action;
	}

	get actor(): string {
		return this.props.actor;
	}

	get timestamp(): Date {
		return this.props.timestamp;
	}

	get evidence(): readonly string[] {
		return this.props.evidence ?? [];
	}

	get metadata(): Record<string, unknown> {
		return { ...this.props.metadata };
	}

	get createdAt(): Date {
		return this.props.createdAt!;
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			actId: this.props.actId,
			action: this.props.action,
			actor: this.props.actor,
			timestamp: this.props.timestamp.toISOString(),
			evidence: [...(this.props.evidence ?? [])],
			metadata: { ...this.props.metadata },
			createdAt: this.props.createdAt?.toISOString(),
		};
	}
}
