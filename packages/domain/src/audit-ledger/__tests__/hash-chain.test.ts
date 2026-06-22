import { describe, it, expect } from "vitest";
import { HashChain } from "../hash-chain.vo";

describe("HashChain", () => {
	const HEX_64 = "a".repeat(64);
	const HEX_64_B = "b".repeat(64);

	describe("create", () => {
		it("should create a genesis entry with prevHash = null", () => {
			const chain = HashChain.create({ hash: HEX_64, prevHash: null });
			expect(chain.hash).toBe(HEX_64);
			expect(chain.prevHash).toBeNull();
			expect(chain.isGenesis()).toBe(true);
		});

		it("should create a linked entry with prevHash", () => {
			const chain = HashChain.create({ hash: HEX_64_B, prevHash: HEX_64 });
			expect(chain.hash).toBe(HEX_64_B);
			expect(chain.prevHash).toBe(HEX_64);
			expect(chain.isGenesis()).toBe(false);
		});

		it("should reject hash shorter than 64 chars", () => {
			expect(() =>
				HashChain.create({ hash: "a".repeat(63), prevHash: null }),
			).toThrow("64-character");
		});

		it("should reject hash longer than 64 chars", () => {
			expect(() =>
				HashChain.create({ hash: "a".repeat(65), prevHash: null }),
			).toThrow("64-character");
		});

		it("should reject hash with non-hex characters", () => {
			expect(() =>
				HashChain.create({ hash: "z".repeat(64), prevHash: null }),
			).toThrow("64-character");
		});

		it("should reject uppercase hex", () => {
			expect(() =>
				HashChain.create({ hash: "A".repeat(64), prevHash: null }),
			).toThrow("64-character");
		});
	});

	describe("genesis", () => {
		it("should create a genesis entry", () => {
			const chain = HashChain.genesis(HEX_64);
			expect(chain.hash).toBe(HEX_64);
			expect(chain.prevHash).toBeNull();
			expect(chain.isGenesis()).toBe(true);
		});
	});

	describe("equals", () => {
		it("should return true for identical chains", () => {
			const a = HashChain.create({ hash: HEX_64, prevHash: null });
			const b = HashChain.create({ hash: HEX_64, prevHash: null });
			expect(a.equals(b)).toBe(true);
		});

		it("should return false for different hashes", () => {
			const a = HashChain.create({ hash: HEX_64, prevHash: null });
			const b = HashChain.create({ hash: HEX_64_B, prevHash: null });
			expect(a.equals(b)).toBe(false);
		});

		it("should return false for different prevHash", () => {
			const a = HashChain.create({ hash: HEX_64, prevHash: null });
			const b = HashChain.create({ hash: HEX_64, prevHash: HEX_64_B });
			expect(a.equals(b)).toBe(false);
		});
	});
});
