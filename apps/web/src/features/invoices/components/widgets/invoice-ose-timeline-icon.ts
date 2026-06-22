import {
	AlertTriangle,
	CheckCircle2,
	Clock3,
	CircleDot,
	type LucideIcon,
} from "lucide-react";

export interface InvoiceOseTimelineIcon {
	Icon: LucideIcon;
	className: string;
	label: string;
}

export function getInvoiceOseTimelineIcon(
	status?: string | null,
): InvoiceOseTimelineIcon {
	const normalized = status?.trim().toUpperCase();

	switch (normalized) {
		case "ACCEPTED":
		case "SUCCESS":
			return {
				Icon: CheckCircle2,
				className: "text-[var(--premium-success)]",
				label: "Estado exitoso",
			};
		case "SUBMITTED":
		case "PROCESSING":
			return {
				Icon: Clock3,
				className: "text-[var(--color-info)]",
				label: "Estado en proceso",
			};
		case "OBSERVED":
			return {
				Icon: AlertTriangle,
				className: "text-yellow-700 dark:text-yellow-300",
				label: "Estado observado",
			};
		case "REJECTED":
		case "FAILED":
		case "ERROR":
			return {
				Icon: AlertTriangle,
				className: "text-destructive",
				label: "Estado fallido",
			};
		default:
			return {
				Icon: CircleDot,
				className: "text-muted-foreground",
				label: "Estado neutro",
			};
	}
}
