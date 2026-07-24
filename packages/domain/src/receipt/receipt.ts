/**
 * Receipt Domain Types — RED (Receipt-Driven Execution)
 *
 * Canonical types for immutable execution receipts.
 * Framework-free, no external dependencies.
 *
 * @module @drenyra/domain/receipt
 */

import { createHash } from "node:crypto";

/**
 * Identifies who or what performed the action.
 */
export interface ReceiptActor {
	id: string;
	type: "user" | "agent" | "system";
}

/**
 * Fiscal scope at the time of action.
 */
export interface ReceiptScope {
	organizationId: string;
	companyId: string;
	companyRuc: string;
	fiscalPeriod: string;
}

/**
 * Canonical receipt — immutable record of an executed action.
 */
export interface Receipt {
	/** Unique identifier (UUID v7 recommended) */
	id: string;
	/** Action type (e.g. "journal:post", "sire:submit", "document:ingest") */
	action: string;
	/** ISO 8601 timestamp of when the action completed */
	timestamp: string;
	/** Who performed the action */
	actor: ReceiptActor;
	/** Fiscal scope at execution time */
	scope: ReceiptScope;
	/** SHA-256 of the original action input */
	inputHash: string;
	/** SHA-256 of the action result */
	outputHash: string;
	/** SHA-256 of (previous_receipt_chain_hash + this receipt's content hash) */
	chainHash: string;
	/** Schema version (semver) */
	version: string;
	/** Cryptographic signature of the chainHash */
	signature: string;
}

/**
 * Parameters required to build a new receipt.
 */
export interface ReceiptInput {
	id: string;
	action: string;
	actor: ReceiptActor;
	scope: ReceiptScope;
	input: unknown;
	output: unknown;
	previousChainHash?: string;
}

/** Current receipt schema version */
export const RECEIPT_VERSION = "1.0.0";

/**
 * Compute SHA-256 hash of any serializable value.
 */
export function hashContent(value: unknown): string {
	const serialized =
		typeof value === "string"
			? value
			: JSON.stringify(value, Object.keys(value).sort());
	return createHash("sha256").update(serialized).digest("hex");
}

/**
 * Build a chain hash from the previous chain hash and the current receipt's
 * content hash (inputHash + outputHash).
 */
export function computeChainHash(
	previousChainHash: string | undefined,
	inputHash: string,
	outputHash: string,
): string {
	const previous = previousChainHash ?? "";
	const payload = `${previous}:${inputHash}:${outputHash}`;
	return createHash("sha256").update(payload).digest("hex");
}

/**
 * Create a new Receipt from ReceiptInput.
 *
 * This is a pure function — no side effects.
 */
export function createReceipt(input: ReceiptInput): Receipt {
	const inputHash = hashContent(input.input);
	const outputHash = hashContent(input.output);
	const chainHash = computeChainHash(
		input.previousChainHash,
		inputHash,
		outputHash,
	);

	return {
		id: input.id,
		action: input.action,
		timestamp: new Date().toISOString(),
		actor: input.actor,
		scope: input.scope,
		inputHash,
		outputHash,
		chainHash,
		version: RECEIPT_VERSION,
		signature: "", // Signature is added by the signing service
	};
}

/**
 * Verify a receipt's chain integrity.
 * Returns true if the chain hash is consistent with the given previous hash.
 */
export function verifyReceiptChain(
	receipt: Receipt,
	previousChainHash?: string,
): boolean {
	const expectedChain = computeChainHash(
		previousChainHash,
		receipt.inputHash,
		receipt.outputHash,
	);
	return receipt.chainHash === expectedChain;
}

/**
 * Verify that a receipt's input hash matches the original input.
 */
export function verifyReceiptInput(
	receipt: Receipt,
	originalInput: unknown,
): boolean {
	return receipt.inputHash === hashContent(originalInput);
}

/**
 * Verify that a receipt's output hash matches the original output.
 */
export function verifyReceiptOutput(
	receipt: Receipt,
	originalOutput: unknown,
): boolean {
	return receipt.outputHash === hashContent(originalOutput);
}
