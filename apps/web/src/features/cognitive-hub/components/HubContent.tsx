import React from "react";
import { useHubSwarm } from "../api/useHubSwarm";
import { useCognitiveHub } from "../hooks/useCognitiveHub";
import { useDiscrepancyFlow } from "../hooks/useDiscrepancyFlow";
import { useHubState } from "../hooks/useHubState";
import { useMissionOrchestrator } from "../hooks/useMissionOrchestrator";
import { subscribeCognitiveWorkspaceActions } from "../workspace-events";
import type { ResolvedHubEvent } from "./hub-events.constants";

const HubChatStage = React.lazy(() =>
	import("./layout/hub-chat-stage").then((m) => ({ default: m.HubChatStage })),
);

/**
 * HubContent: Chat stage del Cognitive Hub, diseñado para renderizarse
 * DENTRO de CodexShell (sin RadarAside ni RightRail propios).
 *
 * CodexShell ya provee Sidebar + RightPanel, así que HubContent
 * solo renderiza el chat principal y sus overlays de comandos.
 */
export const HubContent = () => {
	const {
		messages,
		sendMessage,
		isSwarmActive,
		pendingApproval,
		approvePendingTool,
		denyPendingTool,
		activityTimeline,
		runId,
		clearTimeline,
	} = useCognitiveHub();

	const { density, activeArtifact, setActiveArtifact } = useHubState();

	const { isStreaming: isSwarmStreaming } = useHubSwarm();

	const [autonomyLevel, setAutonomyLevel] = React.useState(4);
	const [showResolvedEvents, setShowResolvedEvents] = React.useState(false);
	const [isCommandPaletteActive, setIsCommandPaletteActive] =
		React.useState(false);

	const {
		isDiscrepancyComposerOpen,
		setIsDiscrepancyComposerOpen,
		undoSecondsLeft,
		status: discrepancyStatus,
		scenario: discrepancyScenario,
		isApplied: isSuggestionAccepted,
		handleReview: handleReviewDiscrepancy,
		handleAcceptSuggestion: handleAcceptDiscrepancySuggestion,
	} = useDiscrepancyFlow(runId, activeArtifact, setActiveArtifact);

	const { handleStartMission } = useMissionOrchestrator(autonomyLevel);

	const handleSelectResolvedEvent = (event: ResolvedHubEvent) => {
		setActiveArtifact({
			id: event.id,
			type: "explanation",
			title: `Detalle de Proceso: ${event.agent}`,
			content: event.reason,
			metadata: {
				agent: event.agent,
				timestamp: new Date().toISOString(),
			},
		});
	};

	React.useEffect(
		() =>
			subscribeCognitiveWorkspaceActions((action) => {
				if (action === "start-mission") {
					handleStartMission();
				}
			}),
		[handleStartMission],
	);

	return (
		<div className="flex h-full w-full overflow-hidden bg-transparent text-[var(--text-primary)]">
			<div className="relative flex min-w-0 flex-1 overflow-hidden">
				<React.Suspense
					fallback={
						<div
							className={
								density === "compact" ? "space-y-4 p-6" : "space-y-6 p-8"
							}
						>
							<div className="h-16 rounded-xl bg-[var(--surface-hover)]" />
							<div className="h-24 rounded-xl bg-[var(--surface-hover)]" />
							<div className="h-20 rounded-xl bg-[var(--surface-hover)]" />
						</div>
					}
				>
					<HubChatStage
						messages={messages}
						density={density}
						autonomyLevel={autonomyLevel}
						hasPendingApproval={Boolean(pendingApproval)}
						isSwarmStreaming={isSwarmStreaming}
						isDiscrepancyComposerOpen={isDiscrepancyComposerOpen}
						isSuggestionAccepted={isSuggestionAccepted}
						discrepancyScenario={discrepancyScenario}
						discrepancyCommitStatus={discrepancyStatus}
						undoSecondsLeft={undoSecondsLeft}
						showResolvedEvents={showResolvedEvents}
						isCommandPaletteActive={isCommandPaletteActive}
						pendingApproval={pendingApproval}
						activityTimeline={activityTimeline}
						activeRunId={runId}
						isSwarmActive={isSwarmActive}
						onAutonomyLevelChange={setAutonomyLevel}
						onReviewDiscrepancy={handleReviewDiscrepancy}
						onCloseComposer={() => setIsDiscrepancyComposerOpen(false)}
						onAcceptSuggestion={handleAcceptDiscrepancySuggestion}
						onToggleResolvedEvents={() =>
							setShowResolvedEvents((prev) => !prev)
						}
						onSelectResolvedEvent={handleSelectResolvedEvent}
						onApprovePendingTool={approvePendingTool}
						onDenyPendingTool={denyPendingTool}
						onClearTimeline={clearTimeline}
						onSend={sendMessage}
						onCommandModeChange={setIsCommandPaletteActive}
					/>
				</React.Suspense>
			</div>
		</div>
	);
};
