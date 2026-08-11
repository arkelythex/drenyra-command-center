/** U4.3 TRIANGULATE — operational readback + status output (criteria 2, 3, readiness scope). RED: absent
 * scripts/readback module. GREEN: readback derives capability-scoped program status from the ledger (never
 * ecosystem-ready before C1–C6 close and C7 not-required/closed), emits per-child derived state + next safe
 * action, enforces monotonic ledger_revision / rejects stale concurrent writes (criterion 2), and fails closed
 * on unsupported status claims (recorded ecosystem_ready true while derived false; children_derived mismatch;
 * program_status.revision mismatch). Markdown/status is derived; the ledger is the only mutable program state.
 * Whole integers only — no monetary floats. */
import { describe, expect, it } from "vitest";
import { readbackStatus } from "../scripts/readback.js";
import { resolveLedger } from "./resolver.js";
import { readLedger } from "./test-utils.js";

const BOOTSTRAP = readLedger();
describe("operational readback (U4.3)", () => {
	it("bootstrap ledger: valid capability-scoped report matching resolver-derived states", () => {
		const report = readbackStatus(BOOTSTRAP);
		expect(report.valid).toBe(true);
		expect(report.errors).toEqual([]);
		expect(report.revision).toBe(1);
		expect(report.ecosystem_ready).toBe(false);
		expect(report.readiness_scope).toContain("capability-scoped");
		expect(report.next_safe_action).toContain("H02");
		expect(report.children.C1).toEqual({
			state: "blocked",
			blockers: ["H02_REVIEW_PENDING"],
		});
		expect(report.children.C7).toEqual({ state: "not-required", blockers: [] });
	});
	it("readback children are exactly the resolver-derived children", () => {
		const resolved = resolveLedger(BOOTSTRAP);
		expect(readbackStatus(BOOTSTRAP).children).toEqual(resolved.children);
	});
	it("stale concurrent write is rejected: event revision above ledger_revision fails closed (criterion 2)", () => {
		const stale = BOOTSTRAP.replace(
			"kind: program-initialized\n    revision: 1",
			"kind: program-initialized\n    revision: 2",
		);
		const report = readbackStatus(stale);
		expect(report.valid).toBe(false);
		expect(report.errors.join(" ")).toContain("stale concurrent write");
	});
	it("program_status.revision mismatch with ledger_revision fails closed", () => {
		const stale = BOOTSTRAP.replace(
			"program_status:\n  revision: 1",
			"program_status:\n  revision: 2",
		);
		const report = readbackStatus(stale);
		expect(report.valid).toBe(false);
		expect(report.errors.join(" ")).toContain(
			"program_status.revision: stale concurrent write (revision 2 does not match ledger_revision 1)",
		);
	});
	it("unsupported ecosystem-ready claim fails closed while C1–C6 are not closed", () => {
		const claiming = BOOTSTRAP.replace(
			"ecosystem_ready: false",
			"ecosystem_ready: true",
		);
		const report = readbackStatus(claiming);
		expect(report.valid).toBe(false);
		expect(report.errors.join(" ")).toContain(
			"unsupported ecosystem-ready claim",
		);
	});
	it("children_derived mismatch with resolver output fails closed", () => {
		const mismatched = BOOTSTRAP.replace("C1: blocked", "C1: eligible");
		const report = readbackStatus(mismatched);
		expect(report.valid).toBe(false);
		expect(report.errors.join(" ")).toContain(
			"children_derived mismatch (recorded C1=eligible, derived blocked)",
		);
	});
	it("is deterministic: identical input yields identical readback reports", () => {
		expect(readbackStatus(BOOTSTRAP)).toEqual(readbackStatus(BOOTSTRAP));
	});
});
