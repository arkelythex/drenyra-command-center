import type { ComplianceReproducibilityReport } from "@drenyra/domain";
import { describe, expect, it } from "vitest";
import {
	executeSireReproducibilityCheck,
	parseSireReproducibilityArgs,
	type SireReproducibilityInput,
	type SireReproducibilityService,
} from "./sire-ledger-repro-check";

const COMPANY_ID = "company-sire-001";
const PERIOD = "2026-04";
const VALID_SCOPE_ARGS = ["--company-id", COMPANY_ID, "--period", PERIOD];

function createReport(
	overrides: Partial<ComplianceReproducibilityReport> = {},
): ComplianceReproducibilityReport {
	return {
		period: PERIOD,
		companyId: COMPANY_ID,
		reproducible: true,
		coverage: "COMPLETE_DATA",
		sire: { recordCount: 2, totalAmount: 236, totalIGV: 36 },
		ledger: { recordCount: 2, totalAmount: 236, totalIGV: 36 },
		differences: { recordCount: 0, totalAmount: 0, totalIGV: 0 },
		tolerances: { recordCount: 0, totalAmount: 0.01, totalIGV: 0.01 },
		...overrides,
	};
}

function createMockComplianceService(report: ComplianceReproducibilityReport): {
	service: SireReproducibilityService;
	inputs: SireReproducibilityInput[];
} {
	const inputs: SireReproducibilityInput[] = [];
	return {
		inputs,
		service: {
			async verifySireReproducibility(input) {
				inputs.push(input);
				return report;
			},
		},
	};
}

const INVALID_ARGUMENT_CASES = [
	{
		name: "month zero",
		args: ["--company-id", COMPANY_ID, "--period", "2026-00"],
	},
	{
		name: "month thirteen",
		args: ["--company-id", COMPANY_ID, "--period", "2026-13"],
	},
	{
		name: "non-padded month",
		args: ["--company-id", COMPANY_ID, "--period", "2026-4"],
	},
	{
		name: "year zero",
		args: ["--company-id", COMPANY_ID, "--period", "0000-04"],
	},
	{ name: "unknown argument", args: [...VALID_SCOPE_ARGS, "--write", "true"] },
	{
		name: "missing argument value",
		args: ["--company-id", COMPANY_ID, "--period"],
	},
	{
		name: "negative tolerance",
		args: [...VALID_SCOPE_ARGS, "--igv-tolerance", "-0.01"],
	},
	{
		name: "non-finite tolerance",
		args: [...VALID_SCOPE_ARGS, "--total-tolerance", "Infinity"],
	},
] as const;

describe("SIRE ledger reproducibility CLI parsing", () => {
	it("parses explicit scope and optional tolerances", () => {
		expect(
			parseSireReproducibilityArgs(
				[
					...VALID_SCOPE_ARGS,
					"--total-tolerance",
					"0.02",
					"--igv-tolerance",
					"0.03",
					"--record-tolerance",
					"1",
				],
				{},
			),
		).toEqual({
			companyId: COMPANY_ID,
			period: PERIOD,
			year: 2026,
			month: 4,
			totalTolerance: 0.02,
			igvTolerance: 0.03,
			recordTolerance: 1,
		});
	});

	it("uses environment scope only when CLI scope is absent", () => {
		expect(
			parseSireReproducibilityArgs([], {
				SIRE_COMPANY_ID: COMPANY_ID,
				SIRE_PERIOD: PERIOD,
			}),
		).toEqual({
			companyId: COMPANY_ID,
			period: PERIOD,
			year: 2026,
			month: 4,
		});

		expect(
			parseSireReproducibilityArgs(VALID_SCOPE_ARGS, {
				SIRE_COMPANY_ID: "ignored-company",
				SIRE_PERIOD: "2025-01",
			}).companyId,
		).toBe(COMPANY_ID);
	});

	it("never defaults the required company or period", () => {
		expect(() => parseSireReproducibilityArgs([], {})).toThrow(
			"Missing required scope",
		);
		expect(() =>
			parseSireReproducibilityArgs(["--company-id", COMPANY_ID], {}),
		).toThrow("Missing required scope");
	});

	for (const testCase of INVALID_ARGUMENT_CASES) {
		it(`rejects ${testCase.name}`, () => {
			expect(() => parseSireReproducibilityArgs(testCase.args, {})).toThrow();
		});
	}
});

describe("SIRE ledger reproducibility execution", () => {
	it.each(["NO_DATA", "PARTIAL_DATA"] as const)(
		"fails closed for %s coverage even when reproducible",
		async (coverage) => {
			const report = createReport({ reproducible: true, coverage });
			const mock = createMockComplianceService(report);
			const execution = await executeSireReproducibilityCheck(
				VALID_SCOPE_ARGS,
				{},
				mock.service,
			);

			expect(execution.exitCode).toBe(1);
			expect(execution.result.report).toBe(report);
		},
	);

	it("passes only reproducible complete-data evidence", async () => {
		const report = createReport();
		const mock = createMockComplianceService(report);
		const execution = await executeSireReproducibilityCheck(
			VALID_SCOPE_ARGS,
			{},
			mock.service,
		);

		expect(execution.exitCode).toBe(0);
		expect(execution.result).toEqual({
			scope: { companyId: COMPANY_ID, period: PERIOD },
			report,
		});
	});

	it("invokes only the read-only verifier with scoped input", async () => {
		const mock = createMockComplianceService(createReport());
		await executeSireReproducibilityCheck(
			[...VALID_SCOPE_ARGS, "--record-tolerance", "2"],
			{},
			mock.service,
		);

		expect(mock.inputs).toEqual([
			{ companyId: COMPANY_ID, year: 2026, month: 4, recordTolerance: 2 },
		]);
	});
});
