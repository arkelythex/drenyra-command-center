/** U3e RED/GREEN — two-party child-handoff protocol (design "Safe umbrella-to-child handoff"). RED: absent
 * handoff-protocol module. GREEN: the umbrella appends a child-handoff-requested event with the full payload
 * (child ID, owner, baseline defect, scope/non-goals, dependencies, executability, acceptance/evidence
 * contracts, 300-line policy, suggested change ID, collision requirement, expiry) and never claims the child
 * exists or can apply; H02 always takes the resume path; owners return repository-relative references at
 * immutable revisions; accepted handoffs are at most planning, declined handoffs stay blocked, incomplete
 * children stay planning, ID collisions return to the owner, unverifiable authority blocks, and no local
 * surrogate child is created for sibling owners. Whole integers only — no monetary floats. */
import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";
import { handoffProtocolErrors } from "./handoff-protocol.js";
import { resolveLedger } from "./resolver.js";
import { validateLedgerYaml } from "./schema-validator.js";
import { readFixture, readLedger } from "./test-utils.js";

const FIXTURES = [
	"handoff-accept.yaml",
	"handoff-resume.yaml",
	"handoff-decline.yaml",
	"handoff-incomplete.yaml",
	"handoff-collision.yaml",
	"handoff-unverifiable.yaml",
];
const PAYLOAD =
	"handoff: baseline-defect=tenant isolation baseline gap; scope=coordination-only; non-goals=product-source edits; dependencies=none; executability=blocked; acceptance=h02-acceptance-criteria; evidence-contract=immutable-repository-local; unit-limit=300; suggested-change-id=drenyra-c5-baseline; collision=required; expiry=2026-09-01T00:00:00Z";
