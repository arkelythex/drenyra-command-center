#!/usr/bin/env bun
/// <reference types="node" />

/**
 * Shared architecture rules for the `architecture:*` gates.
 *
 * One reviewable place declares the layering; every gate reads it from here so
 * a rule can never drift between scripts. Adding a workspace package without
 * declaring its rank is itself a failure — silence is not a default.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Higher rank = closer to the outside world. A package may only depend downward. */
export type LayerRank = 1 | 2 | 3 | 4;

export const LAYER_NAMES: Record<LayerRank, string> = {
	1: "domain",
	2: "application",
	3: "adapter",
	4: "app",
};

/**
 * Declared rank per workspace package.
 * Sourced from AGENTS.md: "packages/domain must stay framework-free",
 * "packages/application depends on domain", "adapters belong in
 * persistence/infrastructure/ai packages".
 */
export const PACKAGE_RANKS: Record<string, LayerRank> = {
	// 1 — domain: pure rules, no I/O, no framework.
	"@drenyra/domain": 1,
	"@drenyra/fiscal-agent-domain": 1,
	"@drenyra/fiscal-compliance-pipeline": 1,
	"@drenyra/fiscal-fsd": 1,
	"@drenyra/memory": 1,
	"@drenyra/mission-domain": 1,
	"@drenyra/mission-protocol": 1,
	"@drenyra/orchestrator": 1,
	"@drenyra/phase-gatekeeper": 1,
	"@drenyra/security": 1,
	"@drenyra/shared": 1,
	"@drenyra/skill-sire-filing": 1,
	"@drenyra/ui": 1,
	"@drenyra/workspace-domain": 1,

	// 2 — application: use cases orchestrating domain, still framework-free.
	"@drenyra/application": 2,
	"@drenyra/fiscal-approval": 2,
	"@drenyra/fiscal-query-engine": 2,
	"@drenyra/mission-client": 2,
	"@drenyra/workspace-application": 2,
	"@drenyra/workspace-contracts": 2,
	"@drenyra/workspace-control": 2,
	"@drenyra/workspace-layout": 2,
	"@drenyra/workspace-projections": 2,

	// 3 — adapters: persistence, infrastructure, AI, runtime hosting, test doubles.
	"@drenyra/agent-runtime": 3,
	"@drenyra/ai": 3,
	"@drenyra/infrastructure": 3,
	"@drenyra/persistence": 3,
	"@drenyra/test-utils": 3,

	// 4 — deployables.
	"@drenyra/api": 4,
	"@drenyra/web": 4,
};

/** Packages allowed to import a delivery/persistence framework despite a low rank. */
export const FRAMEWORK_EXEMPT_PACKAGES = new Set<string>([
	"@drenyra/ui", // presentational component library: React is its medium
]);

/** Framework modules that must never leak into domain or application layers. */
export const FORBIDDEN_FRAMEWORK_MODULES = [
	"elysia",
	"hono",
	"fastify",
	"express",
	"koa",
	"react",
	"react-dom",
	"drizzle-orm",
	"drizzle-kit",
	"next",
	"@tanstack/react-router",
	"@tanstack/react-query",
	"pg",
	"postgres",
] as const;

export interface WorkspacePackage {
	name: string;
	/** Repository-relative directory, e.g. `packages/domain`. */
	dir: string;
	rank: LayerRank | null;
	/** Every `@drenyra/*` dependency, dependencies + devDependencies + peerDependencies. */
	drenyraDeps: string[];
	/** All declared dependencies merged. */
	allDeps: Record<string, string>;
}

const WORKSPACE_ROOTS = ["packages", "apps"] as const;

function readJson<T>(path: string): T {
	return JSON.parse(readFileSync(path, "utf8")) as T;
}

interface RawManifest {
	name?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
}

function readPackage(
	group: string,
	dirName: string,
	cwd: string,
): WorkspacePackage | null {
	const manifestPath = join(resolve(cwd, group), dirName, "package.json");
	if (!existsSync(manifestPath)) return null;

	const manifest = readJson<RawManifest>(manifestPath);
	if (!manifest.name) return null;

	const allDeps: Record<string, string> = {
		...(manifest.peerDependencies ?? {}),
		...(manifest.devDependencies ?? {}),
		...(manifest.dependencies ?? {}),
	};

	return {
		name: manifest.name,
		dir: `${group}/${dirName}`,
		rank: PACKAGE_RANKS[manifest.name] ?? null,
		drenyraDeps: Object.keys(allDeps)
			.filter((dep) => dep.startsWith("@drenyra/"))
			.sort(),
		allDeps,
	};
}

