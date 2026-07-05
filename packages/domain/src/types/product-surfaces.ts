/** Canonical product surfaces (renamed from flux/firma/forge → ledger/studio/cortex). */
export type DrenyraSurfaceId =
	| "drenyra"
	| "ledger"
	| "studio"
	| "cortex"
	| "api"
	| "gov"
	| "landing"
	| "grid";

export interface DrenyraSurfaceModuleRef {
  kind: 'app' | 'package' | 'feature' | 'doc';
  path: string;
  role: string;
}

export interface DrenyraProductSurface {
  id: DrenyraSurfaceId;
  name: string;
  status: 'canonical-in-core' | 'separate-runtime' | 'strategy-layer';
  canonicalHome: string;
  summary: string;
  modules: DrenyraSurfaceModuleRef[];
  documentationRefs: readonly string[];
}
