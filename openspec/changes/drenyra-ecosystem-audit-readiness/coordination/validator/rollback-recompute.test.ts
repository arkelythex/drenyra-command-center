/** U4.1/U4.2 RED/GREEN — rollback recomputation (criterion 15). The ledger appends `rolled-back` without deleting
 * history; a rollback event requires verifiable proof (passed rollback-kind evidence at an immutable revision via
 * evidence_refs); a child recorded rolled-back without a rollback event cannot produce a false rolled-back state;
 * descendants relying solely on reverted proof derive blocked/ROLLBACK_INVALIDATED_DEPENDENCY; no sibling changes as
 * compensation. Whole integers only — no monetary floats. */
import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";
import { resolveLedger } from "./resolver.js";
import { rollbackRecomputeErrors } from "./rollback-recompute.js";
import { validateLedgerYaml } from "./schema-validator.js";
import { readFixture, readLedger } from "./test-utils.js";

const FIXTURES = ["rollback-valid.yaml", "rollback-unverifiable.yaml"];
const C5 = {
	owner: "drenyra-pi",
	authority_mode: "external-reference",
	change_id: "drenyra-c5-baseline",
	state_path: "openspec/changes/drenyra-c5-baseline/state.yaml",
	revision: "r-c5-9f2a",
	observed_phase: "delivered",
	observed_status: "delivered",
	program_state: "rolled-back",
	blockers: [],
	mandatory: true,
	conditional: false,
};
function rollbackData(
	events: unknown[],
	evidence: Record<string, unknown> = {},
) {
	return {
		children: { C5 },
		repositories: {
			"drenyra-pi": {
				identity: "drenyra-pi",
				authority_kind: "sibling",
				allowed_child_prefix: "openspec/changes/",
			},
		},
		evidence,
		events,
	};
}
function rollbackEvent(overrides: Record<string, unknown> = {}) {
	return {
		id: "evt-r",
		kind: "rollback",
		child: "C5",
		revision: 3,
		timestamp: "2026-08-09T07:30:00Z",
		prior_state: "delivered",
		new_state: "rolled-back",
		evidence_refs: ["evt-e-r"],
		...overrides,
	};
}
function rollbackEvidence(overrides: Record<string, unknown> = {}) {
	return {
		id: "evt-e-r",
		kind: "rollback",
		child: "C5",
		owner: "drenyra-pi",
		authority_path: "openspec/changes/drenyra-c5-baseline/state.yaml",
		revision: "r-c5-9f2a",
		timestamp: "2026-08-09T07:00:00Z",
		result: "passed",
		check_result: "rollback proof for C5",
		...overrides,
	};
}
const UNVERIFIABLE =
	"rollback: unverifiable rollback proof for C5 (no passed rollback evidence at an immutable revision)";
describe("rollback recomputation (U4.1/U4.2)", () => {
	it("rollback fixtures are schema-valid (fail on missing rollback checks only)", () => {
		for (const f of FIXTURES)
			expect(validateLedgerYaml(readFixture(f)).valid, f).toBe(true);
	});
	it("rollback-valid: C5 derives rolled-back; descendant C6 derives blocked/ROLLBACK_INVALIDATED_DEPENDENCY", () => {
		const r = resolveLedger(readFixture(FIXTURES[0]));
		expect(r.valid).toBe(true);
		expect(r.children.C5).toEqual({ state: "rolled-back", blockers: [] });
		expect(r.children.C6).toEqual({
			state: "blocked",
			blockers: ["DEPENDENCY_UNSATISFIED", "ROLLBACK_INVALIDATED_DEPENDENCY"],
		});
		expect(r.ecosystem_ready).toBe(false);
	});
	it("rollback-unverifiable: empty evidence_refs cannot produce a false rolled-back state (fail closed)", () => {
		const r = resolveLedger(readFixture(FIXTURES[1]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("unverifiable rollback proof for C5");
	});
	it("history is preserved: the rollback event and every prior event remain (nothing deleted)", () => {
		const ids = (
			parseDocument(readFixture(FIXTURES[0])).toJS().events as { id: string }[]
		).map((e) => e.id);
		expect(ids).toEqual(["evt-1", "evt-c5-delivered", "evt-rollback-c5"]);
	});
	it("matrix: rolled-back without a rollback event, mutable-revision proof, and failed proof all fail closed", () => {
		expect(
			rollbackRecomputeErrors(
				rollbackData([], { "evt-e-r": rollbackEvidence() }),
			),
		).toEqual([
			"rollback: C5 recorded rolled-back without a rollback event (cannot produce a false rolled-back state)",
		]);
		expect(
			rollbackRecomputeErrors(
				rollbackData([rollbackEvent()], {
					"evt-e-r": rollbackEvidence({ revision: "latest" }),
				}),
			),
		).toEqual([UNVERIFIABLE]);
		expect(
			rollbackRecomputeErrors(
				rollbackData([rollbackEvent()], {
					"evt-e-r": rollbackEvidence({ result: "failed" }),
				}),
			),
		).toEqual([UNVERIFIABLE]);
	});
	it("a non-dependent child is unaffected by an unrelated rollback (no cross-repo compensation)", () => {
		const data = rollbackData(
			[
				rollbackEvent(),
				{
					id: "evt-2",
					kind: "decision",
					child: "C5",
					revision: 2,
					timestamp: "2026-08-09T06:00:00Z",
					prior_state: "requested",
					new_state: "decided",
					evidence_refs: [],
				},
			],
			{ "evt-e-r": rollbackEvidence() },
		);
		expect(rollbackRecomputeErrors(data)).toEqual([]);
	});
	it("is deterministic: identical input yields identical rollback verdicts (fixtures + bootstrap)", () => {
		for (const text of [readLedger(), ...FIXTURES.map(readFixture)])
			expect(resolveLedger(text)).toEqual(resolveLedger(text));
	});
});
