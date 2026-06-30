/**
 * DNIVerification — Value object wrapping a DNI with electoral verification context
 *
 * Wraps a DNI and tracks its verification status against the electoral roll.
 * Immutable — all state transitions return new instances.
 */

import type { DNI } from "@arkelythex/domain";

export enum DNIVerificationStatus {
	PENDING = "PENDING",
	VERIFIED = "VERIFIED",
	UNVERIFIED = "UNVERIFIED",
	NOT_FOUND = "NOT_FOUND",
}

export interface DNIVerificationProps {
	readonly dni: DNI;
	readonly verificationStatus: DNIVerificationStatus;
	readonly verifiedAt?: Date;
	readonly verifierId?: string;
}

export class DNIVerification {
	private constructor(private readonly props: DNIVerificationProps) {
		Object.freeze(this);
	}

	/**
	 * Create a DNIVerification with PENDING status
	 */
	static create(dni: DNI): DNIVerification {
		return new DNIVerification({
			dni,
			verificationStatus: DNIVerificationStatus.PENDING,
		});
	}

	/**
	 * Create a DNIVerification with VERIFIED status
	 */
	static verified(dni: DNI, verifierId: string): DNIVerification {
		return new DNIVerification({
			dni,
			verificationStatus: DNIVerificationStatus.VERIFIED,
			verifiedAt: new Date(),
			verifierId,
		});
	}

	/**
	 * Create a DNIVerification with NOT_FOUND status
	 */
	static notFound(dni: DNI): DNIVerification {
		return new DNIVerification({
			dni,
			verificationStatus: DNIVerificationStatus.NOT_FOUND,
		});
	}

	/**
	 * Validate DNI checksum using a weighted digit sum (mod 11 parity).
	 *
	 * Even though Peru's RENIEC does not publish a formal checksum algorithm,
	 * this provides basic data integrity verification by weighting each digit
	 * by its position (8..1), summing, and checking the sum is not divisible by 11.
	 *
	 * @param dniValue - 8-digit DNI string
	 * @returns true if the weighted sum is not divisible by 11
	 */
	static validateChecksum(dniValue: string): boolean {
		if (!/^\d{8}$/.test(dniValue)) {
			return false;
		}

		const sum = dniValue
			.split("")
			.reduce(
				(acc, digit, index) => acc + parseInt(digit, 10) * (8 - index),
				0,
			);

		return sum % 11 !== 0;
	}

	get dni(): DNI {
		return this.props.dni;
	}

	get verificationStatus(): DNIVerificationStatus {
		return this.props.verificationStatus;
	}

	get verifiedAt(): Date | undefined {
		return this.props.verifiedAt;
	}

	get verifierId(): string | undefined {
		return this.props.verifierId;
	}

	/**
	 * Mark as VERIFIED — returns a new DNIVerification instance
	 */
	markVerified(verifierId: string): DNIVerification {
		return new DNIVerification({
			dni: this.props.dni,
			verificationStatus: DNIVerificationStatus.VERIFIED,
			verifiedAt: new Date(),
			verifierId,
		});
	}

	/**
	 * Mark as UNVERIFIED — returns a new DNIVerification instance
	 */
	markUnverified(): DNIVerification {
		return new DNIVerification({
			dni: this.props.dni,
			verificationStatus: DNIVerificationStatus.UNVERIFIED,
		});
	}

	equals(other: DNIVerification | null | undefined): boolean {
		if (!other) return false;
		return (
			this.props.dni.equals(other.props.dni) &&
			this.props.verificationStatus === other.props.verificationStatus
		);
	}

	toJSON(): Record<string, unknown> {
		const json: Record<string, unknown> = {
			dni: this.props.dni.toJSON(),
			verificationStatus: this.props.verificationStatus,
		};

		if (this.props.verifiedAt) {
			json.verifiedAt = this.props.verifiedAt.toISOString();
		}

		if (this.props.verifierId) {
			json.verifierId = this.props.verifierId;
		}

		return json;
	}
}
