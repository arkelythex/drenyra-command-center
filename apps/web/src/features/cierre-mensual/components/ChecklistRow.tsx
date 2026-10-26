import type { CierreMensualChecklistItem } from "@drenyra/domain";
import { CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistRowProps {
	item: CierreMensualChecklistItem;
	icon: LucideIcon;
	isNext: boolean;
}

export function ChecklistRow({ item, icon: Icon, isNext }: ChecklistRowProps) {
	const stateLabel = item.completado
		? "Completado"
		: isNext
			? "Siguiente"
			: "Pendiente";
	const RowIcon = item.completado ? CheckCircle2 : Icon;

	return (
		<li
			aria-current={isNext ? "step" : undefined}
			className="flex items-start gap-3 px-4 py-3"
		>
			<RowIcon
				aria-hidden="true"
				className={cn(
					"mt-0.5 size-4 shrink-0",
					item.completado ? "text-success" : "text-muted-foreground",
				)}
			/>
			<div className="min-w-0 flex-1 space-y-0.5">
				<p
					className={cn(
						"text-sm",
						item.completado
							? "text-muted-foreground"
							: "font-medium text-foreground",
					)}
				>
					{item.label}
				</p>
				<p className="text-sm text-muted-foreground">{item.descripcion}</p>
				{item.requiereEvidencia && !item.completado ? (
					<p className="text-sm text-warning">Requiere evidencia adjunta</p>
				) : null}
			</div>
			<span
				className={cn(
					"shrink-0 text-sm",
					isNext ? "font-medium text-foreground" : "text-muted-foreground",
				)}
			>
				{stateLabel}
			</span>
		</li>
	);
}
