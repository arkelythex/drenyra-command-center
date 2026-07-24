import { describe, it, expect } from "vitest";
import { evaluateFiscalGate } from "../../src/classifier/fiscal-gate";
import type { ClassifierResult } from "../../src/classifier/classifier";
import type { HumanAuthState } from "../../src/classifier/fiscal-gate";

function makeClassifierResult(overrides: Partial<ClassifierResult>): ClassifierResult {
	return {
		level: "R1",
		matchedPaths: [],
		matchedContentPatterns: [],
		blocked: false,
		ambiguous: false,
		failClosed: false,
		evaluatedAt: new Date().toISOString(),
		reason: "test",
		diffStats: {
			addedLines: 0,
			modifiedFiles: 0,
			renamedFiles: [],
			deletedFiles: [],
		},
		...overrides,
	};
}

const TREE_HASH = "abc123def456abc123def456abc123def456abc1";

describe("evaluateFiscalGate — R0/R1", () => {
	it("allows R0/R1 without human auth", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R1" }),
			{ required: false, present: false, validForTreeHash: null, authorizedAt: null },
			TREE_HASH,
		);
		expect(result.action).toBe("allow");
		expect(result.exitCode).toBe(0);
	});

	it("includes R1 in the gate message", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R1" }),
			{ required: false, present: false, validForTreeHash: null, authorizedAt: null },
			TREE_HASH,
		);
		expect(result.message).toContain("R1");
	});
});

describe("evaluateFiscalGate — R2", () => {
	it("blocks R2 without human auth", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R2", matchedPaths: ["packages/fiscal/src/rates.ts"] }),
			{ required: true, present: false, validForTreeHash: null, authorizedAt: null },
			TREE_HASH,
		);
		expect(result.action).toBe("block");
		expect(result.exitCode).toBe(1);
		expect(result.message).toContain("R2");
		expect(result.message).toContain("BLOQUEADO");
	});

	it("allows R2 with valid human auth", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R2", matchedPaths: ["packages/fiscal/src/rates.ts"] }),
			{ required: true, present: true, validForTreeHash: TREE_HASH, authorizedAt: "2026-07-15T00:00:00Z" },
			TREE_HASH,
		);
		expect(result.action).toBe("allow");
		expect(result.exitCode).toBe(0);
		expect(result.message).toContain("VÁLIDA");
	});

	it("blocks R2 when auth is for different tree hash", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R2" }),
			{ required: true, present: true, validForTreeHash: "different_hash", authorizedAt: "2026-07-15T00:00:00Z" },
			TREE_HASH,
		);
		expect(result.action).toBe("block");
		expect(result.exitCode).toBe(1);
	});

	it("shows matched paths in output", () => {
		const paths = ["packages/fiscal/src/rates.ts", "packages/fiscal/src/tasas.ts"];
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R2", matchedPaths: paths }),
			{ required: true, present: false, validForTreeHash: null, authorizedAt: null },
			TREE_HASH,
		);
		for (const p of paths) {
			expect(result.message).toContain(p);
		}
	});

	it("shows authorization instructions in message", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R2" }),
			{ required: true, present: false, validForTreeHash: null, authorizedAt: null },
			TREE_HASH,
		);
		expect(result.message).toContain("authorize");
		expect(result.message).toContain(TREE_HASH);
	});
});

describe("evaluateFiscalGate — R3", () => {
	it("blocks R3 always", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R3", matchedPaths: ["secrets/prod.key"] }),
			{ required: true, present: false, validForTreeHash: null, authorizedAt: null },
			TREE_HASH,
		);
		expect(result.action).toBe("block");
		expect(result.exitCode).toBe(1);
		expect(result.message).toContain("R3");
	});

	it("blocks R3 even with human auth present (R3 requires specific auth)", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R3" }),
			{ required: true, present: true, validForTreeHash: TREE_HASH, authorizedAt: "2026-07-15T00:00:00Z" },
			TREE_HASH,
		);
		expect(result.action).toBe("block");
		expect(result.exitCode).toBe(1);
	});

	it("shows matched patterns in R3 output", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({
				level: "R3",
				matchedPaths: ["migrations/production/deploy.ts"],
				matchedContentPatterns: ["DROP TABLE"],
			}),
			{ required: true, present: false, validForTreeHash: null, authorizedAt: null },
			TREE_HASH,
		);
		expect(result.message).toContain("migrations/production/deploy.ts");
	});
});

describe("evaluateFiscalGate — fail-closed", () => {
	it("blocks on ambiguous fail-closed", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R2", ambiguous: true, failClosed: true }),
			{ required: true, present: false, validForTreeHash: null, authorizedAt: null },
			TREE_HASH,
		);
		expect(result.action).toBe("block");
		expect(result.exitCode).toBe(1);
		expect(result.message).toContain("AMBIGUA");
		expect(result.message).toContain("fail-closed");
	});

	it("blocks on ambiguous fail-closed even with auth present", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R2", ambiguous: true, failClosed: true }),
			{ required: true, present: true, validForTreeHash: TREE_HASH, authorizedAt: "2026-07-15T00:00:00Z" },
			TREE_HASH,
		);
		// fail-closed should block regardless of auth
		expect(result.action).toBe("block");
	});
});

describe("evaluateFiscalGate — edge cases", () => {
	it("returns block for R2 with empty matchedPaths", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R2", matchedPaths: [] }),
			{ required: true, present: false, validForTreeHash: null, authorizedAt: null },
			TREE_HASH,
		);
		expect(result.action).toBe("block");
	});

	it("handles null authorizedAt gracefully", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R2" }),
			{ required: true, present: true, validForTreeHash: TREE_HASH, authorizedAt: null },
			TREE_HASH,
		);
		// present + validForTreeHash match → allow (authorizedAt is display-only)
		expect(result.action).toBe("allow");
	});

	it("does not expose internal structure in message", () => {
		const result = evaluateFiscalGate(
			makeClassifierResult({ level: "R3" }),
			{ required: true, present: false, validForTreeHash: null, authorizedAt: null },
			TREE_HASH,
		);
		expect(result.message).not.toContain("[object Object]");
	});
});