/** Every workspace package, read from `<root>/<group>/<dir>/package.json`. */
export function readWorkspacePackages(
	cwd: string = process.cwd(),
): WorkspacePackage[] {
	const packages: WorkspacePackage[] = [];

	for (const group of WORKSPACE_ROOTS) {
		const groupDir = resolve(cwd, group);
		if (!existsSync(groupDir)) continue;

		for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const pkg = readPackage(group, entry.name, cwd);
			if (pkg) packages.push(pkg);
		}
	}

	return packages.sort((a, b) => a.name.localeCompare(b.name));
}

/** Adjacency list restricted to workspace packages. */
export function buildGraph(
	packages: WorkspacePackage[],
): Map<string, string[]> {
	const known = new Set(packages.map((pkg) => pkg.name));
	const graph = new Map<string, string[]>();

	for (const pkg of packages) {
		graph.set(
			pkg.name,
			pkg.drenyraDeps.filter((dep) => known.has(dep)),
		);
	}

	return graph;
}

/** Strongly-connected components that form a cycle, each returned once. */
export function findCycles(graph: Map<string, string[]>): string[][] {
	const cycles: string[][] = [];
	const state = new Map<string, "visiting" | "done">();
	const stack: string[] = [];
	const seen = new Set<string>();

	const walk = (node: string): void => {
		if (state.get(node) === "done") return;
		if (state.get(node) === "visiting") {
			const start = stack.indexOf(node);
			const cycle = stack.slice(start);
			const key = [...cycle].sort().join(" -> ");
			if (!seen.has(key)) {
				seen.add(key);
				cycles.push(cycle);
			}
			return;
		}

		state.set(node, "visiting");
		stack.push(node);
		for (const dep of graph.get(node) ?? []) walk(dep);
		stack.pop();
		state.set(node, "done");
	};

	for (const node of graph.keys()) walk(node);
	return cycles;
}

/** A single violation with a stable key, so it can be tracked or baselined. */
export interface Finding {
	/** Stable identity of the violation. Must not embed counts or timings. */
	key: string;
	message: string;
}

export interface GateOutcome {
	findings: Finding[];
	warnings: string[];
}

export const BASELINE_PATH = ".ci/architecture-baseline.json";

type BaselineShape = Record<string, string[]>;

function readBaseline(cwd: string): BaselineShape {
	const path = resolve(cwd, BASELINE_PATH);
	if (!existsSync(path)) return {};
	return readJson<BaselineShape>(path);
}

function writeBaseline(cwd: string, baseline: BaselineShape): void {
	const path = resolve(cwd, BASELINE_PATH);
	const ordered = Object.fromEntries(
		Object.keys(baseline)
			.sort()
			.map((gate) => [gate, [...baseline[gate]].sort()]),
	);
	Bun.write(path, `${JSON.stringify(ordered, null, "\t")}\n`);
}

/**
 * Reports a gate result against the committed architecture baseline.
 *
 * Findings present in the baseline are tracked debt and reported as warnings.
 * Findings absent from it are regressions and fail the gate. `--update`
 * rewrites the baseline for this gate, which is how debt is recorded or
 * retired deliberately.
 */
export function runGate(
	gateKey: string,
	title: string,
	outcome: GateOutcome,
): never {
	const tag = `[architecture:${title}]`;
	const cwd = process.cwd();
	const update = process.argv.includes("--update");
	const baseline = readBaseline(cwd);
	const known = new Set(baseline[gateKey] ?? []);

	const fresh = outcome.findings.filter((finding) => !known.has(finding.key));
	const tracked = outcome.findings.filter((finding) => known.has(finding.key));

	for (const warning of outcome.warnings)
		console.warn(`${tag} warning: ${warning}`);

	if (update) {
		baseline[gateKey] = outcome.findings.map((finding) => finding.key);
		writeBaseline(cwd, baseline);
		console.log(
			`${tag} baseline updated: ${outcome.findings.length} tracked finding(s) in ${BASELINE_PATH}`,
		);
		process.exit(0);
	}

	const stale = [...known].filter(
		(key) => !outcome.findings.some((finding) => finding.key === key),
	);
	if (stale.length > 0) {
		console.warn(
			`${tag} warning: ${stale.length} baseline entr${stale.length === 1 ? "y is" : "ies are"} no longer reproduced. Run with --update to retire them.`,
		);
	}

	if (tracked.length > 0) {
		console.warn(
			`${tag} ${tracked.length} known violation(s) tracked in ${BASELINE_PATH}`,
		);
	}

	if (fresh.length === 0) {
		console.log(`${tag} passed`);
		process.exit(0);
	}

	console.error(`${tag} FAILED — ${fresh.length} new violation(s)`);
	for (const finding of fresh) console.error(`  - ${finding.message}`);
	process.exit(1);
}
