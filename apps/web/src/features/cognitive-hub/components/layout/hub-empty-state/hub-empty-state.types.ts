import type { DiscrepancyScenario } from "../../anomaly/discrepancy-scenario";
import type { DiscrepancyCommitStatus } from "../../anomaly/use-discrepancy-resolution.store";
import type { ResolvedHubEvent } from "../../hub-events.constants";

export interface HubEmptyStateProps {
	autonomyLevel: number;
	hasPendingApproval: boolean;
	isSwarmStreaming: boolean;
	isDiscrepancyComposerOpen: boolean;
	isSuggestionAccepted: boolean;
	discrepancyScenario: DiscrepancyScenario | null;
	discrepancyCommitStatus: DiscrepancyCommitStatus;
	undoSecondsLeft: number;
	showResolvedEvents: boolean;
	onAutonomyLevelChange: (level: number) => void;
	onReviewDiscrepancy: () => void;
	onCloseComposer: () => void;
	onAcceptSuggestion: () => void;
	onToggleResolvedEvents: () => void;
	onSelectResolvedEvent: (event: ResolvedHubEvent) => void;
	onRunQuickAction: (prompt: string) => void;
}
