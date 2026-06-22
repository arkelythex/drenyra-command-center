import type { RunStatus, RunSummary } from "../../types";

// ─── Badge Constants ──────────────────────────────────────────────────────────

export const STATUS_BADGE_COLORS: Record<RunStatus, string> = {
  running:
    "bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/25",
  completed:
    "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/25",
  failed:
    "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/25",
  manual_review:
    "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/25",
  degraded:
    "bg-[var(--surface-3)]/50 text-[var(--text-tertiary)] border-[var(--border-subtle)]",
};

export const STATUS_BADGE_LABEL: Record<RunStatus, string> = {
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  manual_review: "Review",
  degraded: "Degraded",
};

// ─── Donut Chart Constants ────────────────────────────────────────────────────

export const DONUT_COLORS: Record<string, string> = {
  running: "var(--info, #3b82f6)",
  completed: "var(--success, #22c55e)",
  failed: "var(--danger, #ef4444)",
  manual_review: "var(--warning, #f59e0b)",
};

export const DONUT_SEGMENT_ORDER: Array<{
  key: keyof RunSummary;
  label: string;
  color: string;
}> = [
  { key: "completed", label: "Completed", color: DONUT_COLORS.completed },
  { key: "running", label: "Running", color: DONUT_COLORS.running },
  { key: "failed", label: "Failed", color: DONUT_COLORS.failed },
  {
    key: "manualReview",
    label: "Manual Review",
    color: DONUT_COLORS.manual_review,
  },
];

export const DONUT_SIZE = 180;
export const DONUT_STROKE = 20;
export const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function timeAgo(date: string | null): string {
  if (!date) return "-";
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function truncateId(id: string, len = 12): string {
  if (id.length <= len) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
