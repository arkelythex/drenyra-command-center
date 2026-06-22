/**
 * CPELog — Core Domain Logic
 *
 * Represents the SUNAT communication log for a Comprobante de Pago Electrónico (CPE).
 * Tracks the lifecycle of electronic invoice submission through SUNAT validation.
 *
 * Status lifecycle:
 *   pendiente → enviado → aceptado
 *   pendiente → enviado → observado
 *   pendiente → enviado → rechazado
 *   (any state) → baja
 */

import type { SunatStatus, CDRData } from "./types";
import { InvalidCPELogError, InvalidCPELogTransitionError } from "./validation";

export class CPELog {
	private constructor(
		private readonly _id: string,
		private readonly _invoiceId: string,
		private readonly _sunatStatus: SunatStatus,
		private readonly _submittedAt: Date | null,
		private readonly _acceptedAt: Date | null,
		private readonly _rejectedAt: Date | null,
		private readonly _observedAt: Date | null,
		private readonly _cancelledAt: Date | null,
		private readonly _sunatTicket: string | null,
		private readonly _cdr: CDRData | null,
		private readonly _hashValue: string | null,
		private readonly _hashAlgorithm: string | null,
		private readonly _errorMessage: string | null,
		private readonly _errorCode: string | null,
		private readonly _createdAt: Date,
	) {
		Object.freeze(this);
	}

	static create(id: string, invoiceId: string): CPELog {
		if (!id || id.trim().length === 0) {
			throw new InvalidCPELogError("id", "CPE log ID is required");
		}

		if (!invoiceId || invoiceId.trim().length === 0) {
			throw new InvalidCPELogError(
				"invoiceId",
				"Invoice ID is required",
			);
		}

		return new CPELog(
			id.trim(),
			invoiceId.trim(),
			"pendiente",
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			new Date(),
		);
	}

	// --- Getters ---

	get id(): string {
		return this._id;
	}

	get invoiceId(): string {
		return this._invoiceId;
	}

	get sunatStatus(): SunatStatus {
		return this._sunatStatus;
	}

	get submittedAt(): Date | null {
		return this._submittedAt ? new Date(this._submittedAt.getTime()) : null;
	}

	get acceptedAt(): Date | null {
		return this._acceptedAt ? new Date(this._acceptedAt.getTime()) : null;
	}

	get rejectedAt(): Date | null {
		return this._rejectedAt ? new Date(this._rejectedAt.getTime()) : null;
	}

	get observedAt(): Date | null {
		return this._observedAt ? new Date(this._observedAt.getTime()) : null;
	}

	get cancelledAt(): Date | null {
		return this._cancelledAt ? new Date(this._cancelledAt.getTime()) : null;
	}

	get sunatTicket(): string | null {
		return this._sunatTicket;
	}

	get cdr(): CDRData | null {
		return this._cdr;
	}

	get hashValue(): string | null {
		return this._hashValue;
	}

	get hashAlgorithm(): string | null {
		return this._hashAlgorithm;
	}

	get errorMessage(): string | null {
		return this._errorMessage;
	}

	get errorCode(): string | null {
		return this._errorCode;
	}

	get createdAt(): Date {
		return new Date(this._createdAt.getTime());
	}

	// --- State Queries ---

	/**
	 * Returns true if the CPE has been submitted to SUNAT.
	 */
	isSubmitted(): boolean {
		return this._sunatStatus !== "pendiente";
	}

	/**
	 * Returns true if the CPE was accepted by SUNAT.
	 */
	isAccepted(): boolean {
		return this._sunatStatus === "aceptado";
	}

	/**
	 * Returns true if the CPE was rejected by SUNAT.
	 */
	isRejected(): boolean {
		return this._sunatStatus === "rechazado";
	}

	/**
	 * Returns true if SUNAT observed the CPE (revisable).
	 */
	isObserved(): boolean {
		return this._sunatStatus === "observado";
	}

	/**
	 * Returns true if the CPE has been cancelled (baja).
	 */
	isCancelled(): boolean {
		return this._sunatStatus === "baja";
	}

	/**
	 * Returns true if the CPE is in a terminal state (accepted, rejected, or baja).
	 */
	isTerminal(): boolean {
		return (
			this._sunatStatus === "aceptado" ||
			this._sunatStatus === "rechazado" ||
			this._sunatStatus === "baja"
		);
	}

	// --- State Transitions ---

	/**
	 * Submit the CPE to SUNAT.
	 * Can only submit from 'pendiente'.
	 */
	submit(sunatTicket: string, hashValue: string, hashAlgorithm: string = "SHA-256"): CPELog {
		if (this._sunatStatus !== "pendiente") {
			throw new InvalidCPELogTransitionError(
				this._sunatStatus,
				"enviado",
				"Only pending CPEs can be submitted",
			);
		}

		if (!sunatTicket || sunatTicket.trim().length === 0) {
			throw new InvalidCPELogError(
				"sunatTicket",
				"SUNAT ticket is required for submission",
			);
		}

		if (!hashValue || hashValue.trim().length === 0) {
			throw new InvalidCPELogError(
				"hashValue",
				"Hash value is required for submission",
			);
		}

		return new CPELog(
			this._id,
			this._invoiceId,
			"enviado",
			new Date(),
			null,
			null,
			null,
			null,
			sunatTicket.trim(),
			null,
			hashValue.trim(),
			hashAlgorithm,
			null,
			null,
			this._createdAt,
		);
	}

