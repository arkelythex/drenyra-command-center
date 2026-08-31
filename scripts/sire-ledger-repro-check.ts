import type { ComplianceReproducibilityReport } from "@drenyra/domain";
import { ComplianceService } from "../apps/api/src/services/compliance.service";

const OPTION_NAMES = {
	companyId: "--company-id",
	period: "--period",
	totalTolerance: "--total-tolerance",
	igvTolerance: "--igv-tolerance",
	recordTolerance: "--record-tolerance",
} as const;

export interface SireReproducibilityOptions {
	companyId: string;
	period: string;
	year: number;
	month: number;
	totalTolerance?: number;
	igvTolerance?: number;
	recordTolerance?: number;
}

export interface SireReproducibilityInput {
	companyId: string;
	year: number;
	month: number;
	totalTolerance?: number;
	igvTolerance?: number;
	recordTolerance?: number;
}

export interface SireReproducibilityService {
	verifySireReproducibility(
		input: SireReproducibilityInput,
	): Promise<ComplianceReproducibilityReport>;
}

export interface SireReproducibilityCheckResult {
	scope: SireReproducibilityScope;
	report: ComplianceReproducibilityReport;
}

export interface SireReproducibilityScope {
	companyId: string;
	period: string;
}

export interface SireReproducibilityExecution {
	exitCode: number;
	result: SireReproducibilityCheckResult;
}

type SireEnvironment = Readonly<Record<string, string | undefined>>;

function parsePeriod(
	value: string,
): Pick<SireReproducibilityOptions, "period" | "year" | "month"> {
	const match = /^(?!0000)(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
	if (!match) {
		throw new Error(
			"Invalid --period: expected a real month in YYYY-MM format (month 01-12)",
		);
	}

	return {
		period: value,
		year: parseInt(match[1] ?? "", 10),
		month: parseInt(match[2] ?? "", 10),
	};
}

function parseTolerance(option: string, value: string): number {
	if (!/^\d+(?:\.\d+)?$/.test(value)) {
		throw new Error(
			`Invalid ${option}: expected a non-negative finite decimal value`,
		);
	}

	// Tolerances are comparison thresholds forwarded unchanged, not money calculations.
	const parsed = +value;
	if (!Number.isFinite(parsed)) {
		throw new Error(
			`Invalid ${option}: expected a non-negative finite decimal value`,
		);
	}
	return parsed;
}

function parseArgumentValues(args: readonly string[]): Map<string, string> {
	const values = new Map<string, string>();
	const knownOptions = new Set<string>(Object.values(OPTION_NAMES));

	for (let index = 0; index < args.length; index += 2) {
		const option = args[index];
		const value = args[index + 1];
		if (!option || !knownOptions.has(option)) {
			throw new Error(`Unknown argument: ${option ?? "<missing>"}`);
		}
		if (values.has(option)) {
			throw new Error(`Duplicate argument: ${option}`);
		}
		if (value === undefined || value.startsWith("--")) {
			throw new Error(`Missing value for ${option}`);
		}
		values.set(option, value);
	}
	return values;
}

/**
 * Parses the explicit company/period scope and optional tolerances for the
 * read-only reproducibility check. CLI values take precedence over environment
 * fallbacks; malformed, duplicate, missing, and unknown arguments are rejected.
 */
export function parseSireReproducibilityArgs(
	args: readonly string[],
	env: SireEnvironment = process.env,
): SireReproducibilityOptions {
	const values = parseArgumentValues(args);
	const companyId = values.get(OPTION_NAMES.companyId) ?? env.SIRE_COMPANY_ID;
	const periodValue = values.get(OPTION_NAMES.period) ?? env.SIRE_PERIOD;
	if (!companyId?.trim()) {
		throw new Error(
			"Missing required scope: provide --company-id or SIRE_COMPANY_ID",
		);
	}
	if (!periodValue?.trim()) {
		throw new Error("Missing required scope: provide --period or SIRE_PERIOD");
	}

	const period = parsePeriod(periodValue);
	const options: SireReproducibilityOptions = {
		companyId: companyId.trim(),
		...period,
	};

	const toleranceOptions = [
		[OPTION_NAMES.totalTolerance, "totalTolerance"],
		[OPTION_NAMES.igvTolerance, "igvTolerance"],
		[OPTION_NAMES.recordTolerance, "recordTolerance"],
	] as const;
	for (const [option, property] of toleranceOptions) {
		const value = values.get(option);
		if (value !== undefined) {
			options[property] = parseTolerance(option, value);
		}
	}

	return options;
}

/** Calls only the existing read-only compliance verifier; it performs no writes or SUNAT submission. */
export async function getSireReproducibilityReport(
	options: SireReproducibilityOptions,
	service: SireReproducibilityService = ComplianceService,
): Promise<ComplianceReproducibilityReport> {
	return service.verifySireReproducibility({
		companyId: options.companyId,
		year: options.year,
		month: options.month,
		...(options.totalTolerance === undefined
			? {}
			: { totalTolerance: options.totalTolerance }),
		...(options.igvTolerance === undefined
			? {}
			: { igvTolerance: options.igvTolerance }),
		...(options.recordTolerance === undefined
			? {}
			: { recordTolerance: options.recordTolerance }),
	});
}

/**
 * Produces deterministic JSON-ready evidence. Exit code 0 requires both a
 * reproducible report and COMPLETE_DATA coverage; all other evidence fails closed.
 */
export async function executeSireReproducibilityCheck(
	args: readonly string[],
	env: SireEnvironment = process.env,
	service: SireReproducibilityService = ComplianceService,
): Promise<SireReproducibilityExecution> {
	const options = parseSireReproducibilityArgs(args, env);
	const report = await getSireReproducibilityReport(options, service);
	return {
		exitCode:
			report.reproducible && report.coverage === "COMPLETE_DATA" ? 0 : 1,
		result: {
			scope: { companyId: options.companyId, period: options.period },
			report,
		},
	};
}

/** CLI output is one deterministic JSON document on stdout; errors go to stderr and exit nonzero. */
async function main(): Promise<void> {
	try {
		const execution = await executeSireReproducibilityCheck(Bun.argv.slice(2));
		console.log(JSON.stringify(execution.result, null, 2));
		process.exitCode = execution.exitCode;
	} catch (error: unknown) {
		console.error(
			error instanceof Error
				? error.message
				: "Unknown SIRE reproducibility error",
		);
		process.exitCode = 1;
	}
}

if (import.meta.main) {
	await main();
}
