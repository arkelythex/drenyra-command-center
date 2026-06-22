import React from 'react';
import { useCognitiveHub } from '../hooks/useCognitiveHub';
import { useHubState } from '../hooks/useHubState';
import { useHubSwarm } from '../api/useHubSwarm';
import { subscribeCognitiveWorkspaceActions } from '../workspace-events';
import type { ResolvedHubEvent } from './hub-events.constants';

// Modularized Hooks
import { useDiscrepancyFlow } from '../hooks/useDiscrepancyFlow';
import { useMissionOrchestrator } from '../hooks/useMissionOrchestrator';

const HubChatStage = React.lazy(() =>
  import('./layout/hub-chat-stage').then((m) => ({ default: m.HubChatStage })),
);
const HubRightRailContainer = React.lazy(() =>
  import('./layout/hub-right-rail-container').then((m) => ({ default: m.HubRightRailContainer })),
);

import { HubRadarAside } from './layout/hub-radar-aside';

export const HubLayout = () => {
  // 1. Store/Global Hooks
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

  const {
    showHistory,
    toggleHistory,
    density,
    activeArtifact,
    setActiveArtifact,
  } = useHubState();

  const { isStreaming: isSwarmStreaming } = useHubSwarm();

  // 2. Component Local State
  const [autonomyLevel, setAutonomyLevel] = React.useState(4);
  const [showResolvedEvents, setShowResolvedEvents] = React.useState(false);
  const [isCommandPaletteActive, setIsCommandPaletteActive] = React.useState(false);

  // 3. Modularized Logic Hooks
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

  // 4. Shared Handlers
  const handleSelectResolvedEvent = (event: ResolvedHubEvent) => {
    setActiveArtifact({
      id: event.id,
      type: 'explanation',
      title: `Detalle de Proceso: ${event.agent}`,
      content: event.reason,
      metadata: {
        agent: event.agent,
        timestamp: new Date().toISOString(),
      },
    });
  };

  // 5. Lifecycle & Events
  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() !== 'b') return;
      event.preventDefault();
      toggleHistory();
    };

    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [toggleHistory]);

  React.useEffect(
    () =>
      subscribeCognitiveWorkspaceActions((action) => {
        if (action === 'start-mission') {
          handleStartMission();
        }
      }),
    [handleStartMission],
  );

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-transparent text-[var(--text-primary)]">
      <div className="ui-agent-panel relative flex min-w-0 flex-1 overflow-hidden">
        <React.Suspense fallback={<HubChatSkeleton density={density} />}>
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
            onToggleResolvedEvents={() => setShowResolvedEvents((prev) => !prev)}
            onSelectResolvedEvent={handleSelectResolvedEvent}
            onApprovePendingTool={approvePendingTool}
            onDenyPendingTool={denyPendingTool}
            onClearTimeline={clearTimeline}
            onSend={sendMessage}
            onCommandModeChange={setIsCommandPaletteActive}
          />
        </React.Suspense>
      </div>

      <HubRadarAside onAction={sendMessage} />

      {showHistory ? (
        <React.Suspense fallback={<HubRightRailSkeleton />}>
          <div className="absolute inset-y-0 right-0 z-40 flex shadow-2xl xl:static xl:shadow-none">
            <HubRightRailContainer
              activeArtifact={activeArtifact}
              showHistory={showHistory}
              isSwarmStreaming={isSwarmStreaming}
              onCloseArtifact={() => setActiveArtifact(null)}
            />
          </div>
        </React.Suspense>
      ) : null}
    </div>
  );
};

const HubChatSkeleton = ({ density }: { density: 'compact' | 'normal' }) => (
  <div
    className={
      density === 'compact'
        ? 'space-y-4 p-6'
        : 'space-y-6 p-8'
    }
  >
    <div className="h-16 rounded-xl bg-[var(--surface-hover)]" />
    <div className="h-24 rounded-xl bg-[var(--surface-hover)]" />
    <div className="h-20 rounded-xl bg-[var(--surface-hover)]" />
  </div>
);

const HubRightRailSkeleton = () => (
  <aside className="ui-agent-history-panel hidden w-[340px] shrink-0 border-l border-[var(--border-subtle)] bg-[var(--surface-1)] xl:flex">
  </aside>
);
