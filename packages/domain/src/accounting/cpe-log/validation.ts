/**
 * CPELog — Validation & Domain Errors
 */

import type { SunatStatus } from "./types";

export class InvalidCPELogError extends Error {
	constructor(
		public readonly field: string,
		message?: string,
	) {
		super(message || `Invalid CPE log field: ${field}`);
		this.name = "InvalidCPELogError";
		Object.setPrototypeOf(this, InvalidCPELogError.prototype);
	}

	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			field: this.field,
			code: "INVALID_CPE_LOG",
		};
	}
}

export class InvalidCPELogTransitionError extends Error {
	constructor(
		public readonly currentStatus: SunatStatus,
		public readonly targetStatus: SunatStatus,
		message?: string,
	) {
		super(
			message ||
				`Invalid CPE log transition: ${currentStatus} → ${targetStatus}`,
		);
		this.name = "InvalidCPELogTransitionError";
		Object.setPrototypeOf(
			this,
			InvalidCPELogTransitionError.prototype,
		);
	}

	toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			currentStatus: this.currentStatus,
			targetStatus: this.targetStatus,
			code: "INVALID_CPE_LOG_TRANSITION",
		};
	}
}
