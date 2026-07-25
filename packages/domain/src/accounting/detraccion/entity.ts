import { Money } from "../../value-objects/Money";
import {
	InvalidDetraccionError,
	InvalidDetraccionTransitionError,
} from "./errors";
import {
	type DetraccionStatus,
	type SerializedMoney,
	SPOT_CODE_REGISTRY,
	type SpotCode,
} from "./types";

export class Detraccion {
	constructor(
		protected readonly _id: string,
		protected readonly _spotCode: SpotCode,
		protected readonly _percentage: number,
		protected readonly _amount: Money,
		protected readonly _reference: string,
		protected readonly _status: DetraccionStatus,
		protected readonly _createdAt: Date,
		protected readonly _updatedAt: Date,
	) {
		Object.freeze(this);
	}

	static create(
		id: string,
		spotCode: string,
		percentage: number,
		amount: Money,
		reference: string,
	): Detraccion {
		if (!id || id.trim().length === 0) {
			throw new InvalidDetraccionError("id", "ID is required");
		}

		if (!SPOT_CODE_REGISTRY[spotCode]) {
			throw new InvalidDetraccionError(
				spotCode,
				`Invalid SPOT code: ${spotCode}. Must be one of: ${Object.keys(SPOT_CODE_REGISTRY).join(", ")}`,
			);
		}

		if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
			throw new InvalidDetraccionError(
				String(percentage),
				"Percentage must be between 0 and 100",
			);
		}

		if (amount.isZero() || amount.getAmount() <= 0) {
			throw new InvalidDetraccionError(
				String(amount.getAmount()),
				"Amount must be positive",
			);
		}

		if (!reference || reference.trim().length === 0) {
			throw new InvalidDetraccionError("reference", "Reference is required");
		}

		const now = new Date();

		return new Detraccion(
			id.trim(),
			spotCode as SpotCode,
			percentage,
			amount,
			reference.trim(),
			"pendiente",
			now,
			now,
		);
	}

	get id(): string {
		return this._id;
	}

	get spotCode(): SpotCode {
		return this._spotCode;
	}

	get spotCodeInfo(): {
		code: string;
		description: string;
		percentage: number;
	} {
		const info = SPOT_CODE_REGISTRY[this._spotCode];
		if (!info) {
			return {
				code: this._spotCode,
				description: "Unknown",
				percentage: this._percentage,
			};
		}
		return info;
	}

	/**
	 * Percentage for this SPOT code from the SUNAT registry.
	 */
	get spotCodePercentage(): number {
		return SPOT_CODE_REGISTRY[this._spotCode]?.percentage ?? this._percentage;
	}

	get percentage(): number {
		return this._percentage;
	}

	get amount(): Money {
		return this._amount;
	}

	get reference(): string {
		return this._reference;
	}

	get status(): DetraccionStatus {
		return this._status;
	}

	get createdAt(): Date {
		return new Date(this._createdAt.getTime());
	}

	get updatedAt(): Date {
		return new Date(this._updatedAt.getTime());
	}

	deposit(): Detraccion {
		if (this._status !== "pendiente") {
			throw new InvalidDetraccionTransitionError(
				this._status,
				"depositado",
				"Only pending detractions can be deposited",
			);
		}
		return new Detraccion(
			this._id,
			this._spotCode,
			this._percentage,
			this._amount,
			this._reference,
			"depositado",
			this._createdAt,
			new Date(),
		);
	}

	use(): Detraccion {
		if (this._status !== "depositado") {
			throw new InvalidDetraccionTransitionError(
				this._status,
				"usado",
				"Only deposited detractions can be used",
			);
		}
		return new Detraccion(
			this._id,
			this._spotCode,
			this._percentage,
			this._amount,
			this._reference,
			"usado",
			this._createdAt,
			new Date(),
		);
	}

	release(): Detraccion {
		if (this._status !== "depositado") {
			throw new InvalidDetraccionTransitionError(
				this._status,
				"liberado",
				"Only deposited detractions can be released",
			);
		}
		return new Detraccion(
			this._id,
			this._spotCode,
			this._percentage,
			this._amount,
			this._reference,
			"liberado",
			this._createdAt,
			new Date(),
		);
	}

	isDeposited(): boolean {
		return this._status === "depositado";
	}

	isUsed(): boolean {
		return this._status === "usado";
	}

	isReleased(): boolean {
		return this._status === "liberado";
	}

	equals(other: Detraccion | null | undefined): boolean {
		if (!other) return false;
		return (
			this._id === other._id &&
			this._spotCode === other._spotCode &&
			this._percentage === other._percentage &&
			this._amount.equals(other._amount) &&
			this._status === other._status
		);
	}

	toString(): string {
		return `Detraccion(${this._id}, ${this._spotCode}, ${this._status})`;
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this._id,
			spotCode: this._spotCode,
			percentage: this._percentage,
			amount: this._amount.toJSON(),
			reference: this._reference,
			status: this._status,
			createdAt: this._createdAt.toISOString(),
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromJSON(json: {
		id: string;
		spotCode: string;
		percentage: number;
		amount: SerializedMoney;
		reference: string;
	}): Detraccion {
		const money = Money.fromJSON(json.amount);
		return Detraccion.create(
			json.id,
			json.spotCode,
			json.percentage,
			money,
			json.reference,
		);
	}
}
