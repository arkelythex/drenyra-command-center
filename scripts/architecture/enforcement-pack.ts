#!/usr/bin/env bun
/// <reference types="node" />

/**
 * architecture:enforcement — run every architecture gate as one command.
 *
 * Each gate is a standalone script so it can run alone while iterating, but CI and the
 * release workflow need one entry point that fails if any gate fails. Running them in
 * separate processes keeps a gate's state, `--update` and its exit code independent:
 * one gate cannot swallow another's failure.
 *
 * Uso: bun scripts/architecture/enforcement-pack.ts [--update]
 * Plan: odd/tasks/architecture-enforcement-pack.md
 */

import { join } from "node:path";
import { runGate } from "./rules.ts";

interface Gate {
	script: string;
	title: string;
}

const GATES: Gate[] = [
	{ script: "check-package-boundaries.ts", title: "package boundaries" },
	{ script: "check-framework-isolation.ts", title: "framework isolation" },
	{ script: "check-baseline-policy.ts", title: "baseline policy" },
	{
		script: "check-migration-governance.ts",
		title: "migration governance",
	},
	{
		script: "audit-tsconfig-check-features.ts",
		title: "tsconfig check features",
	},
	{ script: "score-module-extraction.ts", title: "module extraction" },
];

interface GateResult {
	title: string;
	ok: boolean;
}

function run(script: string): boolean {
	const result = Bun.spawnSync({
		cmd: ["bun", join(import.meta.dir, script), ...process.argv.slice(2)],
		stdout: "inherit",
		stderr: "inherit",
	});
	return result.exitCode === 0;
}

function main(): never {
	const results: GateResult[] = GATES.map((gate) => ({
		title: gate.title,
		ok: run(gate.script),
	}));

	console.log("\n[architecture:enforcement] summary");
	for (const result of results) {
		console.log(`  ${result.ok ? "pass" : "FAIL"}  ${result.title}`);
	}

	const failures = results.filter((result) => !result.ok);

	runGate("enforcement", "enforcement", {
		findings: failures.map((result) => ({
			key: `gate:${result.title}`,
			message: `${result.title} failed; see its output above`,
		})),
		warnings: [],
	});
}

main();
