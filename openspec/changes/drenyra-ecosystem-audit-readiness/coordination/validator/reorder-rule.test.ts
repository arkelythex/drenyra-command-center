/** U2c RED/GREEN — reorder rule (criterion 8). RED: absent reorder-rule module; GREEN: C2/C3 reorder passes only with no-overlap evidence plus a ledger decision; reorder without proof fails closed; C1 precedence never bypassable. */
import { describe, expect, it } from "vitest";
import { reorderRuleErrors } from "./reorder-rule.js";
import { resolveLedger } from "./resolver.js";
import { validateLedgerYaml } from "./schema-validator.js";
import { readFixture, readLedger } from "./test-utils.js";

const REORDER_FIXTURES = [
	"reorder-without-proof.yaml",
	"reorder-evidence-without-decision.yaml",
	"reorder-with-proof.yaml",
];
describe("reorder rule (U2c)", () => {
	it("reorder fixtures are schema-valid (fail on missing reorder-rule checks only)", () => {
		for (const f of REORDER_FIXTURES)
			expect(validateLedgerYaml(readFixture(f)).valid, f).toBe(true);
	});
	it("without proof: a C2/C3 reorder decision lacking no-overlap evidence fails closed", () => {
		const r = resolveLedger(readFixture(REORDER_FIXTURES[0]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("reorder rule");
		expect(r.errors.join(" ")).toContain("without no-overlap evidence");
	});
	it("without decision: reversed C2/C3 ordering with evidence but no ledger decision fails closed", () => {
		const r = resolveLedger(readFixture(REORDER_FIXTURES[1]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("reorder rule");
		expect(r.errors.join(" ")).toContain("without ledger decision");
	});
	it("with proof: no-overlap evidence plus ledger decision passes the reorder rule; C1 precedence intact", () => {
		const r = resolveLedger(readFixture(REORDER_FIXTURES[2]));
		expect(r.valid).toBe(true);
		expect(r.errors.join(" ")).not.toContain("reorder rule");
		expect(r.children.C1).toEqual({
			state: "blocked",
			blockers: ["H02_REVIEW_PENDING"],
		});
		expect(r.children.C2).toEqual({
			state: "blocked",
			blockers: ["DEPENDENCY_UNSATISFIED"],
		});
	});
	it("C1 precedence can never be bypassed by a reorder decision (unit-level)", () => {
		const errors = reorderRuleErrors({
			children: { C2: { dependencies: ["C3"] } },
			evidence: {},
			events: [
				{
					id: "evt-2",
					kind: "decision",
					child: "C2",
					reason: "reorder C2 relative to C3",
				},
			],
		});
		expect(errors.join(" ")).toContain("bypasses C1 precedence");
	});
	it("is deterministic and the bootstrap ledger stays clean", () => {
		for (const f of REORDER_FIXTURES)
			expect(resolveLedger(readFixture(f))).toEqual(
				resolveLedger(readFixture(f)),
			);
		expect(resolveLedger(readLedger()).errors).toEqual([]);
	});
});
