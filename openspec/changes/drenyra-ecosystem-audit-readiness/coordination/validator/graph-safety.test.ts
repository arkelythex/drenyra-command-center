/** U2b RED/GREEN — graph safety (criterion 7). RED: absent graph-safety module; GREEN: alternate C1 authority, duplicate tenant-isolation authority, and C1 bypass rejected program-wide; the cycle case is served by U2a.2's topological ordering (recorded per-case). */
import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";
import { graphSafetyErrors } from "./graph-safety.js";
import { resolveLedger } from "./resolver.js";
import { validateLedgerYaml } from "./schema-validator.js";
import { readFixture, readLedger } from "./test-utils.js";

const GRAPH_FIXTURES = [
	"graph-cycle.yaml",
	"graph-C1-bypass.yaml",
	"graph-alternate-C1.yaml",
	"graph-duplicate-tenant.yaml",
];
describe("graph safety (U2b)", () => {
	it("graph-safety fixtures are schema-valid (fail on missing graph-safety checks only)", () => {
		for (const f of GRAPH_FIXTURES)
			expect(validateLedgerYaml(readFixture(f)).valid, f).toBe(true);
	});
	it("cycle: cyclic recorded dependencies are rejected by the resolver's topological ordering", () => {
		const r = resolveLedger(readFixture(GRAPH_FIXTURES[0]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("dependency cycle detected");
	});
	it("C1 bypass: C2 dropping C1 from recorded dependencies is rejected program-wide", () => {
		const r = resolveLedger(readFixture(GRAPH_FIXTURES[1]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("C1 bypass");
		expect(r.errors.join(" ")).toContain("C2 missing dependency C1");
	});
	it("alternate C1 authority: a C1 change_id other than drenyra-h02-tenant-isolation is rejected", () => {
		const r = resolveLedger(readFixture(GRAPH_FIXTURES[2]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("alternate C1 authority");
	});
	it("duplicate tenant-isolation authority: a non-C1 child claiming H02 blocks the program", () => {
		const r = resolveLedger(readFixture(GRAPH_FIXTURES[3]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain(
			"duplicate tenant-isolation authority",
		);
		expect(r.errors.join(" ")).toContain("(C6)");
	});
	it("graph safety is deterministic and the bootstrap ledger stays clean", () => {
		for (const f of GRAPH_FIXTURES)
			expect(resolveLedger(readFixture(f))).toEqual(
				resolveLedger(readFixture(f)),
			);
		const data = parseDocument(readLedger()).toJS() as {
			children?: Record<string, unknown>;
		};
		expect(graphSafetyErrors(data)).toEqual([]);
		expect(resolveLedger(readLedger()).errors).toEqual([]);
	});
});
