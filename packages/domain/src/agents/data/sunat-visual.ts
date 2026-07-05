import type { UnifiedAgentEntry } from "../types";

export const SUNAT_VISUAL_AGENTS = [
	// ═══════════════════════════════════════════════
	// SUNAT Visual Fallback (apps/api/src/features/cpe-validator/)
	// ═══════════════════════════════════════════════
	{
		id: "sunat-visual-fallback",
		name: "SUNAT Visual Fallback Subagent",
		system: "sunat-visual" as const,
		tier: "tier3b" as const,
		parentId: null,
		maySpawn: [],
		isLeaf: true,
		capabilities: ["visual-analysis", "sunat-validation"] as const,
		approvalClass: "supervisor" as const,
		supportedSurfaces: ["api", "automation"] as const,
		drenyraSubagent: null,
		description:
			"SUNAT visual fallback for CPE validation when primary SUNAT OSE is unreachable",
		sourcePath:
			"apps/api/src/features/cpe-validator/application/fallback/sunat-visual-subagent.ts",
	},
] as const satisfies readonly UnifiedAgentEntry[];
