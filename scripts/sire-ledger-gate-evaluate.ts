import type { ComplianceReproducibilityReport } from "@drenyra/domain";
import {
	getSireReproducibilityReport,
	parseSireReproducibilityArgs,
	type SireReproducibilityOptions,
	type SireReproducibilityScope,
	type SireReproducibilityService,
} from "./sire-ledger-repro-check";

const GATE_STATUS = {
	pass: "PASS",
	fail: "FAIL",
} as const;

const GATE_REASON = {
	pass: "SIRE_LEDGER_REPRODUCIBLE_COMPLETE_DATA",
	noData: "SIRE_REPRODUCIBILITY_COVERAGE_NO_DATA",
	partialData: "SIRE_REPRODUCIBILITY_COVERAGE_PARTIAL_DATA",
	mismatch: "SIRE_LEDGER_REPRODUCIBILITY_MISMATCH",
} as const;

export interface SireLedgerGateResult {
	status: (typeof GATE_STATUS)[keyof typeof GATE_STATUS];
	reason: (typeof GATE_REASON)[keyof typeof GATE_REASON];
	scope: SireReproducibilityScope;
	coverage: ComplianceReproducibilityReport["coverage"];
	differences: ComplianceReproducibilityReport["differences"];
	tolerances: ComplianceReproducibilityReport["tolerances"];
	report: ComplianceReproducibilityReport;
}

export interface SireLedgerGateExecution {
	exitCode: number;
	result: SireLedgerGateResult;
}

type SireEnvironment = Readonly<Record<string, string | undefined>>;

function resolveGateReason(
	report: ComplianceReproducibilityReport,
): SireLedgerGateResult["reason"] {
	if (report.coverage === "NO_DATA") {
		return GATE_REASON.noData;
	}
	if (report.coverage === "PARTIAL_DATA") {
		return GATE_REASON.partialData;
	}
	return report.reproducible ? GATE_REASON.pass : GATE_REASON.mismatch;
}

/**
 * Evaluates existing read-only reproducibility evidence. PASS requires both
 * COMPLETE_DATA coverage and a reproducible report; missing or partial evidence
 * always fails closed, even when the service reports reproducible=true.
 */
export function evaluateSireLedgerGate(
	options: SireReproducibilityOptions,
	report: ComplianceReproducibilityReport,
): SireLedgerGateResult {
	const passes = report.coverage === "COMPLETE_DATA" && report.reproducible;
	return {
		status: passes ? GATE_STATUS.pass : GATE_STATUS.fail,
		reason: resolveGateReason(report),
		scope: { companyId: options.companyId, period: options.period },
		coverage: report.coverage,
		differences: report.differences,
		tolerances: report.tolerances,
		report,
	};
}

/** Calls the same read-only verifier as the reproducibility CLI and returns deterministic gate evidence. */
export async function executeSireLedgerGate(
	args: readonly string[],
	env: SireEnvironment = process.env,
	service?: SireReproducibilityService,
): Promise<SireLedgerGateExecution> {
	const options = parseSireReproducibilityArgs(args, env);
	const report = await getSireReproducibilityReport(options, service);
	const result = evaluateSireLedgerGate(options, report);
	return { exitCode: result.status === GATE_STATUS.pass ? 0 : 1, result };
}

/** CLI output is one deterministic JSON document on stdout; errors go to stderr and exit nonzero. */
async function main(): Promise<void> {
	try {
		const execution = await executeSireLedgerGate(Bun.argv.slice(2));
		console.log(JSON.stringify(execution.result, null, 2));
		process.exitCode = execution.exitCode;
	} catch (error: unknown) {
		console.error(
			error instanceof Error ? error.message : "Unknown SIRE gate error",
		);
		process.exitCode = 1;
	}
}

if (import.meta.main) {
	await main();
}
