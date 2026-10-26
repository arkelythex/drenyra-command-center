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
				containerClassName: "border-warning/20 bg-warning/10",
				badgeClassName: "border-warning/20 bg-warning/10 text-warning",
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
				containerClassName: "border-border bg-muted",
				badgeClassName:
					"border-border bg-muted text-muted-foreground dark:text-muted-foreground",
			};
		default:
			return {
				label: "Revision",
				containerClassName: "border-border/80 bg-background/70",
				badgeClassName: "border-border bg-background/70 text-foreground",
			};
	}
}
