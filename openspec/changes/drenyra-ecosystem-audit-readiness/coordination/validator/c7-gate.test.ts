/** U3c RED/GREEN — C7 gate (criterion 13). RED: absent c7-gate module; GREEN: C7 stays not-required in zero
 * fixtures; opening is ONE atomic decision requiring all seven proofs PLUS core-owner authority; partial opening
 * impossible (C7_TRIGGER_INCOMPLETE); C7 at most `planning` from the umbrella (never executable); cleanup/migration/
 * speculative-reuse/freshness/convenience/shim-aesthetics triggers rejected; safe consumer-local correction stays
 * with the consumer. Whole integers only — no monetary floats. */
import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";
import { c7GateErrors } from "./c7-gate.js";
import { resolveLedger } from "./resolver.js";
import { validateLedgerYaml } from "./schema-validator.js";
import { readFixture, readLedger } from "./test-utils.js";

const C7_FIXTURES = [
	"c7-not-required.yaml",
	"c7-partial-proofs.yaml",
	"c7-full-proofs.yaml",
];
const SEVEN = [
	"c7-proof: reproducible-case",
	"c7-proof: contract-behavior",
	"c7-proof: ownership-rationale",
	"c7-proof: smallest-correction",
	"c7-proof: independent-child-sdd",
	"c7-proof: versioning-policy",
	"c7-proof: release-pin-verify",
	"c7-authority: core-owner",
];
function c7Data(tokens: string[], state = "planning") {
	const base = {
		kind: "verification",
		child: "C7",
		owner: "drenyra-ai",
		authority_path: "openspec/changes/c7-core-opening/state.yaml",
		revision: "r-unit",
		result: "passed",
		timestamp: "2026-08-09T02:00:00Z",
	};
	return {
		children: {
			C7: {
				owner: "drenyra-ai",
				authority_mode: "external-reference",
				change_id: "c7-core-opening",
				state_path: "openspec/changes/c7-core-opening/state.yaml",
				revision: "r-unit",
				observed_phase: "planning",
				observed_status: "planned",
				program_state: state,
				blockers: [],
				mandatory: false,
				conditional: true,
			},
		},
		evidence: Object.fromEntries(
			tokens.map((token, i) => [
				`evt-c7-${i}`,
				{ ...base, check_result: token },
			]),
		),
	};
}
describe("c7 gate (U3c)", () => {
	it("c7-gate fixtures are schema-valid (fail on missing c7-gate checks only)", () => {
		for (const f of C7_FIXTURES)
			expect(validateLedgerYaml(readFixture(f)).valid, f).toBe(true);
	});
	it("zero fixtures open C7: not-required with no proof claim is clean (criterion 13)", () => {
		const r = resolveLedger(readFixture(C7_FIXTURES[0]));
		expect(r.valid).toBe(true);
		expect(r.errors.join(" ")).not.toContain("c7 gate");
		expect(r.children.C7).toEqual({ state: "not-required", blockers: [] });
	});
	it("partial opening is impossible: partial-proof fixture blocks with C7_TRIGGER_INCOMPLETE (criterion 13)", () => {
		const r = resolveLedger(readFixture(C7_FIXTURES[1]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("c7 gate");
		expect(r.errors.join(" ")).toContain("C7_TRIGGER_INCOMPLETE");
	});
	it("full-proof fixture transitions C7 at most to planning (criterion 13)", () => {
		const r = resolveLedger(readFixture(C7_FIXTURES[2]));
		expect(r.valid).toBe(true);
		expect(r.errors.join(" ")).not.toContain("c7 gate");
		expect(r.children.C7.state).toBe("planning");
	});
	it("unit matrix: rejected triggers, consumer-local, beyond-planning, and 0-7 partial proof sets fail closed", () => {
		for (const trigger of [
			"cleanup",
			"migration",
			"speculative-reuse",
			"freshness",
			"convenience",
			"shim-aesthetics",
		]) {
			expect(
				c7GateErrors(c7Data([`c7-trigger: ${trigger}`])).join(" "),
			).toContain("rejected trigger class");
		}
		expect(
			c7GateErrors(c7Data(["c7-resolution: consumer-local"])).join(" "),
		).toContain("stays with the consumer");
		expect(c7GateErrors(c7Data(SEVEN, "executable")).join(" ")).toContain(
			"at most planning",
		);
		for (let i = 0; i < SEVEN.length; i++)
			expect(c7GateErrors(c7Data(SEVEN.slice(0, i))).join(" ")).toContain(
				"C7_TRIGGER_INCOMPLETE",
			);
		expect(c7GateErrors(c7Data(SEVEN))).toEqual([]);
	});
	it("is deterministic and the bootstrap ledger stays clean", () => {
		for (const f of C7_FIXTURES)
			expect(resolveLedger(readFixture(f))).toEqual(
				resolveLedger(readFixture(f)),
			);
		const data = parseDocument(readLedger()).toJS() as Parameters<
			typeof c7GateErrors
		>[0];
		expect(c7GateErrors(data)).toEqual([]);
		expect(resolveLedger(readLedger()).errors).toEqual([]);
	});
});
