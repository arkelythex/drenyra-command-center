export const QUALITY_RESULT_CLASSIFICATION = {
	PASS: "pass",
	FINDINGS: "findings",
	TOOL_FAILURE: "tool-failure",
	MISSING_ENTRY_POINT: "missing-entry-point",
} as const;

export type QualityResultClassification =
	(typeof QUALITY_RESULT_CLASSIFICATION)[keyof typeof QUALITY_RESULT_CLASSIFICATION];

export interface ProcessResult {
	exitCode: number;
	output: string;
}

export interface ClassifiedProcessResult {
	classification: QualityResultClassification;
	observedFailure: string | null;
}

export interface QualityProbeResult extends ClassifiedProcessResult {
	command: string;
	workingDirectory: string;
	exitCode: number;
	rawOutput: string;
}

export const QUALITY_COMMANDS = [
	"typecheck",
	"lint:all",
	"quality:dead-code",
	"quality:circular",
	"quality:core",
] as const;

const MISSING_ENTRY_POINT_PATTERN =
	/no such file or directory|command not found/i;
const TOOL_CONFIGURATION_FAILURE_PATTERN =
	/\b(?:configuration resulted in errors|error loading)\b/i;
const TOOL_CRASH_PATTERN =
	/\b(?:TypeError|ReferenceError|SyntaxError|RangeError):/;

export function classifyProcessResult({
	exitCode,
	output,
}: ProcessResult): ClassifiedProcessResult {
	if (exitCode === 0) {
		return {
			classification: QUALITY_RESULT_CLASSIFICATION.PASS,
			observedFailure: null,
		};
	}

	if (exitCode === 127 || MISSING_ENTRY_POINT_PATTERN.test(output)) {
		return {
			classification: QUALITY_RESULT_CLASSIFICATION.MISSING_ENTRY_POINT,
			observedFailure: "command entry point is missing",
		};
	}

	if (TOOL_CONFIGURATION_FAILURE_PATTERN.test(output)) {
		return {
			classification: QUALITY_RESULT_CLASSIFICATION.TOOL_FAILURE,
			observedFailure: "tool configuration prevented a reliable result",
		};
	}

	if (TOOL_CRASH_PATTERN.test(output)) {
		return {
			classification: QUALITY_RESULT_CLASSIFICATION.TOOL_FAILURE,
			observedFailure: "tool crashed before producing findings",
		};
	}

	return {
		classification: QUALITY_RESULT_CLASSIFICATION.FINDINGS,
		observedFailure: null,
	};
}

export async function captureQualityProbe(
	command: string,
): Promise<QualityProbeResult> {
	const childProcess = Bun.spawn(["bun", "run", command], {
		cwd: process.cwd(),
		stdout: "pipe",
		stderr: "pipe",
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(childProcess.stdout).text(),
		new Response(childProcess.stderr).text(),
		childProcess.exited,
	]);
	const rawOutput = `${stdout}${stderr}`;

	return {
		command,
		workingDirectory: process.cwd(),
		exitCode,
		rawOutput,
		...classifyProcessResult({ exitCode, output: rawOutput }),
	};
}

if (import.meta.main) {
	const results = await Promise.all(QUALITY_COMMANDS.map(captureQualityProbe));
	console.log(JSON.stringify(results, null, 2));
	process.exitCode = results.some(
		(result) => result.classification !== QUALITY_RESULT_CLASSIFICATION.PASS,
	)
		? 1
		: 0;
}
