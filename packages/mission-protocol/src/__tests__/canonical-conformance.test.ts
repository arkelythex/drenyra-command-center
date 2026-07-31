import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Sorted JSON serialization — matches Go's sortedMarshal.
 * Produces deterministic key-sorted JSON for hashing.
 */
function sortedStringify(obj: Record<string, unknown>): string {
	const keys = Object.keys(obj).sort();
	const parts = keys.map((k) => {
		const v = JSON.stringify(obj[k]);
		return `${JSON.stringify(k)}:${v}`;
	});
	return `{${parts.join(",")}}`;
}

/**
 * Compute SHA-256 hex hash of canonical JSON.
 */
function canonicalHash(obj: Record<string, unknown>): string {
	const canonical = sortedStringify(obj);
	return createHash("sha256").update(canonical, "utf-8").digest("hex");
}

/**
 * Compute evidence hash — sorted by id, then SHA-256.
 */
function evidenceHash(
	evidence: Array<{ id: string; [k: string]: unknown }>,
): string {
	const sorted = [...evidence].sort((a, b) => a.id.localeCompare(b.id));
	const json = JSON.stringify(sorted);
	return createHash("sha256").update(json, "utf-8").digest("hex");
}

interface CanonicalVector {
	id: string;
	description: string;
	input: Record<string, unknown>;
	expectedCanonicalJson?: string;
	expectedSha256?: string;
}

function loadFixtures(): { vectors: CanonicalVector[] } {
	// Try multiple paths for the fixtures file
	const paths = [
		resolve(__dirname, "../../../../fixtures/canonicalization-vectors.json"),
		resolve(__dirname, "../../../fixtures/canonicalization-vectors.json"),
		resolve(process.cwd(), "fixtures/canonicalization-vectors.json"),
	];
	for (const p of paths) {
		try {
			const data = readFileSync(p, "utf-8");
			return JSON.parse(data);
		} catch {}
	}
	throw new Error("Cannot find canonicalization-vectors.json");
}

describe("Cross-language canonical JSON conformance", () => {
	const fixtures = loadFixtures();

	it("loads canonicalization vectors", () => {
		expect(fixtures.vectors.length).toBeGreaterThan(0);
	});

	for (const vector of fixtures.vectors) {
		it(`canonical hash matches Go: ${vector.id}`, () => {
			// Vector 1: receipt content (object)
			// Vector 2: receipt minimal (object)
			// Vector 3: evidence array (not an object)
			if (vector.expectedSha256) {
				if (Array.isArray(vector.input)) {
					// Evidence array
					const hash = evidenceHash(
						vector.input as Array<{ id: string; [k: string]: unknown }>,
					);
					expect(hash).toBe(vector.expectedSha256);
				} else {
					// Receipt content object
					const hash = canonicalHash(vector.input as Record<string, unknown>);
					expect(hash).toBe(vector.expectedSha256);
				}
			}
		});

		if (vector.expectedCanonicalJson) {
			it(`canonical JSON matches Go: ${vector.id}`, () => {
				const canonical = sortedStringify(
					vector.input as Record<string, unknown>,
				);
				expect(canonical).toBe(vector.expectedCanonicalJson);
			});
		}
	}
});
