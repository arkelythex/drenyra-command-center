/** U1b RED/GREEN — ledger schema validation. RED: absent validator module; GREEN: bootstrap accepted, fixtures rejected, deterministic verdicts. */
import { describe, expect, it } from "vitest";
import { validateLedgerFile, validateLedgerYaml } from "./schema-validator.js";
import { LEDGER_PATH, readFixture, readLedger } from "./test-utils.js";

const FIXTURES = [
	"schema-missing-top-level.yaml",
	"schema-unknown-key.yaml",
	"schema-unknown-version.yaml",
];

describe("bootstrap ledger schema validation (U1b)", () => {
	it("accepts the bootstrap ledger (valid corpus)", () => {
		expect(validateLedgerFile(LEDGER_PATH)).toEqual({
			valid: true,
			errors: [],
		});
	});
	it("keeps C1 blocked/H02_REVIEW_PENDING, C7 not-required, no executable child", () => {
		expect(validateLedgerFile(LEDGER_PATH).valid).toBe(true);
		const src = readLedger();
		expect(src).toContain("program_state: blocked");
		expect(src).toContain("H02_REVIEW_PENDING");
		expect(src).toContain("program_state: not-required");
		expect(src).not.toContain("program_state: executable");
	});
	it("rejects every schema-failure fixture", () => {
		for (const f of FIXTURES) {
			const result = validateLedgerYaml(readFixture(f));
			expect(result.valid, f).toBe(false);
			expect(result.errors.length, f).toBeGreaterThan(0);
		}
	});
	it("rejects missing top-level fields (policy, events, program_status)", () => {
		const errors = validateLedgerYaml(readFixture(FIXTURES[0])).errors.join(
			"\n",
		);
		expect(errors).toContain("policy");
		expect(errors).toContain("events");
		expect(errors).toContain("program_status");
	});
	it("rejects unknown top-level keys (additionalProperties false)", () => {
		const errors = validateLedgerYaml(readFixture(FIXTURES[1])).errors.join(
			"\n",
		);
		expect(errors).toContain("bogus_top_level_key");
	});
	it("rejects unknown schema versions (version gating)", () => {
		const errors = validateLedgerYaml(readFixture(FIXTURES[2])).errors.join(
			"\n",
		);
		expect(errors).toContain("schema_version");
	});
	it("is deterministic: identical input yields identical verdicts", () => {
		const valid = readLedger();
		expect(validateLedgerYaml(valid)).toEqual(validateLedgerYaml(valid));
		const invalid = readFixture(FIXTURES[2]);
		expect(validateLedgerYaml(invalid)).toEqual(validateLedgerYaml(invalid));
	});
});
