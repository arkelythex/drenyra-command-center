#!/usr/bin/env bun
/// <reference types="node" />

/**
 * architecture:audit-tsconfig-check-features — a check config may narrow the program,
 * never the soundness of it.
 *
 * `tsconfig.check.json` exists to typecheck a slice of the monorepo quickly, so it
 * narrows `include` and turns emission off. It must not also relax the compiler
 * features that make typechecking meaningful: disabling `strictNullChecks` or
 * `exactOptionalPropertyTypes` in a check config turns real defects into a green build.
 *
 * The configs are read with a small JSONC reader and resolved through their `extends`
 * chain (last entry wins, child overrides parent, `strict` expands to its family) so the
 * gate needs no TypeScript API — the repo pins TypeScript 7, whose root export no longer
 * carries the compiler API. `include`/`exclude`/`references` are ignored on purpose: this
 * gate audits features, not scope.
 *
 * Uso: bun scripts/architecture/audit-tsconfig-check-features.ts [--update]
 * Plan: odd/tasks/architecture-enforcement-pack.md
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { type Finding, type GateOutcome, runGate } from "./rules.ts";

const ROOT_CONFIG = "tsconfig.json";
const CHECK_CONFIG_NAME = "tsconfig.check.json";
const SKIP_DIRS = new Set([
	"node_modules",
	"dist",
	"build",
	"coverage",
	".turbo",
	".git",
]);

/** Options whose relaxation silently removes real errors from the report. */
const SOUNDNESS_OPTIONS = [
	"strict",
	"noImplicitAny",
	"strictNullChecks",
	"strictFunctionTypes",
	"strictBindCallApply",
	"strictPropertyInitialization",
	"noImplicitThis",
	"alwaysStrict",
	"noUnusedLocals",
	"noUnusedParameters",
	"noUncheckedIndexedAccess",
	"exactOptionalPropertyTypes",
	"noImplicitReturns",
	"noFallthroughCasesInSwitch",
] as const;

/** The flags `strict: true` implies, mirroring `tsc`. */
const STRICT_FAMILY = [
	"noImplicitAny",
	"strictNullChecks",
	"strictFunctionTypes",
	"strictBindCallApply",
	"strictPropertyInitialization",
	"noImplicitThis",
	"alwaysStrict",
	"useUnknownInCatchVariables",
] as const;

type CompilerFlags = Record<string, boolean | undefined>;

interface RawConfig {
	compilerOptions?: CompilerFlags;
	extends?: string | string[];
}

/** Index just past a string literal that starts at `index` (the opening quote). */
function skipString(source: string, index: number): number {
	let cursor = index + 1;
	while (cursor < source.length) {
		if (source[cursor] === "\\") {
			cursor += 2;
			continue;
		}
		if (source[cursor] === '"') return cursor + 1;
		cursor += 1;
	}
	return cursor;
}

/** Index just past a `//` comment; the newline itself is preserved by the caller. */
function skipLineComment(source: string, index: number): number {
	let cursor = index;
	while (cursor < source.length && source[cursor] !== "\n") cursor += 1;
	return cursor;
}

/** Index just past a `/*` … `*\/` comment. */
function skipBlockComment(source: string, index: number): number {
	let cursor = index + 2;
	while (
		cursor < source.length &&
		!(source[cursor] === "*" && source[cursor + 1] === "/")
	) {
		cursor += 1;
	}
	return cursor + 2;
}

/** Strip `//` and block comments plus trailing commas, outside string literals. */
function stripJsonc(source: string): string {
	let out = "";
	let index = 0;

	while (index < source.length) {
		const char = source[index];

		if (char === '"') {
			const end = skipString(source, index);
			out += source.slice(index, end);
			index = end;
			continue;
		}

		if (char === "/" && source[index + 1] === "/") {
			index = skipLineComment(source, index);
			out += "\n";
			continue;
		}

		if (char === "/" && source[index + 1] === "*") {
			index = skipBlockComment(source, index);
			continue;
		}

		out += char;
		index += 1;
	}

	return out.replace(/,(\s*[}\]])/g, "$1");
}

function readConfig(path: string): RawConfig {
	return JSON.parse(stripJsonc(readFileSync(path, "utf8"))) as RawConfig;
}

/** Resolve `extends` to absolute paths, base first. */
function extendsChain(path: string, seen = new Set<string>()): string[] {
	if (seen.has(path)) {
		throw new Error(`circular "extends" chain at ${path}`);
	}
	seen.add(path);

	const config = readConfig(path);
	const parents = Array.isArray(config.extends)
		? config.extends
		: config.extends
			? [config.extends]
			: [];

	const chain: string[] = [];
	for (const parent of parents) {
		const resolved = resolve(dirname(path), parent);
		const withExtension = resolved.endsWith(".json")
			? resolved
			: `${resolved}.json`;
		chain.push(...extendsChain(withExtension, new Set(seen)));
	}
	chain.push(path);
	return chain;
}

/** Effective compiler flags: base first, `strict` expanded, child overrides last. */
function effectiveFlags(path: string): CompilerFlags {
	const flags: CompilerFlags = {};

	for (const configPath of extendsChain(path)) {
		const options = readConfig(configPath).compilerOptions ?? {};
		const strict = options.strict;
		if (typeof strict === "boolean") {
			for (const flag of STRICT_FAMILY) flags[flag] = strict;
		}
		Object.assign(flags, options);
	}

	return flags;
}

function findCheckConfigs(dir: string, found: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		if (SKIP_DIRS.has(entry)) continue;
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			findCheckConfigs(full, found);
			continue;
		}
		if (entry === CHECK_CONFIG_NAME) found.push(full);
	}
	return found;
}

function relaxations(
	config: string,
	flags: CompilerFlags,
	root: CompilerFlags,
): Finding[] {
	const findings: Finding[] = [];

	for (const option of SOUNDNESS_OPTIONS) {
		if (root[option] !== true) continue;
		if (flags[option] === true) continue;
		findings.push({
			key: `relaxed:${config}:${option}`,
			message: `${config} disables ${option}, which the root program enforces`,
		});
	}

	if (flags.noEmit !== true) {
		findings.push({
			key: `emit:${config}`,
			message: `${config} does not set noEmit, so typechecking can write build output`,
		});
	}

	return findings;
}

function evaluate(): GateOutcome {
	const cwd = process.cwd();
	const warnings: string[] = [];

	let root: CompilerFlags;
	try {
		root = effectiveFlags(join(cwd, ROOT_CONFIG));
	} catch (error) {
		return {
			findings: [],
			warnings: [
				`could not resolve ${ROOT_CONFIG} (${(error as Error).message}); the audit compared nothing`,
			],
		};
	}

	const configs = findCheckConfigs(cwd);
	if (configs.length === 0) {
		warnings.push(`no ${CHECK_CONFIG_NAME} found; the audit compared nothing`);
	}

	const findings: Finding[] = [];
	for (const configPath of configs) {
		const name = relative(cwd, configPath);
		try {
			findings.push(...relaxations(name, effectiveFlags(configPath), root));
		} catch (error) {
			findings.push({
				key: `unreadable:${name}`,
				message: `${name} could not be resolved (${(error as Error).message})`,
			});
		}
	}

	if (configs.length > 0) {
		warnings.push(
			`audited ${configs.length} check config(s) against ${SOUNDNESS_OPTIONS.length} soundness options`,
		);
	}

	return { findings, warnings };
}

runGate("tsconfigCheckFeatures", "tsconfig check features", evaluate());
