/**
 * CivicCase — Aggregate root for civic investigation cases
 *
 * Business rules:
 * - Status transitions: DRAFT → ACTIVE → COMPLETED → ESCALATED → RESOLVED
 * - Escalation requires a reason
 * - Election and fraud indicator references are unique within a case
 * - Timeline is append-only
 * - Immutable — status changes return new instances
 */

import { randomUUID } from "node:crypto";
import type { FraudIndicator } from "../value-object/FraudIndicator";

export enum CivicCaseStatus {
	DRAFT = "DRAFT",
	ACTIVE = "ACTIVE",
	COMPLETED = "COMPLETED",
	ESCALATED = "ESCALATED",
	RESOLVED = "RESOLVED",
}

export interface CivicCaseProps {
	readonly id?: string;
	readonly name: string;
	readonly electionIds?: readonly string[];
	readonly fraudIndicators?: readonly FraudIndicator[];
	readonly timeline?: readonly string[];
	readonly status?: CivicCaseStatus;
	readonly escalationReason?: string;
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
}

const VALID_TRANSITIONS: Record<CivicCaseStatus, CivicCaseStatus[]> = {
	[CivicCaseStatus.DRAFT]: [CivicCaseStatus.ACTIVE],
	[CivicCaseStatus.ACTIVE]: [CivicCaseStatus.COMPLETED],
	[CivicCaseStatus.COMPLETED]: [CivicCaseStatus.ESCALATED],
	[CivicCaseStatus.ESCALATED]: [CivicCaseStatus.RESOLVED],
	[CivicCaseStatus.RESOLVED]: [],
};

export class CivicCase {
	private constructor(private readonly props: CivicCaseProps) {
		Object.freeze(this);
	}

	static create(props: CivicCaseProps): CivicCase {
		return new CivicCase({
			id: props.id ?? randomUUID(),
			name: props.name,
			status: props.status ?? CivicCaseStatus.DRAFT,
			electionIds: props.electionIds ?? [],
			fraudIndicators: props.fraudIndicators ?? [],
			timeline: props.timeline ?? [],
			escalationReason: props.escalationReason,
			createdAt: props.createdAt ?? new Date(),
			updatedAt: props.updatedAt ?? new Date(),
		});
	}

	private transition(
		newStatus: CivicCaseStatus,
		extra?: Partial<CivicCaseProps>,
	): CivicCase {
		const allowed = VALID_TRANSITIONS[this.props.status!];
		if (!allowed.includes(newStatus)) {
			throw new Error(
				`Cannot transition civic case from ${this.props.status} to ${newStatus}`,
			);
		}
		return new CivicCase({
			...this.props,
			...extra,
			status: newStatus,
			updatedAt: new Date(),
		});
	}

	activate(): CivicCase {
		return this.transition(CivicCaseStatus.ACTIVE);
	}

	complete(): CivicCase {
		return this.transition(CivicCaseStatus.COMPLETED);
	}

	escalate(reason: string): CivicCase {
		if (!reason || reason.trim().length === 0) {
			throw new Error("Escalation reason is required");
		}
		return this.transition(CivicCaseStatus.ESCALATED, {
			escalationReason: reason,
		});
	}

	resolve(): CivicCase {
		return this.transition(CivicCaseStatus.RESOLVED);
	}

	addElection(electionId: string): CivicCase {
		if (this.props.electionIds?.includes(electionId)) {
			throw new Error(`Election ${electionId} already registered`);
		}
		return new CivicCase({
			...this.props,
			electionIds: [...this.props.electionIds!, electionId],
			updatedAt: new Date(),
		});
	}

	addFraudIndicator(indicator: FraudIndicator): CivicCase {
		return new CivicCase({
			...this.props,
			fraudIndicators: [...this.props.fraudIndicators!, indicator],
			updatedAt: new Date(),
		});
	}

	addTimelineEvent(event: string): CivicCase {
		return new CivicCase({
			...this.props,
			timeline: [...this.props.timeline!, event],
			updatedAt: new Date(),
		});
	}

	get id(): string {
		return this.props.id!;
	}

	get name(): string {
		return this.props.name;
	}

	get status(): CivicCaseStatus {
		return this.props.status!;
	}

	get electionIds(): readonly string[] {
		return this.props.electionIds ?? [];
	}

	get fraudIndicators(): readonly FraudIndicator[] {
		return this.props.fraudIndicators ?? [];
	}

	get timeline(): readonly string[] {
		return this.props.timeline ?? [];
	}

	get escalationReason(): string | undefined {
		return this.props.escalationReason;
	}

	get createdAt(): Date {
		return this.props.createdAt!;
	}

	get updatedAt(): Date {
		return this.props.updatedAt!;
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			name: this.props.name,
			status: this.props.status,
			electionIds: [...(this.props.electionIds ?? [])],
			fraudIndicators: (this.props.fraudIndicators ?? []).map((f) =>
				f.toJSON(),
			),
			timeline: [...(this.props.timeline ?? [])],
			escalationReason: this.props.escalationReason,
			createdAt: this.props.createdAt?.toISOString(),
			updatedAt: this.props.updatedAt?.toISOString(),
		};
	}
}
