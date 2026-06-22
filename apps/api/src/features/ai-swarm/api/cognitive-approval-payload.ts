import { summarizeAiObservationPayload } from "./ai-observability-sanitizer";
import type { ApprovalPairingMetadata } from "./cognitive-approval-pairing";

const APPROVAL_PAYLOAD_SCHEMA = "approval_payload_v2";
const LEGACY_APPROVAL_PAYLOAD_SCHEMA = "approval_payload_v1";

/**
 * PersistedApprovalPayload interface.
 *
 * @example
 * ```ts
 * const value: PersistedApprovalPayload = {} as PersistedApprovalPayload;
 * console.log(value);
 * ```
 */
export interface PersistedApprovalPayload {
	schema: typeof APPROVAL_PAYLOAD_SCHEMA;
	argsPreview: unknown;
	argsHash: string;
	pairing: ApprovalPairingMetadata | null;
}

interface LegacyPersistedApprovalPayload {
	schema: typeof LEGACY_APPROVAL_PAYLOAD_SCHEMA;
	args: unknown;
	pairing: ApprovalPairingMetadata | null;
}

/**
 * DecodedApprovalPayload interface.
 *
 * @example
 * ```ts
 * const value: DecodedApprovalPayload = {} as DecodedApprovalPayload;
 * console.log(value);
 * ```
 */
export interface DecodedApprovalPayload {
	args: unknown;
	argsHash: string | null;
	pairing: ApprovalPairingMetadata | null;
}

function isPairingMetadata(value: unknown): value is ApprovalPairingMetadata {
	if (!value || typeof value !== "object") return false;
	const pairing = value as Partial<ApprovalPairingMetadata>;
	return (
		typeof pairing.required === "boolean" &&
		typeof pairing.sessionId === "string" &&
		typeof pairing.hint === "string" &&
		typeof pairing.challenge === "string" &&
		typeof pairing.codeHash === "string" &&
		pairing.algorithm === "sha256-v1"
	);
}

function isPersistedPayload(value: unknown): value is PersistedApprovalPayload {
	if (!value || typeof value !== "object") return false;
	const payload = value as Partial<PersistedApprovalPayload>;

	if (payload.schema !== APPROVAL_PAYLOAD_SCHEMA) return false;
	if (!("argsPreview" in payload) || typeof payload.argsHash !== "string")
		return false;
	if (payload.pairing === null || payload.pairing === undefined) return true;

	return isPairingMetadata(payload.pairing);
}

function isLegacyPersistedPayload(
	value: unknown,
): value is LegacyPersistedApprovalPayload {
	if (!value || typeof value !== "object") return false;
	const payload = value as Partial<LegacyPersistedApprovalPayload>;

	if (payload.schema !== LEGACY_APPROVAL_PAYLOAD_SCHEMA) return false;
	if (!("args" in payload)) return false;
	if (payload.pairing === null || payload.pairing === undefined) return true;

	return isPairingMetadata(payload.pairing);
}

/**
 * encodeApprovalPayload operation.
 *
 * @param args - Input for args.
 * @param pairing - Input for pairing.
 * @returns Result of encodeApprovalPayload.
 * @example
 * ```ts
 * const result = encodeApprovalPayload(undefined, {} as ApprovalPairingMetadata);
 * console.log(result);
 * ```
 */
export function encodeApprovalPayload(
	args: unknown,
	pairing: ApprovalPairingMetadata | null,
): PersistedApprovalPayload {
	const summary = summarizeAiObservationPayload(args);
	return {
		schema: APPROVAL_PAYLOAD_SCHEMA,
		argsPreview: summary.preview,
		argsHash: summary.hash,
		pairing,
	};
}

/**
 * decodeApprovalPayload operation.
 *
 * @param raw - Input for raw.
 * @returns Result of decodeApprovalPayload.
 * @example
 * ```ts
 * const result = decodeApprovalPayload(undefined);
 * console.log(result);
 * ```
 */
export function decodeApprovalPayload(raw: unknown): DecodedApprovalPayload {
	if (isPersistedPayload(raw)) {
		return {
			args: raw.argsPreview,
			argsHash: raw.argsHash,
			pairing: raw.pairing ?? null,
		};
	}

	if (isLegacyPersistedPayload(raw)) {
		const summary = summarizeAiObservationPayload(raw.args);
		return {
			args: summary.preview,
			argsHash: summary.hash,
			pairing: raw.pairing ?? null,
		};
	}

	const summary = summarizeAiObservationPayload(raw);
	return {
		args: summary.preview,
		argsHash: summary.hash,
		pairing: null,
	};
}
