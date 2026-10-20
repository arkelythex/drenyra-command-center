import { normalizeJson } from "./normalize-json";

/**
 * Canonical SHA-256 of an evidence bundle, shared by the producer that seals
 * a proposal and the verifier that checks it at approval time.
 *
 * The bundle is first round-tripped through JSON (as storage does, dropping
 * `undefined` fields) and then serialized with sorted keys at every depth, so
 * a bundle read back from PostgreSQL `jsonb` (which reorders keys) hashes the
 * same as the one that was written. Item order stays significant.
 *
 * @returns 64-char lowercase hex SHA-256 digest.
 */
export async function computeEvidenceBundleHash(
	evidence: unknown,
): Promise<string> {
	const stored: unknown = JSON.parse(JSON.stringify(evidence ?? null));
	const data = new TextEncoder().encode(normalizeJson(stored));
	const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
