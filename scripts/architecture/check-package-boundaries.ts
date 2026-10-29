#!/usr/bin/env bun
/// <reference types="node" />

/**
 * Enforces the declared dependency direction between workspace packages.
 *
 * A package may depend on a package of the same or a lower rank, never a higher
 * one. Cycles are rejected. Apps depending on apps is allowed but reported,
 * because `apps/web` imports `@drenyra/api` only for end-to-end types.
 */

import {
	buildGraph,
	type Finding,
	findCycles,
	LAYER_NAMES,
	PACKAGE_RANKS,
	readWorkspacePackages,
	runGate,
} from "./rules.ts";

const packages = readWorkspacePackages();
const graph = buildGraph(packages);
const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
const findings: Finding[] = [];
const warnings: string[] = [];

for (const pkg of packages) {
	if (pkg.rank !== null) continue;
	findings.push({
		key: `undeclared:${pkg.name}`,
		message: `${pkg.name} (${pkg.dir}) has no declared layer rank. Add it to PACKAGE_RANKS in scripts/architecture/rules.ts.`,
	});
}

for (const pkg of packages) {
	if (pkg.rank === null) continue;

	for (const dep of graph.get(pkg.name) ?? []) {
		const target = byName.get(dep);
		if (!target || target.rank === null) continue;

		if (target.rank > pkg.rank) {
			findings.push({
				key: `${pkg.name}->${dep}`,
				message: `${pkg.name} (${LAYER_NAMES[pkg.rank]}) must not depend on ${dep} (${LAYER_NAMES[target.rank]}): a package may only depend downward.`,
			});
			continue;
		}

		if (target.rank === 4) {
			warnings.push(
				`${pkg.name} depends on the deployable ${dep}; keep it type-only if it is not a runtime dependency.`,
			);
		}
	}
}

for (const cycle of findCycles(graph)) {
	findings.push({
		key: `cycle:${[...cycle].sort().join("|")}`,
		message: `dependency cycle: ${cycle.join(" -> ")} -> ${cycle[0]}`,
	});
}

for (const name of Object.keys(PACKAGE_RANKS)) {
	if (byName.has(name)) continue;
	findings.push({
		key: `stale:${name}`,
		message: `PACKAGE_RANKS declares ${name}, which is not a workspace package. Remove it so the map cannot rot.`,
	});
}

runGate("packageBoundaries", "check-package-boundaries", {
	findings,
	warnings,
});
