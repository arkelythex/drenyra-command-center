/** U3a RED/GREEN — H02/C1 guard (criteria 4-5). RED: absent h02-c1-guard module; GREEN: C1 and its
 * dependents (C2, C3, C4, C6) can never be recorded executable-family while H02 is review-pending;
 * H02 approval alone is insufficient — C1 executable requires exact-unit forecast + pre-apply gate evidence. */
import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";
import { h02C1GuardErrors } from "./h02-c1-guard.js";
import { resolveLedger } from "./resolver.js";
import { validateLedgerYaml } from "./schema-validator.js";
import { readFixture, readLedger } from "./test-utils.js";

const GUARD_FIXTURES = [
	"guard-c1-executable-review-pending.yaml",
	"guard-dependent-executable-review-pending.yaml",
	"guard-c1-executable-without-gates.yaml",
	"guard-c1-executable-with-gates.yaml",
];
describe("h02/c1 guard (U3a)", () => {
	it("guard fixtures are schema-valid (fail on missing guard checks only)", () => {
		for (const f of GUARD_FIXTURES)
			expect(validateLedgerYaml(readFixture(f)).valid, f).toBe(true);
	});
	it("C1 recorded executable while H02 is review-pending fails closed (criterion 4)", () => {
		const r = resolveLedger(readFixture(GUARD_FIXTURES[0]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("h02/c1 guard");
		expect(r.errors.join(" ")).toContain(
			"C1 executable while H02 review-pending",
		);
	});
	it("a C1-dependent child recorded executable while H02 is review-pending fails closed (criterion 4)", () => {
		const r = resolveLedger(readFixture(GUARD_FIXTURES[1]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("h02/c1 guard");
		expect(r.errors.join(" ")).toContain(
			"C2 executable while H02 review-pending",
		);
	});
	it("H02 approval alone is insufficient: C1 executable without forecast/gates fails closed (criterion 5)", () => {
		const r = resolveLedger(readFixture(GUARD_FIXTURES[2]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("h02/c1 guard");
		expect(r.errors.join(" ")).toContain(
			"without exact-unit forecast and pre-apply gates",
		);
	});
	it("exact-unit forecast plus pre-apply gate evidence allows C1 executable after H02 advances", () => {
		const r = resolveLedger(readFixture(GUARD_FIXTURES[3]));
		expect(r.valid).toBe(true);
		expect(r.errors.join(" ")).not.toContain("h02/c1 guard");
		expect(r.children.C1).toEqual({ state: "executable", blockers: [] });
	});
	it("unit-level: bare C1 executable claims are rejected in both guard branches", () => {
		const pending = h02C1GuardErrors({
			children: {
				C1: { observed_status: "review-pending", program_state: "executable" },
			},
		});
		expect(pending.join(" ")).toContain(
			"C1 executable while H02 review-pending",
		);
		const advanced = h02C1GuardErrors({
			children: {
				C1: { observed_status: "verified", program_state: "executable" },
			},
			evidence: {},
		});
		expect(advanced.join(" ")).toContain(
			"without exact-unit forecast and pre-apply gates",
		);
	});
	it("is deterministic and the bootstrap ledger stays clean", () => {
		for (const f of GUARD_FIXTURES)
			expect(resolveLedger(readFixture(f))).toEqual(
				resolveLedger(readFixture(f)),
			);
		const data = parseDocument(readLedger()).toJS() as {
			children?: Record<string, unknown>;
		};
		expect(h02C1GuardErrors(data)).toEqual([]);
		expect(resolveLedger(readLedger()).errors).toEqual([]);
	});
});