	/**
	 * Mark the CPE as accepted by SUNAT.
	 * Can only accept from 'enviado' or 'observado'.
	 */
	accept(cdr: CDRData): CPELog {
		if (this._sunatStatus !== "enviado" && this._sunatStatus !== "observado") {
			throw new InvalidCPELogTransitionError(
				this._sunatStatus,
				"aceptado",
				"Only submitted or observed CPEs can be accepted",
			);
		}

		if (!cdr.id || cdr.id.trim().length === 0) {
			throw new InvalidCPELogError("cdr.id", "CDR ID is required");
		}

		return new CPELog(
			this._id,
			this._invoiceId,
			"aceptado",
			this._submittedAt,
			new Date(),
			null,
			null,
			null,
			this._sunatTicket,
			cdr,
			this._hashValue,
			this._hashAlgorithm,
			null,
			null,
			this._createdAt,
		);
	}

	/**
	 * Mark the CPE as rejected by SUNAT.
	 * Can only reject from 'enviado'.
	 */
	reject(reason: string, errorCode?: string): CPELog {
		if (this._sunatStatus !== "enviado") {
			throw new InvalidCPELogTransitionError(
				this._sunatStatus,
				"rechazado",
				"Only submitted CPEs can be rejected",
			);
		}

		if (!reason || reason.trim().length === 0) {
			throw new InvalidCPELogError(
				"reason",
				"Rejection reason is required",
			);
		}

		return new CPELog(
			this._id,
			this._invoiceId,
			"rechazado",
			this._submittedAt,
			null,
			new Date(),
			null,
			null,
			this._sunatTicket,
			null,
			this._hashValue,
			this._hashAlgorithm,
			reason.trim(),
			errorCode?.trim() ?? null,
			this._createdAt,
		);
	}

	/**
	 * Mark the CPE as observed by SUNAT (reviewable).
	 * Can only observe from 'enviado'.
	 */
	observe(observation: string): CPELog {
		if (this._sunatStatus !== "enviado") {
			throw new InvalidCPELogTransitionError(
				this._sunatStatus,
				"observado",
				"Only submitted CPEs can be observed",
			);
		}

		if (!observation || observation.trim().length === 0) {
			throw new InvalidCPELogError(
				"observation",
				"Observation description is required",
			);
		}

		return new CPELog(
			this._id,
			this._invoiceId,
			"observado",
			this._submittedAt,
			null,
			null,
			new Date(),
			null,
			this._sunatTicket,
			null,
			this._hashValue,
			this._hashAlgorithm,
			observation.trim(),
			null,
			this._createdAt,
		);
	}

	/**
	 * Cancel/baja the CPE.
	 * Can cancel from any non-terminal state.
	 */
	cancel(reason: string): CPELog {
		if (this.isTerminal()) {
			throw new InvalidCPELogTransitionError(
				this._sunatStatus,
				"baja",
				"Cannot cancel a CPE in terminal state",
			);
		}

		if (!reason || reason.trim().length === 0) {
			throw new InvalidCPELogError(
				"reason",
				"Cancellation reason is required",
			);
		}

		return new CPELog(
			this._id,
			this._invoiceId,
			"baja",
			this._submittedAt,
			null,
			null,
			null,
			new Date(),
			this._sunatTicket,
			this._cdr,
			this._hashValue,
			this._hashAlgorithm,
			reason.trim(),
			this._errorCode,
			this._createdAt,
		);
	}

	// --- Equality & Serialization ---

	equals(other: CPELog | null | undefined): boolean {
		if (!other) return false;
		return (
			this._id === other._id &&
			this._invoiceId === other._invoiceId &&
			this._sunatStatus === other._sunatStatus &&
			this._sunatTicket === other._sunatTicket
		);
	}

	toString(): string {
		return `CPELog(${this._id}, ${this._invoiceId}, ${this._sunatStatus})`;
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this._id,
			invoiceId: this._invoiceId,
			sunatStatus: this._sunatStatus,
			submittedAt: this._submittedAt?.toISOString() ?? null,
			acceptedAt: this._acceptedAt?.toISOString() ?? null,
			rejectedAt: this._rejectedAt?.toISOString() ?? null,
			observedAt: this._observedAt?.toISOString() ?? null,
			cancelledAt: this._cancelledAt?.toISOString() ?? null,
			sunatTicket: this._sunatTicket,
			cdr: this._cdr
				? {
						...this._cdr,
						receivedAt: this._cdr.receivedAt.toISOString(),
					}
				: null,
			hashValue: this._hashValue,
			hashAlgorithm: this._hashAlgorithm,
			errorMessage: this._errorMessage,
			errorCode: this._errorCode,
			createdAt: this._createdAt.toISOString(),
		};
	}

	static fromJSON(json: {
		id: string;
		invoiceId: string;
	}): CPELog {
		return CPELog.create(json.id, json.invoiceId);
	}
}
