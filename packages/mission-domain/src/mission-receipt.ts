/**
 * @drenyra/mission-domain — mission-receipt ADAPTER SHIM.
 *
 * The canonical receipt crypto layer lives in `drenyra-ai/receipts` (released
 * v0.0.1-prealpha.1; this file was the original source of the port). Explicit
 * names only — `EvidenceItem` stays local (re-exported from mission-contracts)
 * to avoid a duplicate with the legacy contracts types.
 *
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents;
 * no float is ever used for money; hashes are lowercase hex, never floats.
 */

export type {
	KeyTrustResolver,
	ReceiptContent,
	ReceiptKeyPair,
	ReceiptVerificationStatus,
	ReceiptVerificationSteps,
	SignedReceipt,
	SigningKeyInfo,
} from "drenyra-ai/receipts";
export {
	buildSignedReceipt,
	computeEvidenceHash,
	generateReceiptHash,
	generateReceiptKeyPair,
	signReceipt,
	verifyReceiptIntegrity,
	verifyReceiptSignature,
	verifySignedReceipt,
	verifySignedReceiptTrusted,
} from "drenyra-ai/receipts";
export type { EvidenceItem } from "./mission-contracts.js";
