import { createHash, randomInt, timingSafeEqual } from "node:crypto";

const PAIRING_CODE_LENGTH = 6;
const PAIRING_NAMESPACE = "cognitive-approval-pairing-v1";

interface PairingHashContext {
	runId: string;
	toolCallId: string;
	sessionId: string;
}

/**
 * ApprovalPairingMetadata interface.
 *
 * @example
 * ```ts
 * const value: ApprovalPairingMetadata = {} as ApprovalPairingMetadata;
 * console.log(value);
 * ```
 */
export interface ApprovalPairingMetadata {
	required: boolean;
	sessionId: string;
	hint: string;
	challenge: string;
	codeHash: string;
	algorithm: "sha256-v1";
}

/**
 * ApprovalPairingBundle interface.
 *
 * @example
 * ```ts
 * const value: ApprovalPairingBundle = {} as ApprovalPairingBundle;
 * console.log(value);
 * ```
 */
export interface ApprovalPairingBundle {
	code: string;
	metadata: ApprovalPairingMetadata;
}

function getPairingSecret(): string {
	return (
		process.env.COGNITIVE_APPROVAL_PAIRING_SECRET?.trim() ||
		"drenyra-local-pairing-secret"
	);
}

function toPairingHashInput(code: string, context: PairingHashContext): string {
	return [
		PAIRING_NAMESPACE,
		getPairingSecret(),
		context.runId,
		context.toolCallId,
		context.sessionId,
		code,
	].join(":");
}

/**
 * hashApprovalPairingCode operation.
 *
 * @param code - Input for code.
 * @param context - Input for context.
 * @returns Result of hashApprovalPairingCode.
 * @example
 * ```ts
 * const result = hashApprovalPairingCode("", {} as PairingHashContext);
 * console.log(result);
 * ```
 */
export function hashApprovalPairingCode(
	code: string,
	context: PairingHashContext,
): string {
	return createHash("sha256")
		.update(toPairingHashInput(code, context))
		.digest("hex");
}

function secureHexEquals(left: string, right: string): boolean {
	if (!left || !right) return false;
	const leftBuffer = Buffer.from(left, "hex");
	const rightBuffer = Buffer.from(right, "hex");
	if (leftBuffer.length !== rightBuffer.length) return false;
	return timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * verifyApprovalPairingCode operation.
 *
 * @param code - Input for code.
 * @param metadata - Input for metadata.
 * @param context - Input for context.
 * @returns Result of verifyApprovalPairingCode.
 * @example
 * ```ts
 * const result = verifyApprovalPairingCode("", {} as Pick, {} as Pick);
 * console.log(result);
 * ```
 */
export function verifyApprovalPairingCode(
	code: string,
	metadata: Pick<ApprovalPairingMetadata, "codeHash" | "sessionId">,
	context: Pick<PairingHashContext, "runId" | "toolCallId">,
): boolean {
	const expectedHash = hashApprovalPairingCode(code, {
		runId: context.runId,
		toolCallId: context.toolCallId,
		sessionId: metadata.sessionId,
	});

	return secureHexEquals(expectedHash, metadata.codeHash);
}

/**
 * createApprovalPairing operation.
 *
 * @param runId - Input for runId.
 * @param toolCallId - Input for toolCallId.
 * @returns Result of createApprovalPairing.
 * @example
 * ```ts
 * const result = createApprovalPairing("", "");
 * console.log(result);
 * ```
 */
export function createApprovalPairing(
	runId: string,
	toolCallId: string,
): ApprovalPairingBundle {
	const sessionId = `pair-${Date.now().toString(36)}-${randomInt(1000, 9999)}`;
	const code = randomInt(0, 1_000_000)
		.toString()
		.padStart(PAIRING_CODE_LENGTH, "0");
	const codeHash = hashApprovalPairingCode(code, {
		runId,
		toolCallId,
		sessionId,
	});

	return {
		code,
		metadata: {
			required: true,
			sessionId,
			hint: `**${code.slice(-2)}`,
			challenge:
				"Ingresa el código de pairing para ejecutar esta herramienta crítica.",
			codeHash,
			algorithm: "sha256-v1",
		},
	};
}
