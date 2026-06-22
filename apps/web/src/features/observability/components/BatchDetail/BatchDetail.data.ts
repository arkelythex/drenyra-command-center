import type { BatchItemStatus } from "../../types";

export type ItemStatusBadgeStyle = { color: string; label: string };

export const ITEM_STATUS_BADGE: Record<BatchItemStatus, ItemStatusBadgeStyle> = {
  pending: {
    color: "bg-[var(--surface-3)]/50 text-[var(--text-tertiary)] border-[var(--border-subtle)]",
    label: "Pending",
  },
  running: {
    color: "bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/25",
    label: "Running",
  },
  completed: {
    color: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/25",
    label: "Completed",
  },
  failed: {
    color: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/25",
    label: "Failed",
  },
};
