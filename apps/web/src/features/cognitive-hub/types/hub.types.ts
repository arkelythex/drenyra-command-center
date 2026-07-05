import type { AgentEvent } from "@drenyra/shared";

// Re-export shared types
export type {
	BackgroundMission,
	HubViewMode,
	SwarmStep,
	SwarmTrace,
} from "@drenyra/shared/agents";
export type {
	AccountingDiffItem,
	ArtifactType,
	AuditEvent,
	ComparisonScenario,
	GapItem,
	HubArtifact,
	LedgerEntry,
	SearchResult,
	SheetDiffRow,
} from "@drenyra/shared/artifacts";
export type { CognitiveMessage } from "@drenyra/shared/messaging";
