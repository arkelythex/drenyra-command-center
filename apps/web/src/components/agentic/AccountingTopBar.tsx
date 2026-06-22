"use client";

import { useState, useRef, useEffect } from "react";
import { useAccountingStore } from "@/stores/accounting-store";
import { Play, Download, Clock } from "lucide-react";

interface AccountingTopBarProps {
  onRunSwarm?: () => void;
}

export function AccountingTopBar({ onRunSwarm }: AccountingTopBarProps) {
  const companies = useAccountingStore((s) => s.companies);
  const activeCompanyId = useAccountingStore((s) => s.activeCompanyId);
  const periods = useAccountingStore((s) => s.periods);
  const activePeriodId = useAccountingStore((s) => s.activePeriodId);
  const proposedEntries = useAccountingStore((s) => s.proposedEntries);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeCompany = companies.find((c) => c.id === activeCompanyId);
  const activePeriod = periods.find((p) => p.id === activePeriodId);

  const pendingCount = proposedEntries.filter(
    (e) => e.status === "pending" || e.status === "reviewing",
  ).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex h-14 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/80 px-4 backdrop-blur-sm">
      {/* Left: Company · Period */}
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
        <span>{activeCompany?.name ?? "Empresa"}</span>
        <span className="text-[var(--text-muted)]">·</span>
        <span className="text-[var(--text-secondary)]">
          {activePeriod?.label ?? "Período"}
        </span>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-2">
        {/* Pending count badge (only if > 0) */}
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 px-3 py-1.5 text-xs font-medium text-[var(--color-warning)]">
            <Clock size={13} />
            {pendingCount}
          </span>
        )}

        {/* Run Swarm */}
        <button
          onClick={onRunSwarm}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
        >
          <Play size={13} className="text-[var(--color-primary)]" />
          Run Swarm
        </button>

        {/* Export with dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
          >
            <Download size={13} />
            Export
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-lg">
              <div className="p-1">
                <button
                  onClick={() => setShowExportMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
                >
                  PDF
                </button>
                <button
                  onClick={() => setShowExportMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
                >
                  Excel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
