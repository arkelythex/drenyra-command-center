import type { UnifiedAgentEntry } from "../types";

export const AI_PIPELINE_AGENTS = [
	// ═══════════════════════════════════════════════
	// AI Pipeline (packages/ai/src/agents/)
	// ═══════════════════════════════════════════════
	{
		id: "reader-agent",
		name: "Reader Agent",
		system: "ai-pipeline" as const,
		tier: "tier3b" as const,
		parentId: null,
		maySpawn: [],
		isLeaf: true,
		capabilities: ["reading", "ocr", "document-processing"] as const,
		approvalClass: "not-required" as const,
		supportedSurfaces: ["api", "batch"] as const,
		drenyraSubagent: null,
		description:
			"OCR multi-modal reader for invoice documents — Gemini Flash instance",
		sourcePath: "packages/ai/src/agents/agents/reader.agent.ts",
	},
	{
		id: "parser-agent",
		name: "Parser Agent",
		system: "ai-pipeline" as const,
		tier: "tier3b" as const,
		parentId: null,
		maySpawn: [],
		isLeaf: true,
		capabilities: ["parsing", "xml-parsing", "document-processing"] as const,
		approvalClass: "not-required" as const,
		supportedSurfaces: ["api", "batch"] as const,
		drenyraSubagent: null,
		description: "XML UBL 2.0/2.1 parser and validator — Gemini Flash instance",
		sourcePath: "packages/ai/src/agents/agents/parser.agent.ts",
	},
	{
		id: "validator-agent",
		name: "Validator Agent",
		system: "ai-pipeline" as const,
		tier: "tier3b" as const,
		parentId: null,
		maySpawn: [],
		isLeaf: true,
		capabilities: [
			"validation",
			"sunat-validation",
			"compliance-audit",
		] as const,
		approvalClass: "not-required" as const,
		supportedSurfaces: ["api", "batch"] as const,
		drenyraSubagent: null,
		description:
			"SUNAT 2026 compliance validator and XML generator — Grok adapter",
		sourcePath: "packages/ai/src/agents/agents/validator.agent.ts",
	},
	{
		id: "arbitrator-agent",
		name: "Arbitrator Agent",
		system: "ai-pipeline" as const,
		tier: "tier3b" as const,
		parentId: null,
		maySpawn: [],
		isLeaf: true,
		capabilities: ["arbitration", "knowledge-retrieval", "validation"] as const,
		approvalClass: "supervisor" as const,
		supportedSurfaces: ["api", "batch"] as const,
		drenyraSubagent: null,
		description:
			"Multi-agent debate arbitration and conflict resolution — Gemini Pro",
		sourcePath: "packages/ai/src/agents/agents/arbitrator.agent.ts",
	},
] as const satisfies readonly UnifiedAgentEntry[];
