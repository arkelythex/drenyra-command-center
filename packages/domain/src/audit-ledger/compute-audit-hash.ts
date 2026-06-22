import { normalizeJson } from "./normalize-json";

/**
 * Compute a SHA-256 hex digest for an audit event payload.
 *
 * SHA-256( normalizeJson(payload) + (prevHash ?? "GENESIS") )
 *
 * Uses the Web Crypto API (`globalThis.crypto.subtle`) which is available
 * everywhere: modern browsers, Bun, Node 19+.
 *
 * Async because SubtleCrypto.digest is Promise-based.
 *
 * @param payload  The event payload to hash (must be deterministic).
 * @param prevHash The `chainHash` of the previous event in the scope,
 *                 or `null` for the first (genesis) event.
 * @returns 64-char lowercase hex SHA-256 digest.
 *
 * @example
 * ```ts
 * const hash = await computeAuditHash({ amount: 100 }, null);
 * // "ab12..." (64 hex chars)
 * ```
 */
export async function computeAuditHash(
	payload: Record<string, unknown>,
	prevHash: string | null,
): Promise<string> {
	const input = normalizeJson(payload) + (prevHash ?? "GENESIS");
	const encoder = new TextEncoder();
	const data = encoder.encode(input);
	const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
