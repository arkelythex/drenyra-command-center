import type { DetraccionStatus } from "./types";

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
