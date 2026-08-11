/**
 * Product surface type definitions for ARKELYTHEX platform.
 */

export type DrenyraProductSurfaceId =
	| "drenyra"
	| "ledger"
	| "studio"
	| "cortex"
	| "api"
	| "gov"
	| "grid";

export type SurfaceStatus =
	| "canonical-in-core"
	| "strategy-layer"
	| "separate-runtime";

export type ModuleKind = "app" | "package" | "feature" | "doc" | "doc-gen";

export interface ProductModule {
	kind: ModuleKind;
	path: string;
	role: string;
}

export interface DrenyraProductSurface {
	id: DrenyraProductSurfaceId;
	name: string;
	summary: string;
	status: SurfaceStatus;
	canonicalHome: string;
	documentationRefs: string[];
	modules: ProductModule[];
}
