import { describe, expect, it } from "vitest";
import { computeEvidenceBundleHash } from "../evidence-bundle-hash";

describe("computeEvidenceBundleHash", () => {
	it("is a 64-char lowercase SHA-256 hex digest", async () => {
		expect(await computeEvidenceBundleHash([{ id: "e1" }])).toMatch(
			/^[0-9a-f]{64}$/,
		);
	});

	it("ignores key order, at every depth (PostgreSQL jsonb reorders keys)", async () => {
		const written = [{ id: "e1", type: "gate-results", meta: { b: 2, a: 1 } }];
		const readBackFromJsonb = [
			{ id: "e1", meta: { a: 1, b: 2 }, type: "gate-results" },
		];
		expect(await computeEvidenceBundleHash(readBackFromJsonb)).toBe(
			await computeEvidenceBundleHash(written),
		);
	});

	it("changes when any nested value changes", async () => {
		const a = await computeEvidenceBundleHash([{ id: "e1", hash: "aaa" }]);
		const b = await computeEvidenceBundleHash([{ id: "e1", hash: "bbb" }]);
		const c = await computeEvidenceBundleHash([{ id: "e2", hash: "aaa" }]);
		expect(new Set([a, b, c]).size).toBe(3);
	});

	it("treats undefined fields as absent, as JSON storage does", async () => {
		expect(
			await computeEvidenceBundleHash([{ id: "e1", uri: undefined }]),
		).toBe(await computeEvidenceBundleHash([{ id: "e1" }]));
	});

	it("keeps item order significant", async () => {
		expect(
			await computeEvidenceBundleHash([{ id: "e1" }, { id: "e2" }]),
		).not.toBe(await computeEvidenceBundleHash([{ id: "e2" }, { id: "e1" }]));
	});
});
