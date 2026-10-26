import { CircleAlert, CircleCheck, FileText, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InvoiceCardStatusBadgeProps {
	isPaid?: boolean | undefined;
	isOverdue?: boolean | undefined;
	isSent?: boolean | undefined;
	/** Calendar date, `YYYY-MM-DD`. */
	dueDate: string | Date | null | undefined;
}

/**
 * Formats a calendar date the way it was written. `new Date("2026-03-01")` is
 * UTC midnight, which Lima (UTC-5) would show as Feb 28, a day early on a
 * due date; format it in UTC to keep the day. The API types it as a string
 * but it can arrive as a Date, and some invoices have none.
 */
function formatDay(dueDate: string | Date | null | undefined): string | null {
	if (!dueDate) return null;
	const iso = dueDate instanceof Date ? dueDate.toISOString() : String(dueDate);
	const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
	if (Number.isNaN(date.getTime())) return null;
	return date
		.toLocaleDateString("es-PE", {
			day: "numeric",
			month: "short",
			timeZone: "UTC",
		})
		.replace(".", "");
}

export function InvoiceCardStatusBadge({
	isPaid,
	isOverdue,
	isSent,
	dueDate,
}: InvoiceCardStatusBadgeProps) {
	const day = formatDay(dueDate);

	if (isPaid) {
		return (
			<Badge variant="success" className="gap-1.5">
				<CircleCheck aria-hidden="true" size={12} />
				Cobrada
			</Badge>
		);
	}

	if (isOverdue) {
		return (
			<Badge variant="danger" className="gap-1.5">
				<CircleAlert aria-hidden="true" size={12} />
				{day ? `Vencida el ${day}` : "Vencida"}
			</Badge>
		);
	}

	if (isSent) {
		return (
			<Badge variant="info" className="gap-1.5">
				<Send aria-hidden="true" size={12} />
				{day ? `Emitida · vence ${day}` : "Emitida · sin vencimiento"}
			</Badge>
		);
	}

	return (
		<Badge variant="outline" className="gap-1.5">
			<FileText aria-hidden="true" size={12} />
			Borrador
		</Badge>
	);
}
