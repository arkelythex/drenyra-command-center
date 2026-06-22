"use client";

/**
 * Artifact panel components extracted from RightPanel.
 *
 * Renders pinned artifact list and artifact preview content.
 */

import { useMemo, Suspense } from "react";
import { Pin, PinOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArtifactRenderer } from "@/features/cognitive-hub/components/artifacts/ArtifactRenderer";
import { useArtifactStore } from "@/stores/artifact-store";

// ─── Artifact tab (full pinned list + preview) ────────────────────────────────

/**
 * Full artifact tab with pinned artifact list and active artifact preview.
 */
export function ArtifactTab() {
  const pinnedArtifacts = useArtifactStore((s) => s.pinnedArtifacts);
  const activeArtifactId = useArtifactStore((s) => s.activeArtifactId);
  const unpinArtifact = useArtifactStore((s) => s.unpinArtifact);
  const setActiveArtifactId = useArtifactStore((s) => s.setActiveArtifactId);

  const activePinnedArtifact = useMemo(
    () => pinnedArtifacts.find((p) => p.id === activeArtifactId) ?? null,
    [pinnedArtifacts, activeArtifactId],
  );

  return (
    <Suspense fallback={<div className="flex-1" />}>
      <div className="flex h-full flex-col">
        {/* Pinned artifacts header */}
        {pinnedArtifacts.length > 0 && (
          <div className="flex items-center gap-1.5 border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/50 px-3 py-2">
            <Pin size={12} className="text-[var(--color-primary)]" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Pinned ({pinnedArtifacts.length})
            </span>
          </div>
        )}

        {/* Pinned artifact list */}
        {pinnedArtifacts.length > 0 && (
          <div className="border-b border-[var(--border-subtle)]">
            {pinnedArtifacts.map((pa) => (
              <button
                key={pa.id}
                onClick={() => setActiveArtifactId(pa.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                  "hover:bg-[var(--surface-hover)]",
                  activeArtifactId === pa.id &&
                    "bg-[var(--color-primary)]/5 border-l-2 border-[var(--color-primary)]",
                  activeArtifactId !== pa.id && "border-l-2 border-transparent",
                )}
              >
                <div className="flex-1 min-w-0">
                  <span className="block truncate font-medium text-[var(--text-primary)]">
                    {pa.title}
                  </span>
                  <span className="block text-3xs text-[var(--text-muted)] mt-0.5">
                    {pa.type}
                  </span>
                </div>
                <button
                  aria-label="Unpin"
                  onClick={(e) => {
                    e.stopPropagation();
                    unpinArtifact(pa.id);
                    if (activeArtifactId === pa.id) {
                      setActiveArtifactId(null);
                    }
                  }}
                  className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
                  title="Unpin"
                >
                  <X size={10} />
                </button>
              </button>
            ))}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {pinnedArtifacts.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center px-6">
              <PinOff size={28} className="text-[var(--text-muted)] mb-3" />
              <p className="text-sm text-[var(--text-muted)]">
                No pinned artifacts
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Pin artifacts from the chat to preview them here
              </p>
            </div>
          )}

          {activePinnedArtifact && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--surface-3)] px-2 py-0.5 text-3xs font-medium text-[var(--text-muted)]">
                    {activePinnedArtifact.type}
                  </span>
                </div>
                <span className="text-3xs text-[var(--text-muted)]">
                  {activePinnedArtifact.title}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
                <ArtifactRenderer artifact={activePinnedArtifact} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
}

// ─── Context panel (compact artifact preview) ─────────────────────────────────

/**
 * Compact context panel for the right sidebar.
 * Shows the currently active pinned artifact's preview.
 */
export function ContextPanel() {
  const activeArtifactId = useArtifactStore((s) => s.activeArtifactId);
  const pinnedArtifacts = useArtifactStore((s) => s.pinnedArtifacts);

  if (pinnedArtifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <PinOff size={28} className="text-[var(--text-muted)] mb-3" />
        <p className="text-sm text-[var(--text-muted)]">No pinned artifacts</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Pin artifacts from the chat to preview them here
        </p>
      </div>
    );
  }

  if (!activeArtifactId) return null;

  const artifact = pinnedArtifacts.find((p) => p.id === activeArtifactId);
  if (!artifact) return null;

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-[var(--surface-3)] px-2 py-0.5 text-3xs font-medium text-[var(--text-muted)]">
          {artifact.type}
        </span>
        <span className="text-3xs text-[var(--text-muted)]">{artifact.title}</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--color-primary)]" />
            </div>
          }
        >
          <ArtifactRenderer artifact={artifact} />
        </Suspense>
      </div>
    </div>
  );
}
