/** U2a RED/GREEN — deterministic resolver core. RED: absent resolver module; GREEN: hard-edge topo resolution, missing-evidence blocking, C5 independence, C6 needs C1+C5, evidence classification, determinism, bootstrap integration. */
import { describe, expect, it } from "vitest";
import {
	classifyEvidence,
	type LedgerData,
	resolveLedger,
} from "./resolver.js";
import { validateLedgerYaml } from "./schema-validator.js";
import { readFixture, readLedger } from "./test-utils.js";

const RESOLVER_FIXTURES = [
	"resolver-hard-edges.yaml",
	"resolver-missing-evidence.yaml",
	"resolver-partial-evidence.yaml",
];
const BLOCKED_DEP = { state: "blocked", blockers: ["DEPENDENCY_UNSATISFIED"] };
const EVIDENCE_CTX: LedgerData = {
	children: { C1: {} },
	evidence: {},
	events: [{ timestamp: "2026-08-09T00:00:00Z" }],
};
describe("deterministic resolver (U2a)", () => {
	it("resolver fixtures are schema-valid (fail on missing resolver checks only)", () => {
		for (const f of RESOLVER_FIXTURES)
			expect(validateLedgerYaml(readFixture(f)).valid, f).toBe(true);
	});
	it("resolves the hard-edge matrix topologically: C1→C2→C3→C4 and C1/C5→C6; blockers override eligible summaries", () => {
		const r = resolveLedger(readFixture(RESOLVER_FIXTURES[0]));
		expect(r.valid).toBe(true);
		expect(r.children.C1).toEqual({
			state: "blocked",
			blockers: ["H02_REVIEW_PENDING"],
		});
		for (const c of ["C2", "C3", "C4", "C6"])
			expect(r.children[c]).toEqual(BLOCKED_DEP);
		expect(r.children.C5).toEqual({ state: "eligible", blockers: [] });
		expect(r.children.C7).toEqual({ state: "not-required", blockers: [] });
		expect(r.ecosystem_ready).toBe(false);
	});
	it("missing dependency evidence blocks even when the summary says eligible", () => {
		const r = resolveLedger(readFixture(RESOLVER_FIXTURES[1]));
		expect(r.children.C1).toEqual({ state: "eligible", blockers: [] });
		expect(r.children.C2).toEqual(BLOCKED_DEP);
		expect(r.children.C6).toEqual(BLOCKED_DEP);
	});
	it("C5 resolves independently of C1's derived state", () => {
		const hard = resolveLedger(readFixture(RESOLVER_FIXTURES[0]));
		const partial = resolveLedger(readFixture(RESOLVER_FIXTURES[2]));
		expect(hard.children.C1.state).toBe("blocked");
		expect(hard.children.C5).toEqual({ state: "eligible", blockers: [] });
		expect(partial.children.C1.state).toBe("eligible");
		expect(partial.children.C5).toEqual({ state: "declared", blockers: [] });
	});
	it("C6 requires BOTH C1 and C5: valid C1-chain evidence alone still leaves C6 blocked", () => {
		const r = resolveLedger(readFixture(RESOLVER_FIXTURES[2]));
		expect(r.children.C2).toEqual({ state: "eligible", blockers: [] });
		expect(r.children.C3).toEqual({ state: "eligible", blockers: [] });
		expect(r.children.C4).toEqual({ state: "eligible", blockers: [] });
		expect(r.children.C6).toEqual(BLOCKED_DEP);
	});
	it("classifies evidence as valid/stale/contradictory/unverifiable without deleting history", () => {
		const base = {
			kind: "dependency",
			child: "C1",
			owner: "drenyra",
			authority_path:
				"openspec/changes/drenyra-h02-tenant-isolation/state.yaml",
			revision: "93bc8e1ae081d9ca567f75eeb00f5b91e01ad9e4",
			timestamp: "2026-08-09T00:00:00Z",
			result: "passed",
		};
		expect(classifyEvidence(base, EVIDENCE_CTX)).toBe("valid");
		expect(
			classifyEvidence(
				{ ...base, timestamp: "2026-08-08T00:00:00Z" },
				EVIDENCE_CTX,
			),
		).toBe("stale");
		expect(classifyEvidence({ ...base, result: "failed" }, EVIDENCE_CTX)).toBe(
			"contradictory",
		);
		expect(
			classifyEvidence({ ...base, revision: "unlinked" }, EVIDENCE_CTX),
		).toBe("unverifiable");
		expect(classifyEvidence({ ...base, result: "green" }, EVIDENCE_CTX)).toBe(
			"unverifiable",
		);
	});
	it("derives the bootstrap children_derived map (C1 blocked/H02, C7 not-required, never ecosystem-ready)", () => {
		const r = resolveLedger(readLedger());
		expect(r.valid).toBe(true);
		expect(r.children.C1).toEqual({
			state: "blocked",
			blockers: ["H02_REVIEW_PENDING"],
		});
		for (const c of ["C2", "C3", "C4", "C6"])
			expect(r.children[c]).toEqual(BLOCKED_DEP);
		expect(r.children.C5).toEqual({ state: "declared", blockers: [] });
		expect(r.children.C7).toEqual({ state: "not-required", blockers: [] });
		expect(r.ecosystem_ready).toBe(false);
	});
	it("is deterministic: identical input yields identical derived states", () => {
		for (const text of [readLedger(), ...RESOLVER_FIXTURES.map(readFixture)]) {
			expect(resolveLedger(text)).toEqual(resolveLedger(text));
		}
	});
});
