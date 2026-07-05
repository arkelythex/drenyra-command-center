import type { DrenyraProductSurface } from "./product-surfaces";

export const DRENYRA_PRODUCT_SURFACES: readonly DrenyraProductSurface[] = [
	{
		id: "drenyra",
		name: "DRENYRA Drenyra",
		status: "canonical-in-core",
		canonicalHome: "drenyra",
		summary: "Codex-like agentic command center for accounting and fiscal operations.",
		documentationRefs: [
			"docs/products/drenyra-agentic-fiscal-command-center-vision-2026.md",
			"docs/05-ai/agents-mvp.md",
			"docs/03-features/ai-agent/README.md",
			"docs/business/ecosystem-hierarchy.md",
		],
		modules: [
			{ kind: "app", path: "apps/web", role: "operator command-center UI surface" },
			{ kind: "app", path: "apps/api", role: "agentic workflow and approval APIs" },
			{ kind: "app", path: "apps/landing", role: "public Drenyra product narrative" },
			{ kind: "package", path: "packages/ai", role: "AI providers, tools, knowledge and OCR helpers" },
			{ kind: "doc", path: "docs/products/drenyra-agentic-fiscal-command-center-vision-2026.md", role: "canonical product vision" },
		],
	},
	{
		id: "ledger",
		name: "DRENYRA Ledger",
		status: "canonical-in-core",
		canonicalHome: "drenyra",
		summary: "Peru-first accounting and compliance control plane.",
		documentationRefs: [
			"docs/products/ledger.md",
			"docs/03-features/README.md",
			"docs/03-features/multi-ruc/README.md",
			"docs/03-features/agentic-ledger/README.md",
			"docs/SUNAT_CAPABILITIES_2026.md",
		],
		modules: [
			{
				kind: "app",
				path: "apps/api",
				role: "accounting/compliance backend surface",
			},
			{ kind: "app", path: "apps/web", role: "operator UI surface" },
			{
				kind: "feature",
				path: "apps/web/src/features/invoices",
				role: "invoice operations",
			},
			{
				kind: "feature",
				path: "apps/web/src/features/ledger",
				role: "ledger workflows",
			},
			{
				kind: "feature",
				path: "apps/web/src/features/taxation",
				role: "tax workflows",
			},
			{
				kind: "feature",
				path: "apps/web/src/features/reconciliations",
				role: "financial close and reconciliation",
			},
			{
				kind: "doc",
				path: "docs/products/ledger.md",
				role: "surface ownership map",
			},
		],
	},
	{
		id: "studio",
		name: "DRENYRA Studio",
		status: "canonical-in-core",
		canonicalHome: "drenyra",
		summary: "Multi-RUC practice-management surface for accounting firms.",
		documentationRefs: [
			"docs/products/studio.md",
			"docs/03-features/killer-features/README.md",
		],
		modules: [
			{ kind: "app", path: "apps/web", role: "firm operator UI surface" },
			{
				kind: "app",
				path: "apps/api",
				role: "portfolio and compliance services",
			},
			{
				kind: "feature",
				path: "apps/web/src/features/economic-groups",
				role: "group and portfolio management",
			},
			{
				kind: "feature",
				path: "apps/web/src/features/dashboard",
				role: "portfolio summary surface",
			},
			{
				kind: "doc",
				path: "docs/products/studio.md",
				role: "surface ownership map",
			},
		],
	},
	{
		id: "cortex",
		name: "DRENYRA Cortex",
		status: "canonical-in-core",
		canonicalHome: "drenyra",
		summary: "Intelligence and analytics layer on top of operational truth.",
		documentationRefs: [
			"docs/products/cortex.md",
			"docs/03-features/killer-features/README.md",
			"docs/business/financial-truth-infrastructure-thesis-2026.md",
		],
		modules: [
			{
				kind: "app",
				path: "apps/data-engine",
				role: "data processing and analytics runtime",
			},
			{
				kind: "app",
				path: "apps/api",
				role: "intelligence APIs and orchestration",
			},
			{
				kind: "feature",
				path: "apps/web/src/features/intelligence",
				role: "insight surface",
			},
			{
				kind: "feature",
				path: "apps/web/src/features/cashflow",
				role: "simulation and forecasting workflows",
			},
			{
				kind: "feature",
				path: "apps/web/src/features/reports",
				role: "reporting delivery surface",
			},
			{
				kind: "doc",
				path: "docs/products/cortex.md",
				role: "surface ownership map",
			},
		],
	},
	{
		id: "api",
		name: "DRENYRA API",
		status: "canonical-in-core",
		canonicalHome: "apps/api",
		summary: "Developer-facing public platform surface.",
		documentationRefs: [
			"docs/products/api.md",
			"docs/04-api/README.md",
			"docs/01-architecture/TECHNICAL-SPECIFICATION.md",
		],
		modules: [
			{ kind: "app", path: "apps/api", role: "canonical API runtime" },
			{
				kind: "package",
				path: "packages/application",
				role: "use-cases and service contracts",
			},
			{
				kind: "package",
				path: "packages/infrastructure",
				role: "integration implementations",
			},
			{
				kind: "doc",
				path: "docs/products/api.md",
				role: "surface ownership map",
			},
		],
	},
	{
		id: "gov",
		name: "DRENYRA Gov",
		status: "strategy-layer",
		canonicalHome: "docs/business",
		summary: "Strategic public-sector expansion layer.",
		documentationRefs: [
			"docs/products/gov.md",
			"docs/business/enterprise-public-private-strategy-2026.md",
			"docs/business/strategic-architecture-infrastructure-nacional.md",
		],
		modules: [
			{
				kind: "doc",
				path: "docs/business",
				role: "strategy and institutional narrative",
			},
			{
				kind: "doc",
				path: "docs/products/gov.md",
				role: "surface ownership map",
			},
		],
	},
	{
		id: "landing",
		name: "DRENYRA Landing",
		status: "canonical-in-core",
		canonicalHome: "apps/landing",
		summary: "Public ecosystem marketing and discovery surface.",
		documentationRefs: [
			"docs/products/landing.md",
			"docs/canon/workspace-topology-2026.md",
		],
		modules: [
			{ kind: "app", path: "apps/landing", role: "canonical landing runtime" },
			{
				kind: "doc",
				path: "docs/products/landing.md",
				role: "surface ownership map",
			},
		],
	},
	{
		id: "grid",
		name: "DRENYRA Grid",
		status: "separate-runtime",
		canonicalHome: "../drenyra-grid",
		summary: "Mobile/offline-first wedge into MYPE operations.",
		documentationRefs: [
			"docs/products/grid.md",
			"docs/03-features/README.md",
			"../drenyra-grid/README.md",
		],
		modules: [
			{
				kind: "doc",
				path: "docs/products/grid.md",
				role: "boundary rationale",
			},
		],
	},
] as const;

export function getDrenyraProductSurface(id: DrenyraProductSurface["id"]) {
	return DRENYRA_PRODUCT_SURFACES.find((surface) => surface.id === id);
}
