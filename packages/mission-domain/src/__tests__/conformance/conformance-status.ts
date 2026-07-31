/**
 * Shared §2.6 status vocabulary and local-equivalence mapping for the
 * canonical receipt conformance suite (design §5.1, tasks T9).
 *
 * Test-only helper consumed by the TS conformance harness. It centralizes
 * the status names and the mapping from the local verification surface
 * (verifySignedReceipt) onto that vocabulary so every vector assertion
 * shares one source of truth. No production code changes — mission-receipt.ts
 * remains authoritative and unchanged.
 */

/** §2.6 verification status vocabulary shared by every conformance surface. */
export const RECEIPT_STATUS = {
	SIGNER_TRUSTED: "SIGNER_TRUSTED",
	VALID: "VALID",
	UNKNOWN_SIGNER: "UNKNOWN_SIGNER",
	KEY_EXPIRED: "KEY_EXPIRED",
	KEY_REVOKED: "KEY_REVOKED",
	CONTENT_VALID: "CONTENT_VALID",
	PAYLOAD_TAMPERED: "PAYLOAD_TAMPERED",
} as const;

export type ReceiptStatus = (typeof RECEIPT_STATUS)[keyof typeof RECEIPT_STATUS];

/**
 * Statuses that a local-only surface (hash + signature) reports as a full
 * pass. Trusted lifecycle outcomes still carry a valid hash and signature,
 * so they collapse to the local VALID class per spec §2.6.
 */
const LOCALLY_VALID_STATUSES: readonly ReceiptStatus[] = [
	RECEIPT_STATUS.SIGNER_TRUSTED,
	RECEIPT_STATUS.VALID,
	RECEIPT_STATUS.UNKNOWN_SIGNER,
	RECEIPT_STATUS.KEY_EXPIRED,
	RECEIPT_STATUS.KEY_REVOKED,
];

/** The result shape returned by verifySignedReceipt (mission-receipt.ts). */
export interface LocalVerification {
	valid: boolean;
	hashValid: boolean;
	signatureValid: boolean;
}

/**
 * Maps a local verification result onto the §2.6 vocabulary:
 * - PAYLOAD_TAMPERED when the content hash does not match;
 * - CONTENT_VALID when the hash matches but the signature does not;
 * - VALID when hash and signature both hold.
 */
export function localStatusFor(
	verification: LocalVerification,
): ReceiptStatus {
	if (!verification.hashValid) {
		return RECEIPT_STATUS.PAYLOAD_TAMPERED;
	}
	if (!verification.signatureValid) {
		return RECEIPT_STATUS.CONTENT_VALID;
	}
	return RECEIPT_STATUS.VALID;
}

/**
 * True when a §2.6 status is a local pass (valid hash AND valid signature),
 * including the trusted lifecycle statuses per the spec §2.6 mapping.
 */
export function isLocallyValid(status: string): boolean {
	return (LOCALLY_VALID_STATUSES as readonly string[]).includes(status);
}
