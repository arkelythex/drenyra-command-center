import fc from "fast-check";
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

/**
 * B.2 — Tests for SireEvidenceService.computeHash
 *
 * Covers: genesis hash, chain linking, determinism, sorted-key stability,
 * property-based: hash always 64-char hex, deterministic across runs.
 */
describe("SireEvidenceService.computeHash", () => {
	/**
	 * Deterministic JSON stringify with sorted keys.
	 * This utility is used by computeHash internally.
	 */
	function stableStringify(obj: unknown): string {
		if (obj === null || typeof obj !== "object") {
			return JSON.stringify(obj);
		}
		if (Array.isArray(obj)) {
			return `[${obj.map(stableStringify).join(",")}]`;
		}
		const sorted = Object.keys(obj as Record<string, unknown>)
			.sort()
			.reduce(
				(acc, key) => {
					acc[key] = (obj as Record<string, unknown>)[key];
					return acc;
				},
				{} as Record<string, unknown>,
			);
		return `{${Object.entries(sorted)
			.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
			.join(",")}}`;
	}

	it("returns 64-char hex when previousHash is empty (genesis node)", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		const payload = { amount: 100, currency: "PEN" };
		const hash = SireEvidenceService.computeHash({
			previousHash: "",
			canonicalPayload: payload,
		});

		expect(hash).toHaveLength(64);
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});

	it("SHA-256('' + artifactHash) when previousHash is empty", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		const payload = { amount: 100, currency: "PEN" };
		const hash = SireEvidenceService.computeHash({
			previousHash: "",
			canonicalPayload: payload,
		});

		// Manually compute expected: SHA-256('' + SHA-256(stableJSON(payload)))
		const artifactHash = createHash("sha256")
			.update(stableStringify(payload))
			.digest("hex");
		const expected = createHash("sha256")
			.update("" + artifactHash)
			.digest("hex");

		expect(hash).toBe(expected);
	});

	it("chains correctly with non-empty previousHash", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		const previousHash =
			"abc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1";
		const payload = { period: "2026-03", items: [1, 2, 3] };

		const hash = SireEvidenceService.computeHash({
			previousHash,
			canonicalPayload: payload,
		});

		const artifactHash = createHash("sha256")
			.update(stableStringify(payload))
			.digest("hex");
		const expected = createHash("sha256")
			.update(previousHash + artifactHash)
			.digest("hex");

		expect(hash).toBe(expected);
		expect(hash).toHaveLength(64);
	});

	it("produces deterministic hashes for the same inputs", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		const payload = { a: 1, b: 2, c: { d: 3, e: 4 } };

		const hash1 = SireEvidenceService.computeHash({
			previousHash: "prev",
			canonicalPayload: payload,
		});
		const hash2 = SireEvidenceService.computeHash({
			previousHash: "prev",
			canonicalPayload: payload,
		});

		expect(hash1).toBe(hash2);
	});

	it("sorted keys produce the same hash regardless of insertion order", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		// Same data, different key order
		const payloadA = { z: "last", a: "first", m: "middle" };
		const payloadB = { a: "first", m: "middle", z: "last" };

		const hashA = SireEvidenceService.computeHash({
			previousHash: "",
			canonicalPayload: payloadA,
		});
		const hashB = SireEvidenceService.computeHash({
			previousHash: "",
			canonicalPayload: payloadB,
		});

		expect(hashA).toBe(hashB);
	});

	// B.2.5–B.2.6: Property-based — hash chain determinism (100+ random payloads)
	it("produces deterministic hash for any random payload (property-based)", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		await fc.assert(
			fc.asyncProperty(
				fc.string({ minLength: 0, maxLength: 64 }),
				fc.json(),
				async (previousHash, jsonPayload) => {
					// Parse JSON to get a real object for stableStringify
					let payload: unknown;
					try {
						payload = JSON.parse(jsonPayload);
					} catch {
						payload = jsonPayload;
					}

					const hash1 = SireEvidenceService.computeHash({
						previousHash,
						canonicalPayload: payload,
					});
					const hash2 = SireEvidenceService.computeHash({
						previousHash,
						canonicalPayload: payload,
					});

					expect(hash1).toBe(hash2);
				},
			),
			{ numRuns: 100 },
		);
	});

	// B.2.7–B.2.8: Property-based — hash always 64 hex characters
	it("hash is always 64 lowercase hex characters (property-based)", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		await fc.assert(
			fc.asyncProperty(
				fc.string({ minLength: 0, maxLength: 64 }),
				fc.json(),
				async (previousHash, jsonPayload) => {
					let payload: unknown;
					try {
						payload = JSON.parse(jsonPayload);
					} catch {
						payload = jsonPayload;
					}

					const hash = SireEvidenceService.computeHash({
						previousHash,
						canonicalPayload: payload,
					});

					expect(hash).toHaveLength(64);
					expect(hash).toMatch(/^[a-f0-9]{64}$/);
				},
			),
			{ numRuns: 100 },
		);
	});
});

