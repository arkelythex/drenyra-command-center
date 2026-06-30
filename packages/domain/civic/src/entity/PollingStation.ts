/**
 * PollingStation — Entity representing a polling station
 *
 * Business rules:
 * - urnCount MUST be positive
 * - registeredVoters MUST be positive
 * - Immutable (Object.freeze)
 */

import { randomUUID } from "node:crypto";

export interface PollingStationProps {
	readonly id?: string;
	readonly code: string;
	readonly name: string;
	readonly location: string;
	readonly urnCount: number;
	readonly registeredVoters: number;
	readonly electionId: string;
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
}

export class PollingStation {
	private constructor(private readonly props: PollingStationProps) {
		Object.freeze(this);
	}

	static create(props: PollingStationProps): PollingStation {
		if (props.urnCount <= 0) {
			throw new Error("urnCount must be positive");
		}
		if (props.registeredVoters <= 0) {
			throw new Error("registeredVoters must be positive");
		}

		return new PollingStation({
			id: props.id ?? randomUUID(),
			code: props.code,
			name: props.name,
			location: props.location,
			urnCount: props.urnCount,
			registeredVoters: props.registeredVoters,
			electionId: props.electionId,
			createdAt: props.createdAt ?? new Date(),
			updatedAt: props.updatedAt ?? new Date(),
		});
	}

	get id(): string {
		return this.props.id!;
	}

	get code(): string {
		return this.props.code;
	}

	get name(): string {
		return this.props.name;
	}

	get location(): string {
		return this.props.location;
	}

	get urnCount(): number {
		return this.props.urnCount;
	}

	get registeredVoters(): number {
		return this.props.registeredVoters;
	}

	get electionId(): string {
		return this.props.electionId;
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
			code: this.props.code,
			name: this.props.name,
			location: this.props.location,
			urnCount: this.props.urnCount,
			registeredVoters: this.props.registeredVoters,
			electionId: this.props.electionId,
			createdAt: this.props.createdAt?.toISOString(),
			updatedAt: this.props.updatedAt?.toISOString(),
		};
	}
}
