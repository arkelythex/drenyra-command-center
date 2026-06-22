/**
 * RecentEventsTable — auto-refreshing events table for recent agent latency events.
 */

"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMs, timeAgo } from "./helpers";
import type { LatencyRecentEvent } from "../../types";

function RecentEventsTable({ events }: { events: LatencyRecentEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
        <Activity className="h-8 w-8 text-[var(--text-tertiary)]" />
        <p className="text-sm text-[var(--text-secondary)]">
          No recent events
        </p>
        <p className="text-2xs text-[var(--text-tertiary)]">
          Latency events will appear here as agents process requests.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Time
            </th>
            <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Agent
            </th>
            <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Model
            </th>
            <th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Latency
            </th>
            <th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <motion.tr
              key={event.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-2)]/50"
            >
              <td className="px-4 py-3">
                <span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
                  {timeAgo(event.createdAt)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {event.agentType}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-2xs text-[var(--text-tertiary)]">
                  {event.modelUsed}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono tabular-nums text-xs font-semibold text-[var(--text-primary)]">
                  {formatMs(event.latencyMs)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider",
                    event.status === "success"
                      ? "border-[var(--color-success)]/25 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                      : "border-[var(--color-danger)]/25 bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
                  )}
                >
                  {event.status}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { RecentEventsTable };
