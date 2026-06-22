/**
 * AccountingPeriod Value Object
 *
 * Represents a fiscal accounting period with status lifecycle.
 * Immutable — state transitions return new instances.
 *
 * Status lifecycle:
 *   abierto → cerrado_parcial → cerrado_final → auditado
 *   abierto → cerrado_final → auditado
 */

export const ACCOUNTING_PERIOD_STATUS = {
	ABIERTO: "abierto",
	CERRADO_PARCIAL: "cerrado_parcial",
	CERRADO_FINAL: "cerrado_final",
	AUDITADO: "auditado",
} as const;

export type AccountingPeriodStatus =
	(typeof ACCOUNTING_PERIOD_STATUS)[keyof typeof ACCOUNTING_PERIOD_STATUS];

const ALL_STATUS_VALUES = Object.values(ACCOUNTING_PERIOD_STATUS) as readonly string[];

const MIN_YEAR = 2020;
const MAX_YEAR = 2100;

interface DateRange {
	start: Date;
	end: Date;
}

export class AccountingPeriod {
	private constructor(
		private readonly _year: number,
		private readonly _month: number,
		private readonly _status: AccountingPeriodStatus,
	) {
		Object.freeze(this);
	}

	static create(
		year: number,
		month: number,
		status: AccountingPeriodStatus = "abierto",
	): AccountingPeriod {
		if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
			throw new InvalidAccountingPeriodError(
				year,
				month,
				`Year must be between ${MIN_YEAR} and ${MAX_YEAR}`,
			);
		}

		if (!Number.isInteger(month) || month < 1 || month > 12) {
			throw new InvalidAccountingPeriodError(
				year,
				month,
				"Month must be between 1 and 12",
			);
		}

		if (!ALL_STATUS_VALUES.includes(status)) {
			throw new InvalidAccountingPeriodError(
				year,
				month,
				`Invalid status: ${status}`,
			);
		}

		return new AccountingPeriod(year, month, status);
	}

	// --- Getters ---

	get year(): number {
		return this._year;
	}

	get month(): number {
		return this._month;
	}

	get status(): AccountingPeriodStatus {
		return this._status;
	}

	/**
	 * Period key in "YYYY-MM" format for invoices, journal entries, etc.
	 */
	get periodKey(): string {
		return `${this._year}-${String(this._month).padStart(2, "0")}`;
	}

	/**
	 * Date range for this period.
	 * Start is the first day of the month at 00:00:00.
	 * End is the last day of the month at 23:59:59.999.
	 */
	get dateRange(): DateRange {
		const start = new Date(this._year, this._month - 1, 1, 0, 0, 0, 0);
		const end = new Date(this._year, this._month, 0, 23, 59, 59, 999);
		return { start, end };
	}

	/**
	 * Returns true only if the period is open for posting transactions.
	 */
	canPostEntry(): boolean {
		return this._status === "abierto";
	}

	/**
	 * Transition: close partially.
	 * Can only close from 'abierto'.
	 */
	closePartial(): AccountingPeriod {
		if (this._status !== "abierto") {
			throw new InvalidAccountingTransitionError(
				this._status,
				"cerrado_parcial",
				"Only open periods can be partially closed",
			);
		}
		return new AccountingPeriod(this._year, this._month, "cerrado_parcial");
	}

	/**
	 * Transition: close finally.
	 * Can close from 'abierto' or 'cerrado_parcial'.
	 */
	closeFinal(): AccountingPeriod {
		if (this._status === "auditado") {
			throw new InvalidAccountingTransitionError(
				this._status,
				"cerrado_final",
				"Audited periods cannot be closed",
			);
		}
		if (this._status === "cerrado_final") {
			return this; // Already final closed — idempotent
		}
		return new AccountingPeriod(this._year, this._month, "cerrado_final");
	}

	/**
	 * Transition: audit.
	 * Can only audit from 'cerrado_final'.
	 */
	audit(): AccountingPeriod {
		if (this._status !== "cerrado_final") {
			throw new InvalidAccountingTransitionError(
				this._status,
				"auditado",
				"Only final closed periods can be audited",
			);
		}
		return new AccountingPeriod(this._year, this._month, "auditado");
	}

	// --- Equality & Serialization ---

	equals(other: AccountingPeriod | null | undefined): boolean {
		if (!other) return false;
		return (
			this._year === other._year &&
			this._month === other._month &&
			this._status === other._status
		);
	}

	toString(): string {
		return `AccountingPeriod(${this.periodKey}, ${this._status})`;
	}

	toJSON(): {
		year: number;
		month: number;
		status: AccountingPeriodStatus;
		periodKey: string;
	} {
		return {
			year: this._year,
			month: this._month,
			status: this._status,
			periodKey: this.periodKey,
		};
	}

	static fromJSON(json: {
		year: number;
		month: number;
		status: AccountingPeriodStatus;
	}): AccountingPeriod {
		return AccountingPeriod.create(json.year, json.month, json.status);
	}
}

// --- Errors ---

export class InvalidAccountingPeriodError extends Error {
	constructor(
		public readonly year: number,
		public readonly month: number,
		message?: string,
	) {
		super(message || `Invalid accounting period: ${year}-${month}`);
		this.name = "InvalidAccountingPeriodError";
		Object.setPrototypeOf(this, InvalidAccountingPeriodError.prototype);
	}

	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			year: this.year,
			month: this.month,
			code: "INVALID_ACCOUNTING_PERIOD",
		};
	}
}

export class InvalidAccountingTransitionError extends Error {
	constructor(
		public readonly currentStatus: string,
		public readonly targetStatus: string,
		message?: string,
	) {
		super(
			message ||
				`Invalid transition: ${currentStatus} → ${targetStatus}`,
		);
		this.name = "InvalidAccountingTransitionError";
		Object.setPrototypeOf(this, InvalidAccountingTransitionError.prototype);
	}

	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			currentStatus: this.currentStatus,
			targetStatus: this.targetStatus,
			code: "INVALID_ACCOUNTING_TRANSITION",
		};
	}
}
