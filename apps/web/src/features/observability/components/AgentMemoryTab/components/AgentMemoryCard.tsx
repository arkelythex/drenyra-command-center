/**
 * AgentMemoryCard — Memory Summary glass card.
 *
 * Displays the agent's compiled memory profile (free-text summary) plus a
 * recent-runs counter. Handles loading skeleton and empty/absent states.
 */

"use client";

import { Brain, Clock, Database } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <Card variant="glass" padding="lg">
      <CardHeader className="mb-3">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );
}

// ─── Empty State (no summary yet) ────────────────────────────────────────────

function CardEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)]/20 px-4 py-8 text-center">
      <Database className="h-8 w-8 text-[var(--text-tertiary)]" />
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          No memory context yet
        </p>
        <p className="mt-1 text-2xs text-[var(--text-tertiary)]">
          Memory summaries are generated after the first successful agent run completes.
        </p>
      </div>
    </div>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────────

function CardBody({
  summary,
  recentRuns,
}: {
  summary: string;
  recentRuns: number;
}) {
  return (
    <>
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/40 p-4">
        <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text-primary)]">
          {summary}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
        <span className="text-xs text-[var(--text-secondary)]">
          <span className="font-semibold tabular-nums text-[var(--text-primary)]">{recentRuns}</span>{" "}
          {recentRuns === 1 ? "recent run" : "recent runs"} contributing to context
        </span>
      </div>
    </>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface AgentMemoryCardProps {
  summary: string | null;
  recentRuns: number;
  isLoading: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AgentMemoryCard({ summary, recentRuns, isLoading }: AgentMemoryCardProps) {
  if (isLoading) return <CardSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card variant="glass" padding="lg">
        <CardHeader className="mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[var(--color-info)]" />
            <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
              Memory Summary
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {summary ? (
            <CardBody summary={summary} recentRuns={recentRuns} />
          ) : (
            <CardEmpty />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
