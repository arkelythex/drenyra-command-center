#!/usr/bin/env bun
/// <reference types="node" />

/**
 * architecture:check-baseline-policy — the typecheck debt may shrink but never grow.
 *
 * `scripts/ci/typecheck-ratchet.ts` compares a fresh `tsc` run against
 * `.ci/typecheck-baseline.json`. That protects the code, not the file: editing the
 * baseline to add a bucket silently silences a real regression. This gate closes that
 * hole by comparing the working baseline against the one on the merge base, so a
 * baseline may only lose keys or lower counts.
 *
 * A genuine improvement is reported as a warning asking for `--update`; a new bucket or
 * a higher count is a finding. Both are written to `.ci/architecture-baseline.json` so
 * an accepted exception is explicit and reviewable instead of invisible.
 *
 * Uso: bun scripts/architecture/check-baseline-policy.ts [--update]
 * Plan: odd/tasks/architecture-enforcement-pack.md
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { type Finding, type GateOutcome, runGate } from "./rules.ts";

const BASELINE_FILE = ".ci/typecheck-baseline.json";
const BASE_REF = process.env.ARCHITECTURE_BASE_REF ?? "origin/main";

type Scope = Record<string, number>;
type TypecheckBaseline = Record<string, Scope>;

function git(args: string[]): string | null {
	const result = spawnSync("git", args, {
		encoding: "utf8",
		cwd: process.cwd(),
	});
	if (result.status !== 0) return null;
	return result.stdout;
}

/** The commit the branch diverged from, so a stacked branch still compares fairly. */
function resolveBaseRef(): string | null {
	const mergeBase = git(["merge-base", "HEAD", BASE_REF])?.trim();
	if (mergeBase) return mergeBase;
	const head = git(["rev-parse", "--verify", BASE_REF])?.trim();
	return head || null;
}

function readWorkingBaseline(): TypecheckBaseline {
	return JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as TypecheckBaseline;
}

function readBaseBaseline(ref: string): TypecheckBaseline | null {
	const raw = git(["show", `${ref}:${BASELINE_FILE}`]);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as TypecheckBaseline;
	} catch {
		return null;
	}
}

function compareScope(
	scope: string,
	base: Scope,
	working: Scope,
): { findings: Finding[]; improvements: string[] } {
	const findings: Finding[] = [];
	const improvements: string[] = [];

	for (const [bucket, count] of Object.entries(working)) {
		const previous = base[bucket] ?? 0;
		if (count > previous) {
			findings.push({
				key: `${scope}:${bucket}`,
				message: `${scope}: ${bucket} grew from ${previous} to ${count} error(s)`,
			});
		} else if (count < previous) {
			improvements.push(`${scope}: ${bucket} ${previous} → ${count}`);
		}
	}

	for (const bucket of Object.keys(base)) {
		if (!(bucket in working)) {
			improvements.push(`${scope}: ${bucket} removed`);
		}
	}

	return { findings, improvements };
}

function evaluate(): GateOutcome {
	const warnings: string[] = [];
	const ref = resolveBaseRef();

	if (!ref) {
		warnings.push(
			`could not resolve ${BASE_REF}; baseline growth is unchecked in this run`,
		);
		return { findings: [], warnings };
	}

	const base = readBaseBaseline(ref);
	if (!base) {
		warnings.push(
			`${BASELINE_FILE} is absent at ${ref}; treating every working bucket as new`,
		);
	}

	const working = readWorkingBaseline();
	const findings: Finding[] = [];
	const improvements: string[] = [];

	for (const [scope, buckets] of Object.entries(working)) {
		const result = compareScope(scope, base?.[scope] ?? {}, buckets);
		findings.push(...result.findings);
		improvements.push(...result.improvements);
	}

	for (const scope of Object.keys(base ?? {})) {
		if (!(scope in working)) {
			warnings.push(`${scope} scope disappeared from ${BASELINE_FILE}`);
		}
	}

	if (improvements.length > 0) {
		warnings.push(
			`${improvements.length} bucket(s) improved and can be locked in with --update: ${improvements.slice(0, 5).join(", ")}${improvements.length > 5 ? " …" : ""}`,
		);
	}

	return { findings, warnings };
}

runGate("baselinePolicy", "baseline policy", evaluate());
