/** Background/border styles per risk level for the risk badge. */
export const RISK_BG: Record<string, string> = {
	LOW: "bg-[var(--color-success)]/8 border-[var(--color-success)]/20",
	MEDIUM: "bg-[var(--color-warning)]/8 border-[var(--color-warning)]/20",
	HIGH: "bg-[var(--color-danger)]/8 border-[var(--color-danger)]/20",
	CRITICAL: "bg-[var(--color-danger)]/12 border-[var(--color-danger)]/30",
};
