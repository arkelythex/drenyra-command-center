/**
 * AgentMemoryTimelineEntry — Single entry in the memory timeline.
 *
 * Renders a vertical dot + connector line, a WorkflowStateBadge, the memory
 * summary text, and a formatted timestamp. Animated on mount via framer-motion.
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DOT_COLORS, WORKFLOW_COLORS, timeAgo, formatDate } from "../AgentMemoryTab.data";
import type { MemoryEntry } from "../AgentMemoryTab.types";

// ─── Workflow State Badge ────────────────────────────────────────────────────

export function WorkflowStateBadge({ state }: { state: string }) {
  const colorClass = WORKFLOW_COLORS[state] ?? "bg-[var(--surface-3)]/50 text-[var(--text-tertiary)] border-[var(--border-subtle)]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider",
        colorClass,
      )}
    >
      {state}
    </span>
  );
}

// ─── Entry Component ─────────────────────────────────────────────────────────

export interface AgentMemoryTimelineEntryProps {
  entry: MemoryEntry;
  index: number;
}

export function AgentMemoryTimelineEntry({ entry, index }: AgentMemoryTimelineEntryProps) {
  const dotColor = DOT_COLORS[entry.workflowState] ?? "bg-[var(--text-tertiary)]";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
      className="relative flex gap-4"
    >
      {/* Timeline dot & line */}
      <div className="flex shrink-0 flex-col items-center">
        <div
          className={cn(
            "z-10 h-3 w-3 rounded-full ring-2 ring-[var(--surface-1)]",
            dotColor,
          )}
        />
        {/* Vertical connector line — hidden for last item via CSS */}
        <div className="mt-0.5 h-full w-px bg-[var(--border-subtle)]" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/40 p-3 transition-colors hover:bg-[var(--surface-2)]/30">
          <div className="mb-2 flex items-center justify-between gap-2">
            <WorkflowStateBadge state={entry.workflowState} />
            <span className="shrink-0 font-mono tabular-nums text-2xs text-[var(--text-tertiary)]">
              {timeAgo(entry.completedAt || entry.startedAt)}
            </span>
          </div>
          <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
            {entry.memorySummary}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-2xs text-[var(--text-tertiary)]">
              {formatDate(entry.startedAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
