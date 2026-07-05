import { describe, expect, it } from "vitest";
import { computeAuditHash } from "../compute-audit-hash";

describe("computeAuditHash", () => {
	const payload = { amount: 100, currency: "PEN" };
	const prevHash = "a".repeat(64);

	it("should produce a deterministic hash for the same inputs", async () => {
		const a = await computeAuditHash(payload, prevHash);
		const b = await computeAuditHash(payload, prevHash);
		expect(a).toBe(b);
	});

	it("should produce different hashes for different payloads", async () => {
		const a = await computeAuditHash({ amount: 100 }, prevHash);
		const b = await computeAuditHash({ amount: 200 }, prevHash);
		expect(a).not.toBe(b);
	});

	it("should produce different hashes for different prevHash", async () => {
		const a = await computeAuditHash(payload, null);
		const b = await computeAuditHash(payload, prevHash);
		expect(a).not.toBe(b);
	});

	it("should output a 64-character lowercase hex string", async () => {
		const hash = await computeAuditHash(payload, prevHash);
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it("should handle genesis (prevHash = null) input", async () => {
		const hash = await computeAuditHash(payload, null);
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it("should be idempotent when payload has same logical content", async () => {
		const a = await computeAuditHash({ b: 2, a: 1 }, null);
		const b = await computeAuditHash({ a: 1, b: 2 }, null);
		expect(a).toBe(b);
	});
});
