/**
 * Product Surface Registry — canonical list of ARKELYTHEX product surfaces.
 *
 * Each surface represents a distinct product surface area with its own
 * documentation, modules, and lifecycle status.
 */

import type { DrenyraProductSurface } from "./product-surfaces";

export const ARKELYTHEX_PRODUCT_SURFACES: DrenyraProductSurface[] = [
	{
		id: "drenyra",
		name: "ARKELYTHEX Drenyra",
		summary: "Fiscal intelligence platform",
		status: "canonical-in-core",
		canonicalHome: "/drenyra",
		documentationRefs: ["docs/drenyra"],
		modules: [
			{ kind: "app", path: "apps/web", role: "Web application" },
			{ kind: "app", path: "apps/api", role: "REST API" },
		],
	},
	{
		id: "ledger",
		name: "ARKELYTHEX Ledger",
		summary: "Double-entry accounting engine",
		status: "canonical-in-core",
		canonicalHome: "/ledger",
		documentationRefs: ["docs/ledger"],
		modules: [
			{ kind: "package", path: "packages/domain", role: "Domain logic" },
		],
	},
	{
		id: "studio",
		name: "ARKELYTHEX Studio",
		summary: "Automation and workflow studio",
		status: "strategy-layer",
		canonicalHome: "/studio",
		documentationRefs: ["docs/studio"],
		modules: [
			{
				kind: "feature",
				path: "apps/api/src/features/automation-studio",
				role: "Automation API",
			},
		],
	},
	{
		id: "cortex",
		name: "ARKELYTHEX Cortex",
		summary: "AI agent orchestration layer",
		status: "canonical-in-core",
		canonicalHome: "/cortex",
		documentationRefs: ["docs/cortex"],
		modules: [{ kind: "package", path: "packages/ai", role: "AI services" }],
	},
	{
		id: "api",
		name: "ARKELYTHEX API",
		summary: "Public API marketplace",
		status: "strategy-layer",
		canonicalHome: "/api-marketplace",
		documentationRefs: ["docs/api"],
		modules: [
			{
				kind: "feature",
				path: "apps/api/src/features/api-marketplace",
				role: "API marketplace",
			},
		],
	},
	{
		id: "gov",
		name: "ARKELYTHEX Gov",
		summary: "Fiscal governance and compliance",
		status: "strategy-layer",
		canonicalHome: "/gov",
		documentationRefs: ["docs/gov"],
		modules: [
			{ kind: "doc", path: "docs/compliance", role: "Compliance docs" },
		],
	},
	{
		id: "grid",
		name: "ARKELYTHEX Grid",
		summary: "Distributed data processing grid",
		status: "separate-runtime",
		canonicalHome: "/grid",
		documentationRefs: ["docs/grid"],
		modules: [
			{ kind: "app", path: "apps/data-engine", role: "Python data engine" },
		],
	},
];

export function getDrenyraProductSurface(
	id: DrenyraProductSurface["id"],
): DrenyraProductSurface | undefined {
	return ARKELYTHEX_PRODUCT_SURFACES.find((s) => s.id === id);
}
