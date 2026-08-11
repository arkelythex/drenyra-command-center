/** U3b RED/GREEN — line policy + exceptions (criteria 10-11). RED: absent line-policy module; GREEN: 300
 * passes; 301-400 blocked despite the 400 config convention; >400 blocked by both policies; exceptions fail
 * closed on missing fields, no approval, expiry, scope change, blanket, or cross-repository; waive the size
 * gate only. Forecast/ceiling counts are whole integers only — no monetary floats. */
import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";
import { exceptionScopeDigest, linePolicyErrors } from "./line-policy.js";
import { resolveLedger } from "./resolver.js";
import { validateLedgerYaml } from "./schema-validator.js";
import { readFixture, readLedger } from "./test-utils.js";

const BP = [
	"line-policy-300-passes.yaml",
	"line-policy-301-no-exception.yaml",
	"line-policy-301-400-blocked.yaml",
];
const CHILD = {
	owner: "drenyra",
	change_id: "c1",
	state_path: "openspec/changes/c1/state.yaml",
	units: ["W0"],
	acceptance_refs: ["a1"],
	dependencies: [],
};
const EXC = {
	child: "C1",
	unit: "W0",
	scope_digest: "",
	proposed_ceiling: 400,
	rationale: "r",
	alternatives: "a",
	reviewer_impact_mitigation: "m",
	rollback_boundary: "rb",
	requester: "q",
	approval: {
		approved: true,
		approver: "drenyra-program-owner",
		approved_at: "2026-08-09T01:00:00Z",
	},
	ledger_revision: 1,
	expires_at: "2026-12-31T00:00:00Z",
};
function lineData(exc: Record<string, unknown>, lines: number) {
	return {
		policy: {
			program_owner: "drenyra-program-owner",
			effective_unit_limit: 300,
			config_default_unit_limit: 400,
		},
		repositories: {
			drenyra: { authority_kind: "umbrella-owner" },
			"drenyra-pi": { authority_kind: "sibling" },
		},
		children: { C1: CHILD, C5: { ...CHILD, owner: "drenyra-pi" } },
		evidence: {
			e1: {
				kind: "forecast",
				child: "C1",
				unit: "W0",
				revision: "r1",
				result: "passed",
				check_result: `forecast: ${lines} changed lines`,
			},
		},
		exceptions: {
			"x-1": {
				...exc,
				scope_digest: exc.scope_digest || exceptionScopeDigest(CHILD),
			},
		},
		events: [{ timestamp: "2026-08-09T00:00:00Z" }],
	};
}
describe("line policy (U3b)", () => {
	it("boundary fixtures are schema-valid (fail on missing line-policy checks only)", () => {
		for (const f of BP)
			expect(validateLedgerYaml(readFixture(f)).valid, f).toBe(true);
	});
	it("300-line forecast passes the size gate (criterion 10)", () => {
		const r = resolveLedger(readFixture(BP[0]));
		expect(r.valid).toBe(true);
		expect(r.errors.join(" ")).not.toContain("line policy");
	});
	it("301 fails without exception; 301-400 stays blocked despite the 400 convention (criterion 10)", () => {
		for (const f of [BP[1], BP[2]]) {
			const r = resolveLedger(readFixture(f));
			expect(r.valid).toBe(false);
			expect(r.errors.join(" ")).toContain("line policy");
			expect(r.errors.join(" ")).toContain("without a valid exception");
		}
	});
	it("exception matrix: full exception waives only the size gate; every defect fails closed (criterion 11)", () => {
		expect(linePolicyErrors(lineData(EXC, 350))).toEqual([]);
		expect(
			linePolicyErrors(
				lineData({ ...EXC, reviewer_impact_mitigation: "" }, 350),
			).join(" "),
		).toContain("missing required fields");
		expect(
			linePolicyErrors(
				lineData(
					{
						...EXC,
						approval: {
							approved: false,
							approver: "drenyra-program-owner",
							approved_at: "2026-08-09T01:00:00Z",
						},
					},
					350,
				),
			).join(" "),
		).toContain("not approved");
		expect(
			linePolicyErrors(
				lineData({ ...EXC, expires_at: "2020-01-01T00:00:00Z" }, 350),
			).join(" "),
		).toContain("expired");
		expect(
			linePolicyErrors(
				lineData({ ...EXC, scope_digest: "deadbeef" }, 350),
			).join(" "),
		).toContain("scope changed");
		expect(
			linePolicyErrors(lineData({ ...EXC, unit: "*" }, 350)).join(" "),
		).toContain("blanket exception");
		expect(
			linePolicyErrors(lineData({ ...EXC, child: "C5" }, 350)).join(" "),
		).toContain("cross-repository exception");
		expect(linePolicyErrors(lineData(EXC, 450)).join(" ")).toContain(
			"exceeds both",
		);
	});
	it("is deterministic and the bootstrap ledger stays clean", () => {
		for (const f of BP)
			expect(resolveLedger(readFixture(f))).toEqual(
				resolveLedger(readFixture(f)),
			);
		const data = parseDocument(readLedger()).toJS() as Parameters<
			typeof linePolicyErrors
		>[0];
		expect(linePolicyErrors(data)).toEqual([]);
		expect(resolveLedger(readLedger()).errors).toEqual([]);
	});
});
