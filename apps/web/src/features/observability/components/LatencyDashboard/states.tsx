/**
 * LatencyDashboard — loading skeleton and error state components.
 */

"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MetricCardSkeleton } from "./MetricCard";

// ─── Loading State ───────────────────────────────────────────────────────────

function LatencyDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card variant="glass" padding="lg" className="lg:col-span-1">
          <CardHeader className="mb-2">
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full rounded-md" />
            ))}
          </CardContent>
        </Card>
        <Card variant="glass" padding="lg" className="lg:col-span-2">
          <CardHeader className="mb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="p-0">
            <Skeleton className="h-[220px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Table skeleton */}
      <Card variant="glass" padding="none">
        <CardHeader className="px-4 pt-4 pb-2">
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent className="p-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-none border-b border-[var(--border-subtle)]" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────

function LatencyErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-10 text-center">
      <AlertTriangle className="h-8 w-8 text-[var(--color-danger)]" />
      <div>
        <p className="text-sm font-medium text-[var(--color-danger)]">
          Failed to load latency metrics
        </p>
        <p className="mt-1 text-2xs text-[var(--text-tertiary)]">
          Ensure the AI Control Plane API is reachable.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  );
}

export { LatencyDashboardSkeleton, LatencyErrorState };
