import { getPersistedSunatStatus } from "./invoice-artifacts";

export interface InvoiceOseStatusTone {
	label: string;
	containerClassName: string;
	badgeClassName: string;
}

export function getInvoiceOseStatusTone(
	status?: string | null,
): InvoiceOseStatusTone {
	const normalized = getPersistedSunatStatus(status);

	switch (normalized) {
		case "ACCEPTED":
			return {
				label: "Aceptado",
				containerClassName:
					"border-[rgba(var(--premium-success-rgb),0.20)] bg-[rgba(var(--premium-success-rgb),0.08)]",
				badgeClassName:
					"border-[rgba(var(--premium-success-rgb),0.24)] bg-[rgba(var(--premium-success-rgb),0.10)] text-[var(--premium-success)]",
			};
		case "OBSERVED":
			return {
				label: "Observado",
				containerClassName: "border-yellow-500/20 bg-yellow-500/10",
				badgeClassName:
					"border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
			};
		case "REJECTED":
			return {
				label: "Rechazado",
				containerClassName: "border-destructive/20 bg-destructive/8",
				badgeClassName:
					"border-destructive/20 bg-destructive/10 text-destructive",
			};
		case "ANNULLED":
			return {
				label: "Anulado",
				containerClassName: "border-slate-500/20 bg-slate-500/10",
				badgeClassName:
					"border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
			};
		default:
			return {
				label: "Revision",
				containerClassName: "border-border/80 bg-background/70",
				badgeClassName: "border-border bg-background/70 text-foreground",
			};
	}
}
