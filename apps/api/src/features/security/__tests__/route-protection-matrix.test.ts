import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
	APP_CORE_MOUNTED_SURFACE_EXPORTS,
	PUBLIC_ROUTE_SURFACE_IDS,
	ROUTE_PROTECTION_MATRIX,
} from "../route-protection-matrix";

const repoRoot = resolve(__dirname, "../../../../../..");
const appCoreSource = readFileSync(
	resolve(repoRoot, "apps/api/src/app-core.ts"),
	"utf8",
);
const routeMatrixDoc = readFileSync(
	resolve(repoRoot, "docs/04-api/hardening/route-protection-matrix.md"),
	"utf8",
);

function extractMountedSurfaceExports(source: string): string[] {
	const directUseNames = Array.from(
		source.matchAll(/\.use\(\s*([A-Za-z_$][\w$]*)/g),
	).map((match) => match[1]);
	const conditionalUseNames = source.includes(
		"ledgerMvpEnabled ? ledgerMvpModule",
	)
		? ["ledgerMvpModule"]
		: [];

	return [...new Set([...directUseNames, ...conditionalUseNames])]
		.filter((name) => !["cors", "swagger", "helmet", "ledgerMvpEnabled", "metricsMiddleware", "apiModules", "backwardCompatRedirects"].includes(name))
		.sort();
}

describe("route protection matrix", () => {
	// TODO: Update mounted surface exports after cleanup — list is stale
	it("covers every mounted app-core surface", () => {
		expect(APP_CORE_MOUNTED_SURFACE_EXPORTS).toEqual(
			extractMountedSurfaceExports(appCoreSource),
		);

		const matrixExports = ROUTE_PROTECTION_MATRIX.map(
			(row) => row.appCoreExportName,
		).sort();

		expect(matrixExports).toEqual(APP_CORE_MOUNTED_SURFACE_EXPORTS);
	});

	it("documents every mounted runtime surface and prefix", () => {
		for (const row of ROUTE_PROTECTION_MATRIX) {
			expect(routeMatrixDoc).toContain(`| ${row.surface}`);
			expect(routeMatrixDoc).toContain(`\`${row.prefix}\``);
			expect(routeMatrixDoc).toContain(`\`${row.authMode}\``);
			expect(routeMatrixDoc).toContain(`\`${row.tenantSource}\``);
		}
	});

	it("keeps protected routes from silently using no tenant source", () => {
		const publicSurfaceIds = new Set(PUBLIC_ROUTE_SURFACE_IDS);
		const unsafeProtectedRows = ROUTE_PROTECTION_MATRIX.filter(
			(row) => !publicSurfaceIds.has(row.id) && row.tenantSource === "none",
		);

		expect(unsafeProtectedRows).toEqual([]);
	});
});
