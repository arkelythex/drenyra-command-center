/**
 * ElectoralAct — Entity representing an electoral act (acta electoral)
 *
 * Business rules:
 * - voteTallies MUST NOT be empty
 * - Validation is a one-way transition: PENDING → VALID | INVALID
 * - Immutable (Object.freeze)
 */

import { randomUUID } from "node:crypto";

export enum ValidationStatus {
	PENDING = "PENDING",
	VALID = "VALID",
	INVALID = "INVALID",
}

export interface ElectoralActProps {
	readonly id?: string;
	readonly stationId: string;
	readonly urnNumber: number;
	readonly voteTallies: Map<string, number>;
	readonly validationStatus?: ValidationStatus;
	readonly validatedAt?: Date;
	readonly validatedBy?: string;
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
}

export class ElectoralAct {
	private constructor(private readonly props: ElectoralActProps) {
		Object.freeze(this);
	}

	static create(props: ElectoralActProps): ElectoralAct {
		if (!props.voteTallies || props.voteTallies.size === 0) {
			throw new Error("voteTallies must not be empty");
		}

		return new ElectoralAct({
			id: props.id ?? randomUUID(),
			stationId: props.stationId,
			urnNumber: props.urnNumber,
			voteTallies: new Map(props.voteTallies),
			validationStatus: props.validationStatus ?? ValidationStatus.PENDING,
			validatedAt: props.validatedAt,
			validatedBy: props.validatedBy,
			createdAt: props.createdAt ?? new Date(),
			updatedAt: props.updatedAt ?? new Date(),
		});
	}

	private mark(
		status: ValidationStatus.VALID | ValidationStatus.INVALID,
		validatedBy: string,
	): ElectoralAct {
		if (this.props.validationStatus! !== ValidationStatus.PENDING) {
			throw new Error(
				`Cannot validate an act with status ${this.props.validationStatus}`,
			);
		}

		return new ElectoralAct({
			...this.props,
			validationStatus: status,
			validatedAt: new Date(),
			validatedBy,
			updatedAt: new Date(),
		});
	}

	markValid(validatedBy: string): ElectoralAct {
		return this.mark(ValidationStatus.VALID, validatedBy);
	}

	markInvalid(validatedBy: string): ElectoralAct {
		return this.mark(ValidationStatus.INVALID, validatedBy);
	}

	get id(): string {
		return this.props.id!;
	}

	get stationId(): string {
		return this.props.stationId;
	}

	get urnNumber(): number {
		return this.props.urnNumber;
	}

	get voteTallies(): Map<string, number> {
		return new Map(this.props.voteTallies);
	}

	get validationStatus(): ValidationStatus {
		return this.props.validationStatus!;
	}

	get validatedAt(): Date | undefined {
		return this.props.validatedAt;
	}

	get validatedBy(): string | undefined {
		return this.props.validatedBy;
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
			stationId: this.props.stationId,
			urnNumber: this.props.urnNumber,
			voteTallies: Object.fromEntries(this.props.voteTallies!),
			validationStatus: this.props.validationStatus,
			validatedAt: this.props.validatedAt?.toISOString(),
			validatedBy: this.props.validatedBy,
			createdAt: this.props.createdAt?.toISOString(),
			updatedAt: this.props.updatedAt?.toISOString(),
		};
	}
}