function contractData(children: Record<string, unknown>, events: unknown[]) {
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
		events,
	};
}
function c5(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		owner: "drenyra-pi",
		authority_mode: "external-reference",
		change_id: "drenyra-c5-baseline",
		state_path: "openspec/changes/drenyra-c5-baseline/state.yaml",
		revision: "r-c5-9f2a",
		observed_phase: "planning",
		observed_status: "planned",
		program_state: "planning",
		blockers: [],
		mandatory: true,
		conditional: false,
		...overrides,
	};
}
function c1(overrides: Record<string, unknown> = {}): Record<string, unknown> {
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
function requestEvent(
	child: string,
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		id: `evt-h-${child.toLowerCase()}`,
		kind: "child-handoff-requested",
		child,
		revision: 2,
		timestamp: "2026-08-09T03:00:00Z",
		prior_state: "requested",
		new_state: "requested",
		evidence_refs: [],
		reason: PAYLOAD,
		...overrides,
	};
}
function decisionEvent(
	child: string,
	outcome: string,
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		id: `evt-d-${child.toLowerCase()}-${outcome}`,
		kind: "decision",
		child,
		revision: 3,
		timestamp: "2026-08-09T03:30:00Z",
		prior_state: "requested",
		new_state: "decided",
		evidence_refs: [],
		reason: `handoff: ${outcome}`,
		...overrides,
	};
}
function handoffData(
	fixture: string,
): Parameters<typeof handoffProtocolErrors>[0] {
	return parseDocument(readFixture(fixture)).toJS() as Parameters<
		typeof handoffProtocolErrors
	>[0];
}
describe("two-party child-handoff protocol (U3e)", () => {
	it("handoff fixtures are schema-valid (fail on missing handoff-protocol checks only)", () => {
		for (const f of FIXTURES)
			expect(validateLedgerYaml(readFixture(f)).valid, f).toBe(true);
	});
	it("accepted handoff is at most planning — accept fixture derives planning", () => {
		const r = resolveLedger(readFixture(FIXTURES[0]));
		expect(r.valid).toBe(true);
		expect(r.children.C5.state).toBe("planning");
		expect(handoffProtocolErrors(handoffData(FIXTURES[0]))).toEqual([]);
	});
	it("H02 always takes the resume path — resume fixture keeps C1 blocked/H02_REVIEW_PENDING", () => {
		const r = resolveLedger(readFixture(FIXTURES[1]));
		expect(r.valid).toBe(true);
		expect(r.children.C1.state).toBe("blocked");
		expect(r.children.C1.blockers).toEqual(["H02_REVIEW_PENDING"]);
		expect(handoffProtocolErrors(handoffData(FIXTURES[1]))).toEqual([]);
	});
	it("declined handoff stays blocked — decline fixture derives blocked/AUTHORITY_MISSING", () => {
		const r = resolveLedger(readFixture(FIXTURES[2]));
		expect(r.valid).toBe(true);
		expect(r.children.C5.state).toBe("blocked");
		expect(r.children.C5.blockers).toContain("AUTHORITY_MISSING");
	});
	it("incomplete child stays planning — incomplete fixture derives planning", () => {
		const r = resolveLedger(readFixture(FIXTURES[3]));
		expect(r.valid).toBe(true);
		expect(r.children.C5.state).toBe("planning");
	});
	it("ID collision returns to the owner — collision fixture rejected", () => {
		const r = resolveLedger(readFixture(FIXTURES[4]));
		expect(r.valid).toBe(false);
		expect(r.errors.join(" ")).toContain("handoff protocol");
		expect(r.errors.join(" ")).toContain("ID collision");
	});
	it("unverifiable authority blocks — unverifiable fixture rejected with the exact typed error", () => {
		const r = resolveLedger(readFixture(FIXTURES[5]));
		expect(r.valid).toBe(false);
		expect(r.errors).toEqual([
			'resolver: handoff protocol: unverifiable authority for C5 (mutable revision "latest") blocks',
		]);
	});
	it("unit matrix: payload, executability claim, unit limit, H02 resume, collisions, decision outcomes, sibling surrogate, and unverifiable paths fail closed", () => {
		expect(
			handoffProtocolErrors(
				contractData({ C5: c5() }, [
					requestEvent("C5", {
						reason: PAYLOAD.replace("collision=required; ", ""),
					}),
				]),
			).join(" "),
		).toContain("handoff request incomplete");
		expect(
			handoffProtocolErrors(
				contractData({ C5: c5() }, [
					requestEvent("C5", {
						reason: PAYLOAD.replace(
							"executability=blocked",
							"executability=executable",
						),
					}),
				]),
			).join(" "),
		).toContain("makes no claim the child exists or can apply");
		expect(
			handoffProtocolErrors(
				contractData({ C5: c5() }, [
					requestEvent("C5", {
						reason: PAYLOAD.replace("unit-limit=300", "unit-limit=400"),
					}),
				]),
			).join(" "),
		).toContain("300-line policy");
		expect(
			handoffProtocolErrors(
				contractData({ C1: c1() }, [
					requestEvent("C1", {
						reason: PAYLOAD.replace(
							"suggested-change-id=drenyra-c5-baseline",
							"suggested-change-id=drenyra-tenant-isolation-v2",
						),
					}),
				]),
			).join(" "),
		).toContain("resume path");
		expect(
			handoffProtocolErrors(
				contractData({ C5: c5(), C6: c5() }, [
					requestEvent("C5"),
					requestEvent("C6"),
				]),
			).join(" "),
		).toContain("ID collision between C5 and C6");
		expect(
			handoffProtocolErrors(
				contractData({ C5: c5({ program_state: "executable" }) }, [
					requestEvent("C5"),
					decisionEvent("C5", "accepted"),
				]),
			).join(" "),
		).toContain("accepted handoff C5 is at most planning");
		expect(
			handoffProtocolErrors(
				contractData({ C1: c1({ authority_mode: "new-local" }) }, [
					requestEvent("C1", {
						reason: PAYLOAD.replace(
							"suggested-change-id=drenyra-c5-baseline",
							"suggested-change-id=drenyra-h02-tenant-isolation",
						),
					}),
					decisionEvent("C1", "resumed"),
				]),
			).join(" "),
		).toContain("resume for C1 requires existing authority");
		expect(
			handoffProtocolErrors(
				contractData({ C5: c5({ program_state: "planning" }) }, [
					requestEvent("C5"),
					decisionEvent("C5", "declined"),
				]),
			).join(" "),
		).toContain("declined handoff C5 stays blocked");
		expect(
			handoffProtocolErrors(
				contractData({ C5: c5({ program_state: "executable" }) }, [
					requestEvent("C5"),
					decisionEvent("C5", "incomplete"),
				]),
			).join(" "),
		).toContain("incomplete child C5 stays planning");
		expect(
			handoffProtocolErrors(
				contractData({ C5: c5({ program_state: "eligible" }) }, [
					requestEvent("C5"),
					decisionEvent("C5", "collision"),
				]),
			).join(" "),
		).toContain("ID collision C5 returns to the owner");
		expect(
			handoffProtocolErrors(
				contractData({ C5: c5({ authority_mode: "new-local" }) }, [
					requestEvent("C5"),
				]),
			).join(" "),
		).toContain("no local surrogate child created for sibling owner");
		expect(
			handoffProtocolErrors(
				contractData({ C5: c5({ state_path: "worktrees/c5/state.yaml" }) }, [
					requestEvent("C5"),
				]),
			).join(" "),
		).toContain("authority path outside");
		expect(
			handoffProtocolErrors(
				contractData(
					{
						C5: c5({
							revision: "latest",
							program_state: "blocked",
							blockers: ["AUTHORITY_MISSING"],
						}),
					},
					[requestEvent("C5")],
				),
			),
		).toEqual([]);
		expect(
			handoffProtocolErrors(
				contractData(
					{
						C5: c5({
							program_state: "blocked",
							blockers: ["AUTHORITY_MISSING"],
						}),
					},
					[requestEvent("C5"), decisionEvent("C5", "collision")],
				),
			),
		).toEqual([]);
		expect(
			handoffProtocolErrors(
				contractData({ C1: c1() }, [
					requestEvent("C1", {
						reason: PAYLOAD.replace(
							"suggested-change-id=drenyra-c5-baseline",
							"suggested-change-id=drenyra-h02-tenant-isolation",
						),
					}),
					decisionEvent("C1", "resumed"),
				]),
			),
		).toEqual([]);
	});
	it("is deterministic and the bootstrap ledger stays clean", () => {
		for (const f of FIXTURES)
			expect(resolveLedger(readFixture(f))).toEqual(
				resolveLedger(readFixture(f)),
			);
		expect(handoffProtocolErrors(handoffData(FIXTURES[0]))).toEqual(
			handoffProtocolErrors(handoffData(FIXTURES[0])),
		);
		const data = parseDocument(readLedger()).toJS() as Parameters<
			typeof handoffProtocolErrors
		>[0];
		expect(handoffProtocolErrors(data)).toEqual([]);
		expect(resolveLedger(readLedger()).errors).toEqual([]);
	});
});
