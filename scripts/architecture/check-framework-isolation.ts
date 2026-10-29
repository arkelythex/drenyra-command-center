#!/usr/bin/env bun
/// <reference types="node" />

/**
 * Keeps domain and application layers free of delivery and persistence
 * frameworks. Checks both the declared manifest and the actual import sites,
 * because a transitive import can appear without a direct dependency.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import {
	type Finding,
	FORBIDDEN_FRAMEWORK_MODULES,
	FRAMEWORK_EXEMPT_PACKAGES,
	LAYER_NAMES,
	readWorkspacePackages,
	runGate,
} from "./rules.ts";

const PURE_RANKS = new Set([1, 2]);
const SOURCE_EXTENSIONS = new Set([
	".ts",
	".tsx",
	".js",
	".jsx",
	".mts",
	".cts",
]);
const SKIPPED_DIRECTORIES = new Set([
	"node_modules",
	"dist",
	"build",
	"coverage",
	".turbo",
]);

const IMPORT_PATTERN =
	/(?:from\s*|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g;

function isForbidden(specifier: string): boolean {
	return FORBIDDEN_FRAMEWORK_MODULES.some(
		(module) => specifier === module || specifier.startsWith(`${module}/`),
	);
}

function collectSourceFiles(dir: string): string[] {
	const files: string[] = [];
	const walk = (current: string): void => {
		let entries: string[];
		try {
			entries = readdirSync(current);
		} catch {
			return;
		}
		for (const entry of entries) {
			if (SKIPPED_DIRECTORIES.has(entry)) continue;
			const full = join(current, entry);
			if (statSync(full).isDirectory()) walk(full);
			else if (SOURCE_EXTENSIONS.has(extname(entry))) files.push(full);
		}
	};
	walk(dir);
	return files;
}

const packages = readWorkspacePackages();
const findings: Finding[] = [];
const warnings: string[] = [];
let scannedFiles = 0;

for (const pkg of packages) {
	if (pkg.rank === null || !PURE_RANKS.has(pkg.rank)) continue;
	if (FRAMEWORK_EXEMPT_PACKAGES.has(pkg.name)) continue;

	for (const [dep, version] of Object.entries(pkg.allDeps)) {
		if (!isForbidden(dep)) continue;
		findings.push({
			key: `manifest:${pkg.name}:${dep}`,
			message: `${pkg.name} (${LAYER_NAMES[pkg.rank]}) declares the framework dependency "${dep}@${version}".`,
		});
	}

	for (const file of collectSourceFiles(resolve(pkg.dir, "src"))) {
		scannedFiles += 1;
		const contents = readFileSync(file, "utf8");
		const relative = file.replace(`${process.cwd()}/`, "");

		for (const match of contents.matchAll(IMPORT_PATTERN)) {
			const specifier = match[1];
			if (!isForbidden(specifier)) continue;
			const line = contents.slice(0, match.index ?? 0).split("\n").length;
			findings.push({
				key: `import:${relative}:${specifier}`,
				message: `${relative}:${line} imports "${specifier}" from a ${LAYER_NAMES[pkg.rank]} layer.`,
			});
		}
	}
}

if (scannedFiles === 0) {
	warnings.push("no source files were scanned; the gate would pass vacuously");
}

runGate("frameworkIsolation", "check-framework-isolation", {
	findings,
	warnings,
});
