export interface InvoiceOseTimelineTone {
	containerClassName: string;
	statusBadgeClassName: string;
	railClassName: string;
	dotClassName: string;
}

export function getInvoiceOseTimelineTone(
	status?: string | null,
): InvoiceOseTimelineTone {
	const normalized = status?.trim().toUpperCase();

	switch (normalized) {
		case "ACCEPTED":
		case "SUCCESS":
			return {
				containerClassName:
					"border-[rgba(var(--premium-success-rgb),0.18)] bg-[rgba(var(--premium-success-rgb),0.06)]",
				statusBadgeClassName:
					"border-[rgba(var(--premium-success-rgb),0.24)] bg-[rgba(var(--premium-success-rgb),0.10)] text-[var(--premium-success)]",
				railClassName: "bg-[rgba(var(--premium-success-rgb),0.18)]",
				dotClassName:
					"border-[rgba(var(--premium-success-rgb),0.24)] bg-[rgba(var(--premium-success-rgb),0.24)]",
			};
		case "SUBMITTED":
		case "PROCESSING":
			return {
containerClassName: "border-[var(--color-info)]/20 bg-[var(--color-info)]/8",
			statusBadgeClassName:
				"border-[var(--color-info)]/20 bg-[var(--color-info)]/10 text-[var(--color-info)]",
			railClassName: "bg-[var(--color-info)]/20",
			dotClassName: "border-[var(--color-info)]/30 bg-[var(--color-info)]/30",
			};
		case "OBSERVED":
			return {
				containerClassName: "border-yellow-500/20 bg-yellow-500/8",
				statusBadgeClassName:
					"border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
				railClassName: "bg-yellow-500/20",
				dotClassName: "border-yellow-500/30 bg-yellow-500/30",
			};
		case "REJECTED":
		case "FAILED":
		case "ERROR":
			return {
				containerClassName: "border-destructive/20 bg-destructive/6",
				statusBadgeClassName:
					"border-destructive/20 bg-destructive/10 text-destructive",
				railClassName: "bg-destructive/20",
				dotClassName: "border-destructive/30 bg-destructive/30",
			};
		default:
			return {
				containerClassName: "border-border/70 bg-background/60",
				statusBadgeClassName: "border-border bg-background/70 text-foreground",
				railClassName: "bg-border/60",
				dotClassName: "border-border/70 bg-background",
			};
	}
}
