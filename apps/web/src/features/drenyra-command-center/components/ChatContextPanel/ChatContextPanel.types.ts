import type { FiscalCaseDetails } from "../../api/drenyra-command-center.api";
import type { HubArtifact } from "@/features/cognitive-hub/types/hub.types";

export type ChatContext = "idle" | "streaming" | "artifact" | "case";

export interface ChatContextPanelProps {
	context: ChatContext;
	activeArtifact?: HubArtifact | null;
	caseDetails?: FiscalCaseDetails | null;
	pendingApprovalsCount: number;
	isStreaming: boolean;
	pinnedArtifacts: HubArtifact[];
}
