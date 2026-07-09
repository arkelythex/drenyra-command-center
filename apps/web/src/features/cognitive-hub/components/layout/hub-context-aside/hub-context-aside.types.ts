import type { KnowledgeDocument } from "@/features/agent-swarm/hooks/useKnowledgeStore";
import type { AccountingSkill } from "@/features/agent-swarm/types/skills.types";

export type RunFilter = "ALL" | "AWAITING_APPROVAL" | "RUNNING" | "COMPLETED";

export interface HubContextAsideProps {
	showHistory: boolean;
	isSwarmStreaming: boolean;
	skills: AccountingSkill[];
	documents: KnowledgeDocument[];
	onInstallSkill: (skillId: string) => void;
}

export interface RunFilterOption {
	id: RunFilter;
	label: string;
	count: number;
}
