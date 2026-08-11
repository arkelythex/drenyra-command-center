/** U3d RED/GREEN — evidence and research contracts (criteria 12, 14). RED: absent evidence-contract module.
 * GREEN: bare green/ready/compatible labels, mutable revisions, contradictory proof (same child/unit/kind with
 * passed AND failed/blocked), cross-repository units (owner mismatch, authority path outside the owning
 * repository), and passed claims with failed test counts advance ZERO gates; research without a primary source
 * is unresolved risk, never a factual claim (confirmed/changed require primary_source_url + affected_requirement);
 * unresolved research never advances a gate. Whole integers only — no monetary floats. */
import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";
import { evidenceContractErrors } from "./evidence-contract.js";
import { resolveLedger } from "./resolver.js";
import { validateLedgerYaml } from "./schema-validator.js";
import { readFixture, readLedger } from "./test-utils.js";

const FIXTURES = [
	"evidence-bare-label.yaml",
	"evidence-mutable-revision.yaml",
	"evidence-contradictory.yaml",
	"research-no-primary-source.yaml",
];
const MUTABLE = ["unlinked", "pending", "mutable", "latest", "head", ""];
function contractData(
	evidence: Record<string, unknown>,
	research: Record<string, unknown> = {},
) {
	return {
		children: {
			C5: {
				owner: "drenyra-pi",
				authority_mode: "external-reference",
				change_id: "pending",
				state_path: "openspec/changes/pending/state.yaml",
				revision: "r-c5",
				observed_phase: "planning",
				observed_status: "planned",
				program_state: "planning",
				blockers: [],
				mandatory: true,
				conditional: false,
			},
		},
		repositories: {
			"drenyra-pi": {
				identity: "drenyra-pi",
				authority_kind: "sibling",
				allowed_child_prefix: "openspec/changes/",
			},
		},
		evidence,
		research,
	};
}
function evidenceEntry(overrides: Record<string, unknown>) {
	return {
		kind: "verification",
		child: "C5",
		owner: "drenyra-pi",
		authority_path: "openspec/changes/pending/state.yaml",
		revision: "r-c5",
		result: "passed",
		timestamp: "2026-08-09T02:00:00Z",
		check_result: "unit W0 checks passed",
		...overrides,
	};
}
describe("evidence + research contracts (U3d)", () => {
	it("evidence/research fixtures are schema-valid (fail on missing evidence-contract checks only)", () => {
		for (const f of FIXTURES)
			expect(validateLedgerYaml(readFixture(f)).valid, f).toBe(true);
	});
	it("bare green label advances zero gates: bare-label fixture rejected (criterion 12)", () => {
		const r = resolveLedger(readFixture(FIXTURES[0]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("evidence contract");
		expect(r.errors.join(" ")).toContain('bare "green" label');
	});
	it("mutable revision advances zero gates: mutable-revision fixture rejected (criterion 12)", () => {
		const r = resolveLedger(readFixture(FIXTURES[1]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("evidence contract");
		expect(r.errors.join(" ")).toContain('mutable revision "latest"');
	});
	it("contradictory proof advances zero gates: contradictory fixture rejected (criterion 12)", () => {
		const r = resolveLedger(readFixture(FIXTURES[2]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("evidence contract");
		expect(r.errors.join(" ")).toContain("contradictory proof");
	});
	it("research without a primary source is unresolved risk, not fact; unresolved risk never advances (criterion 14)", () => {
		const r = resolveLedger(readFixture(FIXTURES[3]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("no primary source");
		expect(r.errors).toEqual([
			"resolver: evidence contract: research r-browsed-fact: no primary source for a confirmed claim — unresolved risk, never a factual claim",
		]);
		expect(
			evidenceContractErrors(
				contractData(
					{},
					{
						"r-unresolved": {
							child: "C5",
							uncertainty: "consumer migration window",
							relevance_confirmed: true,
							publisher: "none",
							retrieved_at: "2026-08-09T02:00:00Z",
							decision_effect: "unresolved",
						},
					},
				),
			),
		).toEqual([]);
	});
	it("unit matrix: labels, mutable revisions, cross-repository units, contradictory pairs, test counts, and research effects fail closed", () => {
		for (const label of ["green", "ready", "compatible"])
			expect(
				evidenceContractErrors(
					contractData({ "evt-x": evidenceEntry({ check_result: label }) }),
				).join(" "),
			).toContain(`bare "${label}" label`);
		for (const rev of MUTABLE)
			expect(
				evidenceContractErrors(
					contractData({ "evt-x": evidenceEntry({ revision: rev }) }),
				).join(" "),
			).toContain("mutable revision");
		expect(
			evidenceContractErrors(
				contractData({ "evt-x": evidenceEntry({ owner: "drenyra" }) }),
			).join(" "),
		).toContain("cross-repository unit");
		expect(
			evidenceContractErrors(
				contractData({
					"evt-x": evidenceEntry({
						authority_path: "worktrees/c5/state.yaml",
					}),
				}),
			).join(" "),
		).toContain("authority path outside owning repository");
		expect(
			evidenceContractErrors(
				contractData({ "evt-x": evidenceEntry({ child: "C9" }) }),
			).join(" "),
		).toContain("unknown child");
		expect(
			evidenceContractErrors(
				contractData({
					"evt-x": evidenceEntry({
						check_result: "unit W0 checks passed",
						test_counts: { passed: 1, failed: 1, total: 2 },
					}),
				}),
			).join(" "),
		).toContain("passed claim with failed test counts");
		expect(
			evidenceContractErrors(
				contractData(
					{},
					{
						"r-confirmed": {
							child: "C5",
							uncertainty: "baseline pin",
							relevance_confirmed: true,
							publisher: "publisher",
							retrieved_at: "2026-08-09T02:00:00Z",
							decision_effect: "changed",
						},
					},
				),
			).join(" "),
		).toContain("no primary source");
		expect(
			evidenceContractErrors(
				contractData(
					{},
					{
						"r-fact": {
							child: "C5",
							uncertainty: "baseline pin",
							relevance_confirmed: true,
							primary_source_url: "https://example.gov/doc",
							publisher: "publisher",
							retrieved_at: "2026-08-09T02:00:00Z",
							decision_effect: "confirmed",
						},
					},
				),
			).join(" "),
		).toContain("without an affected requirement");
		expect(
			evidenceContractErrors(
				contractData(
					{},
					{
						"r-good": {
							child: "C5",
							uncertainty: "baseline pin",
							relevance_confirmed: true,
							primary_source_url: "https://example.gov/doc",
							publisher: "publisher",
							retrieved_at: "2026-08-09T02:00:00Z",
							affected_requirement: "C5 baseline pin conformance",
							decision_effect: "confirmed",
						},
					},
				),
			),
		).toEqual([]);
	});
	it("is deterministic and the bootstrap ledger stays clean", () => {
		for (const f of FIXTURES)
			expect(resolveLedger(readFixture(f))).toEqual(
				resolveLedger(readFixture(f)),
			);
		const data = parseDocument(readLedger()).toJS() as Parameters<
			typeof evidenceContractErrors
		>[0];
		expect(evidenceContractErrors(data)).toEqual([]);
		expect(resolveLedger(readLedger()).errors).toEqual([]);
	});
});
