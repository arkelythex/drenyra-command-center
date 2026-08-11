/** U3f RED/GREEN — read-only compatibility import adapter (design "Migration and compatibility"). RED: absent
 * compatibility-import module. GREEN: legacy-import-marked import events map observed legacy state to program
 * interpretation exactly per the design table (no state.yaml → planning/non-executable; review-pending → blocked;
 * implementation-blocked → blocked; planning → planning; apply-permitting → eligible; implemented/verified/completed
 * → observed progress requiring closure proof; archived with acceptance proof → eligible for closure evaluation;
 * unknown → blocked until mapped). H02 is imported by reference preserving review-pending (existing
 * drenyra-h02-tenant-isolation, blocked/H02_REVIEW_PENDING); bootstrap imports are marked legacy-import; existing
 * child artifacts are never rewritten (read-only adapter — importing H02 never mutates
 * drenyra-h02-tenant-isolation/*); unknown source schema versions fail closed unless a migration event records
 * validation=passed; sibling OpenSpec/hybrid differences are normalized only at the umbrella evidence metadata
 * boundary. Whole integers only — no monetary floats. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";
import { compatibilityImportErrors } from "./compatibility-import.js";
import { resolveLedger } from "./resolver.js";
import { validateLedgerYaml } from "./schema-validator.js";
import { readFixture, readLedger } from "./test-utils.js";
import { EXECUTABLE_FAMILY } from "./validation-utils.js";

const FIXTURES_DIR = fileURLToPath(new URL("../fixtures/", import.meta.url));
const FIXTURES = [
	"import-no-state.yaml",
	"import-blocked-states.yaml",
	"import-applied-progress.yaml",
	"import-archived.yaml",
	"import-h02-reference.yaml",
	"import-unknown-blocked.yaml",
	"import-unknown-version.yaml",
	"import-mapping-mismatch.yaml",
	"import-unmarked.yaml",
];
const IMPORT_REASON =
	"legacy-import: observed=review-pending; interpretation=blocked; source-version=1.0.0; source=openspec/changes/drenyra-c2-legacy/state.yaml";
const MIGRATION_REASON =
	"migration: source=0.9.0; target=1.0.0; tool=umbrella-import-v1; before=0000000000000000000000000000000000000000; after=0000000000000000000000000000000000000000; validation=passed";
function contractData(
	children: Record<string, unknown>,
	events: unknown[],
	evidence: Record<string, unknown> = {},
) {
	return {
		children,
		repositories: {
			"drenyra-pi": {
				identity: "drenyra-pi",
				authority_kind: "sibling",
				allowed_child_prefix: "openspec/changes/",
			},
			drenyra: {
				identity: "drenyra",
				authority_kind: "umbrella-owner",
				allowed_child_prefix: "openspec/changes/",
			},
		},
		evidence,
		events,
	};
}
function c2Child(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		owner: "drenyra",
		authority_mode: "external-reference",
		change_id: "drenyra-c2-legacy",
		state_path: "openspec/changes/drenyra-c2-legacy/state.yaml",
		revision: "r-c2-5d44",
		observed_phase: "tasks",
		observed_status: "review-pending",
		program_state: "blocked",
		blockers: ["LIFECYCLE_NOT_EXECUTABLE"],
		mandatory: true,
		conditional: false,
		dependencies: ["C1"],
		...overrides,
	};
}
function c5Child(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		owner: "drenyra-pi",
		authority_mode: "external-reference",
		change_id: "drenyra-pi-c5-archived",
		state_path: "openspec/changes/drenyra-pi-c5-archived/state.yaml",
		revision: "r-c5-archived-7b21",
		observed_phase: "archived",
		observed_status: "archived",
		program_state: "eligible",
		blockers: [],
		mandatory: true,
		conditional: false,
		...overrides,
	};
}
function c1Child(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		owner: "drenyra",
		authority_mode: "existing",
		change_id: "drenyra-h02-tenant-isolation",
		state_path: "openspec/changes/drenyra-h02-tenant-isolation/state.yaml",
		revision: "93bc8e1ae081d9ca567f75eeb00f5b91e01ad9e4",
		observed_phase: "tasks",
		observed_status: "review-pending",
		program_state: "blocked",
		blockers: ["H02_REVIEW_PENDING"],
		mandatory: true,
		conditional: false,
		...overrides,
	};
}
function importEvent(
	child: string,
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		id: `evt-i-${child.toLowerCase()}`,
		kind: "import",
		child,
		revision: 2,
		timestamp: "2026-08-09T04:00:00Z",
		prior_state: "imported",
		new_state: "imported",
		evidence_refs: [],
		reason: IMPORT_REASON,
		...overrides,
	};
}
function migrationEvent(
	child: string,
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		id: `evt-m-${child.toLowerCase()}`,
		kind: "migration",
		child,
		revision: 3,
		timestamp: "2026-08-09T04:05:00Z",
		prior_state: "imported",
		new_state: "imported",
		evidence_refs: [],
		reason: MIGRATION_REASON,
		...overrides,
	};
}
function importData(
	fixture: string,
): Parameters<typeof compatibilityImportErrors>[0] {
	return parseDocument(readFixture(fixture)).toJS() as Parameters<
		typeof compatibilityImportErrors
	>[0];
}
function childProgramState(
	data: Parameters<typeof compatibilityImportErrors>[0],
	childId: string,
): string {
	const child = data.children?.[childId];
	return typeof child === "object" &&
		child !== null &&
		"program_state" in child &&
		typeof (child as { program_state?: unknown }).program_state === "string"
		? ((child as { program_state: string }).program_state as string)
		: "";
}
describe("read-only compatibility import adapter (U3f)", () => {
	it("import fixtures are schema-valid (fail on missing compatibility-import checks only)", () => {
		for (const f of FIXTURES)
			expect(validateLedgerYaml(readFixture(f)).valid, f).toBe(true);
	});
	it("no state.yaml maps to planning/non-executable — no-state fixture accepted, never executable", () => {
		const data = importData(FIXTURES[0]);
		expect(compatibilityImportErrors(data)).toEqual([]);
		const r = resolveLedger(readFixture(FIXTURES[0]));
		expect(r.valid).toBe(true);
		expect(EXECUTABLE_FAMILY).not.toContain(r.children.C2.state);
		expect(childProgramState(data, "C2")).toBe("planning");
	});
	it("review-pending and implementation-blocked map to blocked — blocked-states fixture derives blocked", () => {
		const data = importData(FIXTURES[1]);
		expect(compatibilityImportErrors(data)).toEqual([]);
		const r = resolveLedger(readFixture(FIXTURES[1]));
		expect(r.valid).toBe(true);
		expect(r.children.C2.state).toBe("blocked");
		expect(r.children.C2.blockers).toContain("LIFECYCLE_NOT_EXECUTABLE");
		expect(r.children.C3.state).toBe("blocked");
		expect(r.children.C3.blockers).toContain("LIFECYCLE_NOT_EXECUTABLE");
	});
	it("applied state maps to observed progress requiring closure proof — never closed", () => {
		const data = importData(FIXTURES[2]);
		expect(compatibilityImportErrors(data)).toEqual([]);
		const r = resolveLedger(readFixture(FIXTURES[2]));
		expect(r.valid).toBe(true);
		expect(EXECUTABLE_FAMILY).not.toContain(r.children.C4.state);
		expect(childProgramState(data, "C4")).toBe("eligible");
	});
	it("archived with acceptance proof maps to eligible for closure evaluation — sibling derived exactly", () => {
		const data = importData(FIXTURES[3]);
		expect(compatibilityImportErrors(data)).toEqual([]);
		const r = resolveLedger(readFixture(FIXTURES[3]));
		expect(r.valid).toBe(true);
		expect(r.children.C5.state).toBe("eligible");
		expect(r.children.C5.blockers).toEqual([]);
	});
	it("H02 is imported by reference preserving review-pending — C1 stays blocked/H02_REVIEW_PENDING", () => {
		const data = importData(FIXTURES[4]);
		expect(compatibilityImportErrors(data)).toEqual([]);
		const r = resolveLedger(readFixture(FIXTURES[4]));
		expect(r.valid).toBe(true);
		expect(r.children.C1.state).toBe("blocked");
		expect(r.children.C1.blockers).toEqual(["H02_REVIEW_PENDING"]);
	});
	it("unknown legacy state maps to blocked until mapped — unknown fixture derives blocked", () => {
		const data = importData(FIXTURES[5]);
		expect(compatibilityImportErrors(data)).toEqual([]);
		const r = resolveLedger(readFixture(FIXTURES[5]));
		expect(r.valid).toBe(true);
		expect(r.children.C6.state).toBe("blocked");
	});
	it("unknown source schema version fails closed — migration-path fixture rejected with the exact typed error", () => {
		const r = resolveLedger(readFixture(FIXTURES[6]));
		expect(r.valid).toBe(false);
		expect(r.errors).toEqual([
			"resolver: compatibility import: C2 unknown schema version 0.9.0 fails closed — migration event with validation=passed required",
		]);
	});
	it("design-table mapping mismatch fails closed — mismatch fixture rejected with the exact typed error", () => {
		const r = resolveLedger(readFixture(FIXTURES[7]));
		expect(r.valid).toBe(false);
		expect(r.errors).toEqual([
			"resolver: compatibility import: C2 observed review-pending maps to blocked, but import records interpretation=eligible and program_state eligible",
		]);
	});
	it("unmarked import event fails closed — unmarked fixture rejected with the exact typed error", () => {
		const r = resolveLedger(readFixture(FIXTURES[8]));
		expect(r.valid).toBe(false);
		expect(r.errors).toEqual([
			"resolver: compatibility import: C2 import event not marked legacy-import (bootstrap imports require the marker)",
		]);
	});
	it("unit matrix: design-table rows, H02 binding, migration path, metadata boundary, and observed/status consistency fail closed", () => {
		expect(
			compatibilityImportErrors(
				contractData(
					{
						C5: c5Child({
							observed_status: "planning",
							program_state: "planning",
						}),
					},
					[
						importEvent("C5", {
							reason: IMPORT_REASON.replace(
								"observed=review-pending; interpretation=blocked",
								"observed=planning; interpretation=planning",
							).replace("drenyra-c2-legacy", "drenyra-pi-c5-planning"),
						}),
					],
				),
			),
		).toEqual([]);
		expect(
			compatibilityImportErrors(
				contractData(
					{
						C5: c5Child({
							observed_status: "apply-permitting",
							program_state: "eligible",
						}),
					},
					[
						importEvent("C5", {
							reason: IMPORT_REASON.replace(
								"observed=review-pending; interpretation=blocked",
								"observed=apply-permitting; interpretation=eligible",
							),
						}),
					],
				),
			),
		).toEqual([]);
		expect(
			compatibilityImportErrors(
				contractData({ C5: c5Child({ observed_status: "archived" }) }, [
					importEvent("C5", {
						reason: IMPORT_REASON.replace(
							"observed=review-pending; interpretation=blocked",
							"observed=archived; interpretation=eligible",
						),
					}),
				]),
			).join(" "),
		).toContain("archived legacy import requires acceptance proof");
		expect(
			compatibilityImportErrors(
				contractData({ C2: c2Child() }, [
					importEvent("C2", {
						reason: IMPORT_REASON.replace(
							"source-version=1.0.0",
							"source-version=0.9.0",
						),
					}),
					migrationEvent("C2"),
				]),
			),
		).toEqual([]);
	});
	it("migration and boundary defects fail closed with the exact typed errors", () => {
		expect(
			compatibilityImportErrors(
				contractData({ C2: c2Child() }, [
					importEvent("C2"),
					migrationEvent("C2", { reason: "migration: validation=passed" }),
				]),
			),
		).toEqual([
			"resolver: compatibility import: migration event evt-m-c2 incomplete — missing source, target, tool, before, after",
		]);
		expect(
			compatibilityImportErrors(
				contractData({ C5: c5Child() }, [
					importEvent("C5", {
						reason: IMPORT_REASON.replace(
							"observed=review-pending; interpretation=blocked",
							"observed=archived; interpretation=eligible; acceptance=proof",
						),
						evidence_refs: ["evt-outside"],
					}),
				]),
			),
		).toEqual([
			"resolver: compatibility import: C5 evidence reference evt-outside outside the umbrella evidence metadata boundary",
		]);
	});
	it("observed/status mismatch, unknown claimed eligible, and H02 binding defects fail closed with the exact typed errors", () => {
		expect(
			compatibilityImportErrors(
				contractData(
					{
						C2: c2Child({
							observed_status: "completed",
							program_state: "eligible",
						}),
					},
					[importEvent("C2", { reason: IMPORT_REASON })],
				),
			),
		).toEqual([
			"resolver: compatibility import: C2 import observed review-pending does not match child observed_status completed",
			"resolver: compatibility import: C2 observed review-pending maps to blocked, but program_state is eligible",
		]);
		expect(
			compatibilityImportErrors(
				contractData(
					{
						C2: c2Child({
							observed_status: "unknown-legacy",
							program_state: "eligible",
							blockers: [],
						}),
					},
					[
						importEvent("C2", {
							reason: IMPORT_REASON.replace(
								"observed=review-pending; interpretation=blocked",
								"observed=unknown-legacy; interpretation=eligible",
							),
						}),
					],
				),
			),
		).toEqual([
			"resolver: compatibility import: C2 observed unknown-legacy maps to blocked, but import records interpretation=eligible and program_state eligible",
		]);
		expect(
			compatibilityImportErrors(
				contractData({ C1: c1Child({ authority_mode: "new-local" }) }, [
					importEvent("C1"),
				]),
			),
		).toEqual([
			"resolver: compatibility import: H02 must be imported by reference as existing drenyra-h02-tenant-isolation preserving blocked/H02_REVIEW_PENDING",
		]);
		expect(
			compatibilityImportErrors(
				contractData(
					{
						C1: c1Child({
							observed_status: "archived",
							program_state: "eligible",
							blockers: [],
						}),
					},
					[
						importEvent("C1", {
							reason: IMPORT_REASON.replace(
								"observed=review-pending; interpretation=blocked",
								"observed=archived; interpretation=eligible",
							).replace("drenyra-c2-legacy", "drenyra-h02-tenant-isolation"),
						}),
					],
				),
			),
		).toEqual([
			"resolver: compatibility import: C1 archived legacy import requires acceptance proof (acceptance=proof) before closure evaluation",
			"resolver: compatibility import: C1 H02 import must preserve review-pending (observed archived)",
		]);
	});
	it("is read-only (never rewrites child artifacts or fixtures), deterministic, and the bootstrap ledger stays clean", () => {
		const before = new Map(
			FIXTURES.map((f) => [f, readFileSync(`${FIXTURES_DIR}${f}`, "utf8")]),
		);
		for (const f of FIXTURES) {
			const data = importData(f);
			expect(compatibilityImportErrors(data)).toEqual(
				compatibilityImportErrors(data),
			);
			expect(resolveLedger(readFixture(f))).toEqual(
				resolveLedger(readFixture(f)),
			);
		}
		for (const [f, bytes] of before)
			expect(readFileSync(`${FIXTURES_DIR}${f}`, "utf8"), f).toBe(bytes);
		const bootstrap = parseDocument(readLedger()).toJS() as Parameters<
			typeof compatibilityImportErrors
		>[0];
		expect(compatibilityImportErrors(bootstrap)).toEqual([]);
		expect(resolveLedger(readLedger()).errors).toEqual([]);
	});
});
