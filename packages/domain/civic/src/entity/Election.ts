/**
 * Election — Aggregate root for civic elections
 *
 * Business rules:
 * - Status transitions: DRAFT → ACTIVE → COMPLETED → AUDITED
 * - Polling station IDs are unique within an election
 * - Immutable — status changes return new instances
 */

import { randomUUID } from "node:crypto";

export enum ElectionStatus {
	DRAFT = "DRAFT",
	ACTIVE = "ACTIVE",
	COMPLETED = "COMPLETED",
	AUDITED = "AUDITED",
}

export interface ElectionProps {
	readonly id?: string;
	readonly name: string;
	readonly date: Date;
	readonly region: string;
	readonly status?: ElectionStatus;
	readonly pollingStationIds?: readonly string[];
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
}

const VALID_TRANSITIONS: Record<ElectionStatus, ElectionStatus[]> = {
	[ElectionStatus.DRAFT]: [ElectionStatus.ACTIVE],
	[ElectionStatus.ACTIVE]: [ElectionStatus.COMPLETED],
	[ElectionStatus.COMPLETED]: [ElectionStatus.AUDITED],
	[ElectionStatus.AUDITED]: [],
};

export class Election {
	private constructor(private readonly props: ElectionProps) {
		Object.freeze(this);
	}

	static create(props: ElectionProps): Election {
		return new Election({
			id: props.id ?? randomUUID(),
			name: props.name,
			date: props.date,
			region: props.region,
			status: props.status ?? ElectionStatus.DRAFT,
			pollingStationIds: props.pollingStationIds ?? [],
			createdAt: props.createdAt ?? new Date(),
			updatedAt: props.updatedAt ?? new Date(),
		});
	}

	private transition(newStatus: ElectionStatus): Election {
		const allowed = VALID_TRANSITIONS[this.props.status!];
		if (!allowed.includes(newStatus)) {
			throw new Error(
				`Cannot transition election from ${this.props.status} to ${newStatus}`,
			);
		}
		return new Election({
			...this.props,
			status: newStatus,
			updatedAt: new Date(),
		});
	}

	activate(): Election {
		return this.transition(ElectionStatus.ACTIVE);
	}

	complete(): Election {
		return this.transition(ElectionStatus.COMPLETED);
	}

	audit(): Election {
		return this.transition(ElectionStatus.AUDITED);
	}

	addPollingStation(stationId: string): Election {
		if (this.props.pollingStationIds?.includes(stationId)) {
			throw new Error(`Polling station ${stationId} already registered`);
		}
		return new Election({
			...this.props,
			pollingStationIds: [...this.props.pollingStationIds!, stationId],
			updatedAt: new Date(),
		});
	}

	get id(): string {
		return this.props.id!;
	}

	get name(): string {
		return this.props.name;
	}

	get date(): Date {
		return this.props.date;
	}

	get region(): string {
		return this.props.region;
	}

	get status(): ElectionStatus {
		return this.props.status!;
	}

	get pollingStationIds(): readonly string[] {
		return this.props.pollingStationIds ?? [];
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
			date: this.props.date.toISOString(),
			region: this.props.region,
			status: this.props.status,
			pollingStationIds: [...(this.props.pollingStationIds ?? [])],
			createdAt: this.props.createdAt?.toISOString(),
			updatedAt: this.props.updatedAt?.toISOString(),
		};
	}
}
