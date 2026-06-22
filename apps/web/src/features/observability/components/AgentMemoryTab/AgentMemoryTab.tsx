/**
 * AgentMemoryTab — Main orchestrator for agent memory summary and timeline.
 *
 * Sections:
 *  A. AgentMemoryCard — glass card with formatted summary + recentRuns
 *  B. AgentMemoryList — vertical timeline of past MemoryEntry items
 */

"use client";

import { getCompanyId } from "@/lib/api";
import { useMemoryProfile, useMemoryHistory } from "../../hooks/useObservability";
import { AgentMemoryCard } from "./components/AgentMemoryCard";
import { AgentMemoryList, AgentMemoryListError } from "./components/AgentMemoryList";

export function AgentMemoryTab() {
  const companyId = getCompanyId();

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useMemoryProfile(companyId);

  const {
    data: history,
    isLoading: historyLoading,
  } = useMemoryHistory(companyId);

  if (profileError) {
    return <AgentMemoryListError onRetry={() => refetchProfile()} />;
  }

  return (
    <div className="space-y-6">
      {/* A. Memory Summary Card */}
      <section aria-label="Memory Summary">
        <AgentMemoryCard
          summary={profile?.summary ?? null}
          recentRuns={profile?.recentRuns ?? 0}
          isLoading={profileLoading}
        />
      </section>

      {/* B. Memory Timeline */}
      <section aria-label="Memory Timeline">
        <AgentMemoryList
          entries={history ?? []}
          isLoading={historyLoading}
        />
      </section>
    </div>
  );
}
