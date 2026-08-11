/** U1c RED/GREEN — semantic hardening. RED: absent semantic-validator module; GREEN: traversal, duplicate ids, owner mismatch, stale writes rejected; bootstrap accepted; deterministic. */
import { describe, expect, it } from "vitest";
import { validateLedgerYaml } from "./schema-validator.js";
import { validateLedgerSemantics } from "./semantic-validator.js";
import { readFixture, readLedger } from "./test-utils.js";

const SCHEMA_VALID_SEMANTIC_FIXTURES = [
	"semantic-path-traversal.yaml",
	"semantic-duplicate-event-id.yaml",
	"semantic-owner-mismatch.yaml",
	"semantic-stale-write.yaml",
];
// Inline malformed-YAML corpus (was fixture semantic-duplicate-child-id.yaml): C1 appears twice in the children map, so duplicate YAML map keys fail closed. Held as a plain string, never as a .yaml artifact, so repository YAML diagnostics stay clean.
const DUPLICATE_CHILD_ID_YAML = `schema_version: "1.0.0"
program_id: drenyra-ecosystem-audit-readiness
ledger_revision: 1
policy: {program_owner: drenyra-program-owner, effective_unit_limit: 300, config_default_unit_limit: 400, chain_strategy: feature-branch-chain}
repositories:
  drenyra: {identity: drenyra, authority_kind: umbrella-owner, allowed_child_prefix: openspec/changes/}
  drenyra-pi: {identity: drenyra-pi, authority_kind: sibling, allowed_child_prefix: openspec/changes/}
  drenyra-ai: {identity: drenyra-ai, authority_kind: sibling, allowed_child_prefix: openspec/changes/}
  drenyra-engram: {identity: drenyra-engram, authority_kind: sibling, allowed_child_prefix: openspec/changes/}
children:
  C1: {owner: drenyra, authority_mode: existing, change_id: drenyra-h02-tenant-isolation, state_path: openspec/changes/drenyra-h02-tenant-isolation/state.yaml, revision: "93bc8e1ae081d9ca567f75eeb00f5b91e01ad9e4", observed_phase: tasks, observed_status: review-pending, program_state: blocked, blockers: [H02_REVIEW_PENDING], mandatory: true, conditional: false}
  C5: {owner: drenyra-pi, authority_mode: external-reference, change_id: pending, state_path: openspec/changes/pending/state.yaml, revision: unlinked, observed_phase: unobserved, observed_status: unlinked, program_state: declared, blockers: [], mandatory: true, conditional: false}
  C7: {owner: drenyra-ai, authority_mode: external-reference, change_id: pending, state_path: openspec/changes/pending/state.yaml, revision: unlinked, observed_phase: unobserved, observed_status: unlinked, program_state: not-required, blockers: [], mandatory: false, conditional: true}
  C1: {owner: drenyra, authority_mode: existing, change_id: drenyra-h02-tenant-isolation, state_path: openspec/changes/drenyra-h02-tenant-isolation/state.yaml, revision: "93bc8e1ae081d9ca567f75eeb00f5b91e01ad9e4", observed_phase: tasks, observed_status: review-pending, program_state: blocked, blockers: [H02_REVIEW_PENDING], mandatory: true, conditional: false}
evidence: {}
research: {}
exceptions: {}
events:
  - {id: evt-1, kind: program-initialized, revision: 1, timestamp: "2026-08-09T00:00:00Z", prior_state: not-started, new_state: initialized, evidence_refs: []}
program_status: {revision: 1, derived_at: "2026-08-09T00:00:00Z", readiness_scope: fixture, ecosystem_ready: false, next_safe_action: fixture}`;
describe("semantic hardening (U1c)", () => {
	it("accepts the bootstrap ledger semantically (happy path)", () => {
		expect(validateLedgerSemantics(readLedger())).toEqual({
			valid: true,
			errors: [],
		});
	});
	it("semantic-failure fixtures are schema-valid (fail on missing semantic checks only)", () => {
		for (const f of SCHEMA_VALID_SEMANTIC_FIXTURES) {
			expect(validateLedgerYaml(readFixture(f)).valid, f).toBe(true);
		}
	});
	it("rejects path traversal in repository-relative state paths", () => {
		const result = validateLedgerSemantics(
			readFixture(SCHEMA_VALID_SEMANTIC_FIXTURES[0]),
		);
		expect(result.valid).toBe(false);
		expect(result.errors.join("\n")).toContain("state_path");
	});
	it("rejects duplicate event ids (append-only event log)", () => {
		const result = validateLedgerSemantics(
			readFixture(SCHEMA_VALID_SEMANTIC_FIXTURES[1]),
		);
		expect(result.valid).toBe(false);
		const errors = result.errors.join("\n");
		expect(errors).toContain("duplicate event id");
		expect(errors).toContain("evt-1");
	});
	it("rejects owner mismatch (child names a repository other than its single owner)", () => {
		const result = validateLedgerSemantics(
			readFixture(SCHEMA_VALID_SEMANTIC_FIXTURES[2]),
		);
		expect(result.valid).toBe(false);
		const errors = result.errors.join("\n");
		expect(errors).toContain("children.C5.owner");
		expect(errors).toContain("owner mismatch");
	});
	it("rejects stale concurrent writes (monotonic ledger_revision enforcement)", () => {
		const result = validateLedgerSemantics(
			readFixture(SCHEMA_VALID_SEMANTIC_FIXTURES[3]),
		);
		expect(result.valid).toBe(false);
		const errors = result.errors.join("\n");
		expect(errors).toContain("ledger_revision");
		expect(errors).toContain("stale concurrent write");
	});
	it("rejects duplicate child ids (duplicate YAML map keys fail closed)", () => {
		const result = validateLedgerSemantics(DUPLICATE_CHILD_ID_YAML);
		expect(result.valid).toBe(false);
		expect(result.errors.join("\n")).toContain("Map keys must be unique");
	});
	it("is deterministic: identical input yields identical semantic verdicts", () => {
		for (const text of [
			...SCHEMA_VALID_SEMANTIC_FIXTURES.map(readFixture),
			DUPLICATE_CHILD_ID_YAML,
		]) {
			expect(validateLedgerSemantics(text)).toEqual(
				validateLedgerSemantics(text),
			);
		}
	});
});
