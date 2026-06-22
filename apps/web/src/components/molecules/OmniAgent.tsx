import { useEffect, type FC } from 'react';
import { useArtifactEvents } from '@/context/ArtifactEventContext';
import { PLACEHOLDERS } from './omni-agent/constants';
import { EmbeddedOmniAgent } from './omni-agent/embedded-omni-agent';
import { FloatingOmniAgent } from './omni-agent/floating-omni-agent';
import { useOmniLogic } from './omni-agent/useOmniLogic';
import { listArtifactGovernanceEvents } from '@/features/artifacts/api/artifact-governance-audit.api';

interface OmniAgentProps {
  embedded?: boolean;
}

export const OmniAgent: FC<OmniAgentProps> = ({ embedded = false }) => {
  const { activeTraceId, artifactEvents, clearArtifactEvents, syncArtifactEvents } = useArtifactEvents();
  const logic = useOmniLogic();

  useEffect(() => {
    if (!embedded) return;

    let cancelled = false;
    const fetchEvents = async () => {
      try {
        const persistedEvents = await listArtifactGovernanceEvents({
          limit: 25,
          traceId: activeTraceId ?? undefined,
        });
        if (!cancelled && persistedEvents.length > 0) {
          syncArtifactEvents(persistedEvents);
        }
      } catch {
        // Silent fallback: stream keeps local events when audit endpoint is unavailable.
      }
    };

    void fetchEvents();
    const intervalId = window.setInterval(() => {
      void fetchEvents();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeTraceId, embedded, syncArtifactEvents]);

  if (!logic.open && !embedded) {
    return null;
  }

  const submit = () => {
    if (!logic.query.trim()) {
      return;
    }
    void logic.handleAction();
  };

  if (embedded) {
    return (
      <EmbeddedOmniAgent
        activeTraceId={activeTraceId}
        artifactEvents={artifactEvents}
        clearArtifactEvents={clearArtifactEvents}
        cot={logic.cot}
        ghostCompletion={logic.ghostCompletion}
        ghostSuggestion={logic.ghostSuggestion}
        inputRef={logic.inputRef}
        isThinking={logic.isThinking}
        onSubmit={submit}
        query={logic.query}
        setQuery={logic.setQuery}
      />
    );
  }

  return (
    <FloatingOmniAgent
      activeTraceId={activeTraceId}
      cot={logic.cot}
      filteredList={logic.filteredList}
      ghostCompletion={logic.ghostCompletion}
      ghostSuggestion={logic.ghostSuggestion}
      handleVoice={logic.handleVoice}
      inputRef={logic.inputRef}
      isThinking={logic.isThinking}
      mode={logic.mode}
      navigateToItem={logic.navigateToItem}
      onSubmit={submit}
      placeholder={PLACEHOLDERS[logic.placeholderIndex]}
      query={logic.query}
      scrollContainerRef={logic.scrollContainerRef}
      selectedIndex={logic.selectedIndex}
      setQuery={logic.setQuery}
      toggleActions={logic.toggleActions}
    />
  );
};
