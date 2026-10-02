import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const BASELINE_PATH = "scripts/quality/typecheck-baseline.json";
const ERROR_LINE = /^(\S+?)\(\d+,\d+\): error TS\d+/;
const DIR_DEPTH = 3;

type Counts = Record<string, number>;

/**
 * Groups tsc diagnostics by their first path segments (e.g. `apps/api/src`).
 * @param output Raw `tsc` output.
 * @returns Error count per directory.
 */
export function countByDirectory(output: string): Counts {
	const counts: Counts = {};
	for (const line of output.split("\n")) {
		const match = ERROR_LINE.exec(line);
		if (!match?.[1]) continue;
		const dir = match[1].split("/").slice(0, DIR_DEPTH).join("/");
		counts[dir] = (counts[dir] ?? 0) + 1;
	}
	return counts;
}

/**
 * Lists directories whose error count rose above the baseline.
 * @param current Counts from the current run.
 * @param baseline Counts committed in the baseline file.
 * @returns Human-readable regressions; empty when the ratchet holds.
 */
export function findRegressions(current: Counts, baseline: Counts): string[] {
	return Object.entries(current)
		.filter(([dir, n]) => n > (baseline[dir] ?? 0))
		.map(([dir, n]) => `${dir}: ${baseline[dir] ?? 0} -> ${n}`);
}

function run(): number {
	const tsc = spawnSync(
		"node_modules/.bin/tsc",
		["-p", "tsconfig.check.json"],
		{
			encoding: "utf8",
			maxBuffer: 256 * 1024 * 1024,
		},
	);
	const current = countByDirectory(`${tsc.stdout}${tsc.stderr}`);
	if (process.argv.includes("--update") || !existsSync(BASELINE_PATH)) {
		writeFileSync(BASELINE_PATH, `${JSON.stringify(current, null, "\t")}\n`);
		console.log(`Baseline written to ${BASELINE_PATH}`);
		return 0;
	}
	const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as Counts;
	const regressions = findRegressions(current, baseline);
	if (regressions.length > 0) {
		console.error(`Typecheck ratchet failed:\n${regressions.join("\n")}`);
		return 1;
	}
	console.log("Typecheck ratchet holds.");
	return 0;
}

if (import.meta.main) process.exit(run());
