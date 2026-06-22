import { AlertCircle, CheckCircle2, FileText, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InvoiceCardStatusBadgeProps {
	isPaid?: boolean;
	isOverdue?: boolean;
	isSent?: boolean;
	dueDate: string;
}

export function InvoiceCardStatusBadge({
	isPaid,
	isOverdue,
	isSent,
	dueDate,
}: InvoiceCardStatusBadgeProps) {
	if (isPaid) {
		return (
			<Badge variant="success" className="gap-1.5">
				<CheckCircle2 size={10} strokeWidth={3} />
				COBRADA
			</Badge>
		);
	}

	if (isOverdue) {
		return (
			<Badge variant="danger" className="gap-1.5">
				<AlertCircle size={10} />
				VENCIDA{" "}
				{new Date(dueDate)
					.toLocaleDateString("es-PE", {
						month: "short",
						day: "numeric",
					})
					.toUpperCase()}
			</Badge>
		);
	}

	if (isSent) {
		return (
			<Badge variant="info" className="gap-1.5">
				<Send size={10} />
				EMITIDA
			</Badge>
		);
	}

	return (
		<Badge variant="outline" className="gap-1.5">
			<FileText size={10} />
			BORRADOR
		</Badge>
	);
}
