/**
 * Constants and helpers for AgentMemoryTab.
 */

export const WORKFLOW_COLORS: Record<string, string> = {
  EXTRACTING: "bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/25",
  PARSING: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/25",
  VALIDATING: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/25",
  ARBITRATING: "bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/25",
  COMPLETED: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/25",
  FAILED: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/25",
};

export const DOT_COLORS: Record<string, string> = {
  EXTRACTING: "bg-[var(--color-info)]",
  PARSING: "bg-[var(--color-warning)]",
  VALIDATING: "bg-[var(--color-warning)]",
  ARBITRATING: "bg-[var(--color-info)]",
  COMPLETED: "bg-[var(--color-success)]",
  FAILED: "bg-[var(--color-danger)]",
};

export function timeAgo(date: string | null): string {
  if (!date) return "-";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(date: string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
