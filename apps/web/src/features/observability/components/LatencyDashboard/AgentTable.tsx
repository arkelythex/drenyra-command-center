/**
 * AgentTable — sortable per-agent latency breakdown table.
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { formatMs } from "./helpers";
import type { LatencySummary } from "../../types";

// ─── Types ───────────────────────────────────────────────────────────────────

type SortField = "agentType" | "avgLatencyMs" | "p95LatencyMs" | "callCount";
type SortDir = "asc" | "desc";

// ─── Sortable Header ─────────────────────────────────────────────────────────

function SortHeader({
  field,
  label,
  sortField,
  sortDir,
  onToggle,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onToggle: (field: SortField) => void;
}) {
  const isActive = sortField === field;
  return (
    <th
      className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors"
      onClick={() => onToggle(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive &&
          (sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          ))}
      </span>
    </th>
  );
}

// ─── Agent Table ─────────────────────────────────────────────────────────────

function AgentTable({ summary }: { summary: LatencySummary }) {
  const [sortField, setSortField] = useState<SortField>("avgLatencyMs");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField],
  );

  const sorted = useMemo(() => {
    const agents = summary.byAgent ?? [];
    return [...agents].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = typeof aVal === "string"
        ? (aVal as string).localeCompare(bVal as string)
        : (aVal as number) - (bVal as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [summary.byAgent, sortField, sortDir]);

  const maxCallCount = useMemo(
    () => Math.max(...(summary.byAgent ?? []).map((a) => a.callCount), 1),
    [summary.byAgent],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <Activity className="h-6 w-6 text-[var(--text-tertiary)]" />
        <p className="text-xs text-[var(--text-secondary)]">No agent data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <SortHeader field="agentType" label="Agent" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader field="avgLatencyMs" label="Avg" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader field="p95LatencyMs" label="P95" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader field="callCount" label="Calls" sortField={sortField} sortDir={sortDir} onToggle={toggleSort} />
            <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Usage
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((agent) => (
            <motion.tr
              key={agent.agentType}
              layout
              className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-2)]/50"
            >
              <td className="px-4 py-3">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {agent.agentType}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
                  {formatMs(agent.avgLatencyMs)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
                  {formatMs(agent.p95LatencyMs)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
                  {agent.callCount}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-full max-w-[80px] rounded-full bg-[var(--surface-3)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[var(--color-info)]"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(agent.callCount / maxCallCount) * 100}%`,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="font-mono tabular-nums text-2xs text-[var(--text-tertiary)]">
                    {maxCallCount > 0
                      ? Math.round((agent.callCount / maxCallCount) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { AgentTable };
