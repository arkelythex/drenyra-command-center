export type DiffStatus = "pending" | "approved" | "rejected" | "info_requested";

export const DIFF_STATUSES: readonly DiffStatus[] = [
	"pending",
	"approved",
	"rejected",
	"info_requested",
] as const;
