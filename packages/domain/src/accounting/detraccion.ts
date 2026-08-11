/**
 * Detraccion Value Object
 *
 * Represents a SPOT (Sistema de Pago de Obligaciones Tributarias) detention/detracción.
 * Tracks the lifecycle of a detention deposit from creation through usage/release.
 *
 * Status lifecycle:
 *   pendiente → depositado → usado
 *   pendiente → depositado → liberado
 *
 * SPOT codes follow SUNAT's official catalog of detracción services.
 */

import { Money } from "../value-objects/Money";

/**
 * Lifecycle status for a SUNAT SPOT detraction.
 *
 * @remarks Valid transitions are enforced by the Detraccion aggregate.
 * @example
 * const status: DetraccionStatus = "depositado";
 */
export type DetraccionStatus =
	| "pendiente"
	| "depositado"
	| "usado"
	| "liberado";

/**
 * SPOT (Sistema de Pago de Obligaciones Tributarias) service codes per SUNAT.
 * Each code maps to a service type and its associated detention percentage.
 *
 * @returns The deterministic SPOT code catalog used by validation.
 * @example
 * const spot = SPOT_CODE_REGISTRY["001"];
 */
export const SPOT_CODE_REGISTRY: Record<
	string,
	{ code: string; description: string }
> = {
	"001": { code: "001", description: "Transporte de bienes por vía terrestre" },
	"002": { code: "002", description: "Transporte público de pasajeros" },
	"003": { code: "003", description: "Alquiler de bienes muebles" },
	"004": {
		code: "004",
		description: "Mantenimiento y reparación de bienes muebles",
	},
	"005": { code: "005", description: "Intermediación laboral y tercerización" },
	"006": { code: "006", description: "Arrendamiento de bienes inmuebles" },
	"007": { code: "007", description: "Otros servicios empresariales" },
} as const;

/**
 * SPOT code accepted by the detraction aggregate.
 *
 * @remarks Derived from the registry so types and validation remain aligned.
 * @example
 * const code: SpotCode = "001";
 */
export type SpotCode = keyof typeof SPOT_CODE_REGISTRY;

/**
 * Immutable SUNAT SPOT detraction aggregate.
 *
 * @remarks Money is stored through the Money value object; callers must not pass floats.
 * @example
 * const detraction = Detraccion.create(id, "001", 10, amount, reference);
 */
export class Detraccion {
	private constructor(
		private readonly _id: string,
		private readonly _spotCode: SpotCode,
		private readonly _percentage: number,
		private readonly _amount: Money,
		private readonly _reference: string,
		private readonly _status: DetraccionStatus,
		private readonly _createdAt: Date,
		private readonly _updatedAt: Date,
	) {
		Object.freeze(this);
	}

	/**
	 * Creates a validated detraction in pending status.
	 *
	 * @param id - Detraction identifier.
	 * @param spotCode - SUNAT SPOT code.
	 * @param percentage - Detraction percentage.
	 * @param amount - Money value object for the detained amount.
	 * @param reference - Invoice or fiscal reference.
	 * @returns A validated detraction aggregate.
	 * @throws InvalidDetraccionError when any fiscal invariant is violated.
	 */
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

	// --- Getters ---

	get id(): string {
		return this._id;
	}

	get spotCode(): SpotCode {
		return this._spotCode;
	}

	get spotCodeInfo(): { code: string; description: string } {
		const info = SPOT_CODE_REGISTRY[this._spotCode];
		if (info === undefined) {
			throw new Error(`SPOT code ${this._spotCode} is not registered`);
		}
		return info;
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

	// --- State Transitions ---

	/**
	 * Mark the detention as deposited to the SPOT account.
	 * Can only deposit from 'pendiente'.
	 */
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

	/**
	 * Mark the deposited amount as used for tax payment.
	 * Can only use from 'depositado'.
	 */
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

	/**
	 * Mark the deposited amount as released (returned to the debtor).
	 * Can only release from 'depositado'.
	 */
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

	/**
	 * Check if the detention has been deposited.
	 */
	isDeposited(): boolean {
		return this._status === "depositado";
	}

	/**
	 * Check if the detention has been used (applied to tax payment).
	 */
	isUsed(): boolean {
		return this._status === "usado";
	}

	/**
	 * Check if the detention has been released.
	 */
	isReleased(): boolean {
		return this._status === "liberado";
	}

	// --- Equality & Serialization ---

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
		amount: Parameters<typeof Money.fromJSON>[0];
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

// --- Errors ---

export class InvalidDetraccionError extends Error {
	constructor(
		public readonly field: string,
		message?: string,
	) {
		super(message || `Invalid detraccion field: ${field}`);
		this.name = "InvalidDetraccionError";
		Object.setPrototypeOf(this, InvalidDetraccionError.prototype);
	}

	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			field: this.field,
			code: "INVALID_DETRACCION",
		};
	}
}

export class InvalidDetraccionTransitionError extends Error {
	constructor(
		public readonly currentStatus: DetraccionStatus,
		public readonly targetStatus: DetraccionStatus,
		message?: string,
	) {
		super(
			message ||
				`Invalid detraccion transition: ${currentStatus} → ${targetStatus}`,
		);
		this.name = "InvalidDetraccionTransitionError";
		Object.setPrototypeOf(this, InvalidDetraccionTransitionError.prototype);
	}

	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			currentStatus: this.currentStatus,
			targetStatus: this.targetStatus,
			code: "INVALID_DETRACCION_TRANSITION",
		};
	}
}
