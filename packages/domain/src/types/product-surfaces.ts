/** Canonical product surfaces (renamed from flux/firma/forge → ledger/studio/cortex). */
export type ArkelythexSurfaceId =
	| "drenyra"
	| "ledger"
	| "studio"
	| "cortex"
	| "api"
	| "gov"
	| "landing"
	| "grid";

export interface ArkelythexSurfaceModuleRef {
  kind: 'app' | 'package' | 'feature' | 'doc';
  path: string;
  role: string;
}

export interface ArkelythexProductSurface {
  id: ArkelythexSurfaceId;
  name: string;
  status: 'canonical-in-core' | 'separate-runtime' | 'strategy-layer';
  canonicalHome: string;
  summary: string;
  modules: ArkelythexSurfaceModuleRef[];
  documentationRefs: readonly string[];
}
