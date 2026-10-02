#!/usr/bin/env bun
/// <reference types="node" />

/**
 * typecheck:ratchet — the typecheck debt may shrink but never grow.
 *
 * Runs a package's own `typecheck`, buckets the errors by (repo-relative file, TS code)
 * and compares them with `.ci/typecheck-baseline.json`:
 *   - any bucket with MORE errors than the baseline (or a new bucket) fails the job;
 *   - fewer errors pass and ask for `--update` so the improvement is locked in.
 * Counting by file+code (not by total) means a fix in one place can never hide a new
 * error somewhere else, and line shifts do not matter.
 *
 * Uso: bun scripts/ci/typecheck-ratchet.ts <web|api|domain> [--update]
 * Plan: odd/tasks/typecheck-baseline.md
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

export type Buckets = Record<string, number>;

export interface BucketDelta {
	key: string;
	baseline: number;
	current: number;
}

export interface Comparison {
	regressions: BucketDelta[];
	improvements: BucketDelta[];
}

export interface Verdict {
	exitCode: 0 | 1;
	message: string;
	/** True when the baseline may be rewritten (nothing regressed). */
	canUpdate: boolean;
}

const ERROR_LINE = /^(?:\S+ typecheck: )?(.+?)\((\d+),(\d+)\): error (TS\d+):/;

/** Bucket tsc output by `repo-relative-file|TScode`. `cwd` is where tsc ran. */
export function parseTscErrors(
	output: string,
	cwd: string,
	root: string,
): Buckets {
	const buckets: Buckets = {};
	for (const line of output.split("\n")) {
		const match = ERROR_LINE.exec(line);
		if (!match) continue;
		const file = relative(root, resolve(cwd, match[1])).split("\\").join("/");
		const key = `${file}|${match[4]}`;
		buckets[key] = (buckets[key] ?? 0) + 1;
	}
	return buckets;
}

export function compareToBaseline(
	baseline: Buckets,
	current: Buckets,
): Comparison {
	const regressions: BucketDelta[] = [];
	const improvements: BucketDelta[] = [];
	for (const key of new Set([
		...Object.keys(baseline),
		...Object.keys(current),
	])) {
		const before = baseline[key] ?? 0;
		const now = current[key] ?? 0;
		if (now > before) regressions.push({ key, baseline: before, current: now });
		else if (now < before)
			improvements.push({ key, baseline: before, current: now });
	}
	const byKey = (a: BucketDelta, b: BucketDelta) => a.key.localeCompare(b.key);
	return {
		regressions: regressions.sort(byKey),
		improvements: improvements.sort(byKey),
	};
}

const total = (b: Buckets): number =>
	Object.values(b).reduce((a, n) => a + n, 0);

export function evaluate(
	name: string,
	baseline: Buckets,
	current: Buckets,
): Verdict {
	const { regressions, improvements } = compareToBaseline(baseline, current);
	if (regressions.length > 0) {
		const lines = regressions.map(
			(r) => `  ${r.key.replace("|", "  ")}: ${r.baseline} → ${r.current}`,
		);
		return {
			exitCode: 1,
			canUpdate: false,
			message: [
				`[typecheck:ratchet] ✖ ${name}: ${regressions.length} bucket(s) got worse (baseline ${total(baseline)}, now ${total(current)}).`,
				...lines,
				"Fix these errors — the typecheck debt may shrink but never grow. Do not edit the baseline to hide them.",
			].join("\n"),
		};
	}
	const message =
		improvements.length > 0
			? `[typecheck:ratchet] ✅ ${name}: ${total(current)} errors (baseline ${total(baseline)}). Fewer errors than the baseline — lock it in with: bun scripts/ci/typecheck-ratchet.ts ${name} --update`
			: `[typecheck:ratchet] ✅ ${name}: ${total(current)} errors, no new ones.`;
	return { exitCode: 0, canUpdate: improvements.length > 0, message };
}

/** The baseline may be written when bootstrapping (no entry yet) or when errors only went down. */
export function canWriteBaseline(
	verdict: Verdict,
	hasBaseline: boolean,
): boolean {
	return !hasBaseline || verdict.canUpdate;
}

// ─── CLI ───────────────────────────────────────────────────────────────────

const TARGETS: Record<string, string> = {
	web: "apps/web",
	api: "apps/api",
	domain: "packages/domain",
};
const BASELINE_PATH = ".ci/typecheck-baseline.json";

function main(): number {
	const name = process.argv[2] ?? "";
	const update = process.argv.includes("--update");
	const dir = TARGETS[name];
	if (!dir) {
		console.error(
			`Usage: typecheck-ratchet.ts <${Object.keys(TARGETS).join("|")}> [--update]`,
		);
		return 2;
	}
	const root = process.cwd();
	const cwd = resolve(root, dir);

	const run = spawnSync("bun", ["run", "typecheck"], {
		cwd,
		encoding: "utf8",
		maxBuffer: 256 * 1024 * 1024,
	});
	const current = parseTscErrors(`${run.stdout}\n${run.stderr}`, cwd, root);
	if (run.error || (run.status !== 0 && Object.keys(current).length === 0)) {
		console.error(
			`[typecheck:ratchet] ✖ ${name}: typecheck failed without TypeScript errors (tooling problem?)`,
		);
		console.error(`${run.stderr}`.slice(-2000));
		return 1;
	}

	const all: Record<string, Buckets> = existsSync(resolve(root, BASELINE_PATH))
		? JSON.parse(readFileSync(resolve(root, BASELINE_PATH), "utf8"))
		: {};
	const hasBaseline = all[name] !== undefined;
	const verdict = evaluate(name, all[name] ?? {}, current);
	console.log(
		hasBaseline || !update
			? verdict.message
			: `[typecheck:ratchet] bootstrapping the ${name} baseline`,
	);

	if (update) {
		if (!canWriteBaseline(verdict, hasBaseline)) {
			console.error(
				"[typecheck:ratchet] --update refused: nothing improved (or something regressed).",
			);
			return 1;
		}
		all[name] = Object.fromEntries(
			Object.entries(current).sort(([a], [b]) => a.localeCompare(b)),
		);
		mkdirSync(dirname(resolve(root, BASELINE_PATH)), { recursive: true });
		writeFileSync(
			resolve(root, BASELINE_PATH),
			`${JSON.stringify(all, null, "\t")}\n`,
		);
		console.log(
			`[typecheck:ratchet] baseline for ${name} updated: ${total(current)} errors.`,
		);
		return 0;
	}
	return verdict.exitCode;
}

if (import.meta.main) process.exit(main());
