#!/usr/bin/env bun
/// <reference types="node" />

/**
 * architecture:score-module-extraction — a package that declares a public surface must
 * be consumed through it.
 *
 * Extraction is only real when the boundary is enforced. A package with an `exports` map
 * is making a promise about what other workspaces may import; reaching into
 * `@drenyra/domain/src/feos/approval` instead of the promised subpath couples the caller
 * to internal file layout, so moving one file breaks a package that never owned it.
 *
 * For every workspace that declares `exports`, this gate compares the specifiers other
 * workspaces actually import against the ones the manifest allows, and prints an
 * extraction score per package (`allowed / total external references`). Packages without
 * an `exports` map make no promise yet, so they are reported as a warning instead of a
 * violation — the fix there is to declare a surface, not to rename imports.
 *
 * Uso: bun scripts/architecture/score-module-extraction.ts [--update]
 * Plan: odd/tasks/architecture-enforcement-pack.md
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
	type Finding,
	type GateOutcome,
	readWorkspacePackages,
	runGate,
} from "./rules.ts";

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"];
const SKIP_DIRS = new Set([
	"node_modules",
	"dist",
	"build",
	"coverage",
	".turbo",
]);
const IMPORT_PATTERN =
	/(?:from\s*|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g;

type ExportsMap = Record<string, unknown> | string | undefined;

interface Surface {
	name: string;
	dir: string;
	/** Literal specifiers the manifest promises, e.g. `@drenyra/ai/provider`. */
	allowed: Set<string>;
	/** Prefixes from wildcard exports, e.g. `@drenyra/ai/`. */
	wildcards: string[];
}

function readExports(dir: string): ExportsMap {
	const manifest = JSON.parse(
		readFileSync(join(dir, "package.json"), "utf8"),
	) as { exports?: ExportsMap };
	return manifest.exports;
}

function buildSurface(name: string, dir: string): Surface | null {
	const exportsMap = readExports(dir);
	if (!exportsMap || typeof exportsMap === "string") return null;

	const allowed = new Set<string>();
	const wildcards: string[] = [];

	for (const key of Object.keys(exportsMap)) {
		if (key === ".") {
			allowed.add(name);
			continue;
		}
		const subpath = key.replace(/^\./, "");
		if (subpath.includes("*")) {
			wildcards.push(`${name}${subpath.slice(0, subpath.indexOf("*"))}`);
			continue;
		}
		allowed.add(`${name}${subpath}`);
	}

	return { name, dir, allowed, wildcards };
}

function sourceFiles(dir: string, found: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		if (SKIP_DIRS.has(entry)) continue;
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			sourceFiles(full, found);
			continue;
		}
		if (SOURCE_EXTENSIONS.some((extension) => entry.endsWith(extension))) {
			found.push(full);
		}
	}
	return found;
}

function importSpecifiers(file: string): string[] {
	const source = readFileSync(file, "utf8");
	return [...source.matchAll(IMPORT_PATTERN)].map((match) => match[1]);
}

function isAllowed(surface: Surface, specifier: string): boolean {
	if (surface.allowed.has(specifier)) return true;
	return surface.wildcards.some((prefix) => specifier.startsWith(prefix));
}

function ownerOf(surfaces: Surface[], specifier: string): Surface | undefined {
	return surfaces.find(
		(surface) =>
			specifier === surface.name || specifier.startsWith(`${surface.name}/`),
	);
}

interface Collection {
	findings: Finding[];
	references: Map<string, number>;
	violations: Map<string, number>;
}

function bump(counter: Map<string, number>, key: string): void {
	counter.set(key, (counter.get(key) ?? 0) + 1);
}

function collectFromFile(
	collection: Collection,
	from: string,
	file: string,
	surfaces: Surface[],
	cwd: string,
): void {
	const relFile = relative(cwd, file);

	for (const specifier of importSpecifiers(file)) {
		const target = ownerOf(surfaces, specifier);
		if (!target || target.name === from) continue;

		bump(collection.references, target.name);
		if (isAllowed(target, specifier)) continue;

		bump(collection.violations, target.name);
		collection.findings.push({
			key: `deep:${from}:${specifier}:${relFile}`,
			message: `${relFile} imports ${specifier}, which ${target.name} does not export`,
		});
	}
}

function collect(
	packages: { name: string; dir: string }[],
	surfaces: Surface[],
	cwd: string,
): Collection {
	const collection: Collection = {
		findings: [],
		references: new Map(),
		violations: new Map(),
	};

	for (const workspace of packages) {
		for (const file of sourceFiles(join(cwd, workspace.dir))) {
			collectFromFile(collection, workspace.name, file, surfaces, cwd);
		}
	}

	return collection;
}

function printScores(surfaces: Surface[], collection: Collection): void {
	const scored = surfaces
		.map((surface) => {
			const total = collection.references.get(surface.name) ?? 0;
			const bad = collection.violations.get(surface.name) ?? 0;
			return {
				name: surface.name,
				total,
				bad,
				score: total === 0 ? 1 : (total - bad) / total,
			};
		})
		.filter((entry) => entry.total > 0)
		.sort((a, b) => a.score - b.score);

	for (const entry of scored) {
		console.log(
			`  ${entry.score.toFixed(3)}  ${entry.name} (${entry.total - entry.bad}/${entry.total})`,
		);
	}
}

function evaluate(): GateOutcome {
	const cwd = process.cwd();
	const warnings: string[] = [];
	const packages = readWorkspacePackages(cwd);

	const surfaces: Surface[] = [];
	for (const workspace of packages) {
		const surface = buildSurface(workspace.name, join(cwd, workspace.dir));
		if (surface) surfaces.push(surface);
		else
			warnings.push(
				`${workspace.name} declares no "exports" map; its public surface is undefined`,
			);
	}

	const collection = collect(packages, surfaces, cwd);
	printScores(surfaces, collection);

	return { findings: collection.findings, warnings };
}

runGate("moduleExtraction", "module extraction", evaluate());