// ---------------------------------------------------------------------------
// B.4: Superseding evidence
// ---------------------------------------------------------------------------

describe("SireEvidenceService superseding", () => {
	it("hash chain continuity: new node previousHash equals superseded node hash", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		// Simulate correction: previous node's hash feeds into new node
		const previousNodeHash =
			"aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111aaaa1111";
		const newPayload = { corrected: true, original: { amount: 500 } };

		const newHash = SireEvidenceService.computeHash({
			previousHash: previousNodeHash,
			canonicalPayload: newPayload,
		});

		// New hash must differ from previous (chain continues)
		expect(newHash).not.toBe(previousNodeHash);
		expect(newHash).toHaveLength(64);
		expect(newHash).toMatch(/^[a-f0-9]{64}$/);
	});

	it("same payload with different previousHash produces different chain hash", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		const payload = { data: "fixed" };

		const hashA = SireEvidenceService.computeHash({
			previousHash: "aaaa",
			canonicalPayload: payload,
		});
		const hashB = SireEvidenceService.computeHash({
			previousHash: "bbbb",
			canonicalPayload: payload,
		});

		expect(hashA).not.toBe(hashB);
	});
});

// ---------------------------------------------------------------------------
// B.2.9 TRIANGULATE: Edge cases — nested objects, arrays, special chars
// ---------------------------------------------------------------------------

describe("SireEvidenceService edge cases", () => {
	it("handles nested objects and arrays deterministically", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		const payload = {
			name: "test",
			values: [3, 1, 2],
			nested: { b: 2, a: 1 },
			nullVal: null,
			boolVal: true,
		};

		const h1 = SireEvidenceService.computeHash({
			previousHash: "",
			canonicalPayload: payload,
		});
		const h2 = SireEvidenceService.computeHash({
			previousHash: "",
			canonicalPayload: {
				boolVal: true,
				nullVal: null,
				name: "test",
				nested: { a: 1, b: 2 },
				values: [3, 1, 2],
			},
		});

		expect(h1).toBe(h2);
	});

	it("handles empty payload deterministically", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		const h1 = SireEvidenceService.computeHash({
			previousHash: "",
			canonicalPayload: {},
		});
		const h2 = SireEvidenceService.computeHash({
			previousHash: "",
			canonicalPayload: {},
		});

		expect(h1).toBe(h2);
		expect(h1).toHaveLength(64);
	});
});

// ---------------------------------------------------------------------------
// B.3.9–B.3.10: Snapshot test — golden fixture hash determinism
// ---------------------------------------------------------------------------

describe("SireEvidenceService golden fixture", () => {
	it("produces deterministic hash for golden artifact", async () => {
		const { SireEvidenceService } = await import(
			"../../services/sire-evidence.service"
		);

		const goldenPayload = {
			artifactId: "0192a4e0-0000-7000-0000-000000000001",
			period: "2026-03",
			currency: "PEN",
			summary: {
				matched: 3,
				mismatched: 1,
				missingOnLedger: 1,
				missingOnSunat: 0,
				critical: 2,
				totalDifference: 650.0,
			},
			sunatSource: "upload",
			rows: [
				{
					status: "MATCH",
					reason: "Consistente entre fuentes",
					difference: 0,
				},
				{
					status: "MISMATCH",
					reason: "Diferencia de monto entre libros internos y SUNAT",
					difference: 150.0,
				},
				{
					status: "MISSING_LOCAL",
					reason: "Presente en propuesta SUNAT, ausente en libros internos",
					difference: 500.0,
				},
			],
			generatedAt: "2026-03-15T12:00:00.000Z",
		};

		// Compute hash twice — must be identical
		const hash1 = SireEvidenceService.computeHash({
			previousHash: "",
			canonicalPayload: goldenPayload,
		});
		const hash2 = SireEvidenceService.computeHash({
			previousHash: "",
			canonicalPayload: goldenPayload,
		});

		expect(hash1).toBe(hash2);
		expect(hash1).toHaveLength(64);
		expect(hash1).toMatch(/^[a-f0-9]{64}$/);

		// This is the expected hash for the golden fixture.
		// If this changes, the golden fixture or serializer behavior has changed.
		expect(hash1).toMatchInlineSnapshot(
			`"5a5c0e62a4a64d6fa71dab6cc5492b7b02c7291d66d5946b83d69063fb1a8491"`,
		);
	});
});
