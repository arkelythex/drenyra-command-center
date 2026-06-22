"use client";

import { n } from "@/lib/utils";
import type { JournalEntry } from "@/stores/central-board-store";
import {
  CheckCircle2,
  XCircle,
  Bot,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft,
} from "lucide-react";

export interface EntryCardProps {
  entry: JournalEntry;
  isExpanded: boolean;
  isApproving: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function EntryCard({
  entry,
  isExpanded,
  isApproving,
  onToggle,
  onApprove,
  onReject,
}: EntryCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] transition-all hover:border-[var(--border-default)]">
      <div className="flex items-start justify-between gap-4 p-4">
        <button
          onClick={onToggle}
          className="mt-0.5 shrink-0 rounded p-0.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Bot size={12} />
            <span>Agente propuso</span>
            <span>·</span>
            <span className="font-mono">{entry.date}</span>
          </div>
          <p className="text-xs font-medium leading-relaxed text-[var(--text-primary)]">
            {entry.glosa}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-2xs font-bold text-[var(--text-secondary)]">
              CTA {entry.cuenta}
            </span>
            <span className="font-mono text-xs font-bold tabular-nums text-[var(--text-primary)]">
              Debe: {n(entry.debe)}
            </span>
            <span className="font-mono text-xs font-bold tabular-nums text-[var(--text-primary)]">
              Haber: {n(entry.haber)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onApprove}
            disabled={isApproving}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 px-3 py-1.5 text-xs font-medium text-[var(--color-success)] transition-colors hover:bg-[var(--color-success)]/10 disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            {isApproving ? "Aprobando…" : "Approve"}
          </button>
          <button
            onClick={onReject}
            disabled={isApproving}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10 disabled:opacity-50"
          >
            <XCircle size={14} />
            Reject
          </button>
        </div>
      </div>

      {/* Expandable diff preview */}
      {isExpanded && (
        <div className="border-t border-[var(--border-subtle)] px-4 py-3">
          <div className="mb-3 flex items-center gap-2">
            <ArrowRightLeft size={13} className="text-[var(--text-tertiary)]" />
            <span className="text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Partida doble - Efecto contable
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-2 text-xs">
            <span className="text-2xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Cuenta
            </span>
            <span />
            <span className="text-2xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Monto
            </span>

            <span className="flex items-center gap-1.5 font-mono text-[var(--text-primary)]">
              <span className="inline-flex items-center gap-1 rounded bg-[var(--color-success)]/10 px-1.5 py-0.5 text-2xs font-bold uppercase text-[var(--color-success)]">
                Debe
              </span>
              {entry.cuenta}
            </span>
            <span className="text-[var(--text-tertiary)]">→</span>
            <span className="font-mono font-bold tabular-nums text-[var(--color-success)]">
              +{n(entry.debe)}
            </span>

            <span className="flex items-center gap-1.5 font-mono text-[var(--text-primary)]">
              <span className="inline-flex items-center gap-1 rounded bg-[var(--color-danger)]/10 px-1.5 py-0.5 text-2xs font-bold uppercase text-[var(--color-danger)]">
                Haber
              </span>
              {entry.cuenta}
            </span>
            <span className="text-[var(--text-tertiary)]">→</span>
            <span className="font-mono font-bold tabular-nums text-[var(--color-danger)]">
              +{n(entry.haber)}
            </span>
          </div>

          <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2">
            <p className="text-2xs text-[var(--text-tertiary)]">
              <span className="font-semibold text-[var(--text-secondary)]">
                Impacto:
              </span>{" "}
              Este asiento{" "}
              {entry.debe > 0 ? "debita" : "acredita"} la cuenta{" "}
              <span className="font-mono font-bold text-[var(--text-primary)]">
                {entry.cuenta}
              </span>{" "}
              por{" "}
              <span className="font-mono font-bold tabular-nums text-[var(--text-primary)]">
                {n(entry.debe || entry.haber)}
              </span>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
