import type { ComplianceReproducibilityReport } from "@drenyra/domain";
import { describe, expect, it } from "vitest";
import {
	evaluateSireLedgerGate,
	executeSireLedgerGate,
} from "./sire-ledger-gate-evaluate";
import {
	parseSireReproducibilityArgs,
	type SireReproducibilityService,
} from "./sire-ledger-repro-check";

const COMPANY_ID = "company-sire-001";
const PERIOD = "2026-04";
const VALID_SCOPE_ARGS = [
	"--company-id",
	COMPANY_ID,
	"--period",
	PERIOD,
] as const;

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

function createMockComplianceService(
	report: ComplianceReproducibilityReport,
): SireReproducibilityService {
	return {
		async verifySireReproducibility() {
			return report;
		},
	};
}

describe("SIRE ledger gate evaluation", () => {
	it.each(["NO_DATA", "PARTIAL_DATA"] as const)(
		"marks %s evidence as FAIL with a coverage reason",
		(coverage) => {
			const report = createReport({ coverage });
			const options = parseSireReproducibilityArgs(VALID_SCOPE_ARGS, {});
			const result = evaluateSireLedgerGate(options, report);

			expect(result.status).toBe("FAIL");
			expect(result.reason).toBe(
				coverage === "NO_DATA"
					? "SIRE_REPRODUCIBILITY_COVERAGE_NO_DATA"
					: "SIRE_REPRODUCIBILITY_COVERAGE_PARTIAL_DATA",
			);
		},
	);

	it("fails a complete-data mismatch", async () => {
		const report = createReport({
			reproducible: false,
			differences: { recordCount: 1, totalAmount: 10, totalIGV: 1.8 },
			runbookId: "sire-ledger-repro",
		});
		const execution = await executeSireLedgerGate(
			VALID_SCOPE_ARGS,
			{},
			createMockComplianceService(report),
		);

		expect(execution.exitCode).toBe(1);
		expect(execution.result).toMatchObject({
			status: "FAIL",
			reason: "SIRE_LEDGER_REPRODUCIBILITY_MISMATCH",
			coverage: "COMPLETE_DATA",
			differences: report.differences,
			tolerances: report.tolerances,
			report,
		});
	});

	it("passes only reproducible complete-data evidence", async () => {
		const report = createReport();
		const execution = await executeSireLedgerGate(
			VALID_SCOPE_ARGS,
			{},
			createMockComplianceService(report),
		);

		expect(execution.exitCode).toBe(0);
		expect(execution.result).toEqual({
			status: "PASS",
			reason: "SIRE_LEDGER_REPRODUCIBLE_COMPLETE_DATA",
			scope: { companyId: COMPANY_ID, period: PERIOD },
			coverage: "COMPLETE_DATA",
			differences: report.differences,
			tolerances: report.tolerances,
			report,
		});
	});
});
