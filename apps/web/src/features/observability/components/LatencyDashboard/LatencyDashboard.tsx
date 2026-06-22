/**
 * LatencyDashboard — AI agent latency monitoring panel.
 *
 * Sections:
 *  A. Latency Metrics Cards (6 cards + stagger animation)
 *  B. Percentile Bars (inline SVG horizontal bar chart)
 *  C. Agent Breakdown Table (sortable per-agent stats)
 *  D. Trend Chart (inline SVG line chart)
 *  E. Recent Events Feed (auto-refreshing events table)
 */

"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useLatencySummary,
  useLatencyTrend,
  useLatencyRecent,
} from "../../hooks/useObservability";
import { MetricsCards } from "./MetricCard";
import { PercentileBars } from "./PercentileBars";
import { AgentTable } from "./AgentTable";
import { TrendChart } from "./TrendChart";
import { RecentEventsTable } from "./RecentEventsTable";
import { LatencyDashboardSkeleton, LatencyErrorState } from "./states";

export function LatencyDashboard() {
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useLatencySummary();
  const {
    data: trend,
    isLoading: trendLoading,
  } = useLatencyTrend();
  const {
    data: recentEvents,
    isLoading: eventsLoading,
  } = useLatencyRecent();

  // Global loading state (summary is the critical data)
  if (summaryLoading) {
    return <LatencyDashboardSkeleton />;
  }

  if (summaryError || !summary) {
    return <LatencyErrorState onRetry={() => refetchSummary()} />;
  }

  return (
    <div className="space-y-6">
      {/* A. Latency Metrics Cards */}
      <section aria-label="Latency Metrics">
        <MetricsCards summary={summary} />
      </section>

      {/* B. Percentile Bars + C. Agent Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section aria-label="Percentile Distribution" className="lg:col-span-1">
          <Card variant="glass" padding="lg" className="h-full">
            <CardHeader className="mb-3">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                Percentile Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PercentileBars summary={summary} />
            </CardContent>
          </Card>
        </section>

        <section aria-label="Agent Breakdown" className="lg:col-span-2">
          <Card variant="glass" padding="none" className="h-full">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                Agent Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AgentTable summary={summary} />
            </CardContent>
          </Card>
        </section>
      </div>

      {/* D. Trend Chart */}
      <section aria-label="Latency Trend">
        <Card variant="glass" padding="lg">
          <CardHeader className="mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                Latency Trend (Daily)
              </CardTitle>
              {trendLoading && (
                <span className="text-2xs text-[var(--text-tertiary)]">Loading…</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {trend && trend.length > 0 ? (
              <TrendChart data={trend} />
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <TrendingUp className="h-8 w-8 text-[var(--text-tertiary)]" />
                <p className="text-xs text-[var(--text-secondary)]">
                  No trend data available yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* E. Recent Events Feed */}
      <section aria-label="Recent Events">
        <Card variant="glass" padding="none">
          <CardHeader className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                Recent Events
              </CardTitle>
              {eventsLoading && (
                <span className="text-2xs text-[var(--text-tertiary)]">Refreshing…</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <RecentEventsTable events={recentEvents ?? []} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
