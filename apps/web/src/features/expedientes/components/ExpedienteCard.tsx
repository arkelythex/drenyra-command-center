import type { ReactElement } from "react";
import {
	Clock,
	CheckCircle2,
	AlertTriangle,
	ChevronRight,
	FileText,
	Building2,
	Calendar,
	ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExpedienteFiscal, ExpedienteStatus } from "@arkelythex/domain";
import {
	EXPEDIENTE_STATUS_LABELS,
	EXPEDIENTE_STATUS_COLORS,
	EXPEDIENTE_KIND_LABELS,
} from "@arkelythex/domain";

const STATUS_ICON: Record<ExpedienteStatus, (props: { size?: number }) => ReactElement> = {
	ABIERTO: Clock,
	EN_PROCESO: Clock,
	PENDIENTE_REVISION: AlertTriangle,
	PENDIENTE_APROBACION: ShieldCheck,
	CERRADO: CheckCircle2,
	ARCHIVADO: FileText,
};

export interface ExpedienteCardProps {
	expediente: ExpedienteFiscal;
	isSelected: boolean;
	onSelect: (expediente: ExpedienteFiscal) => void;
}

export function ExpedienteCard({
	expediente: exp,
	isSelected,
	onSelect,
}: ExpedienteCardProps) {
	const StatusIcon = STATUS_ICON[exp.status];

	return (
		<button
			type="button"
			onClick={() => onSelect(exp)}
			className={cn(
				"w-full text-left rounded-2xl border p-4 transition-all duration-200",
				isSelected
					? "border-[var(--color-info)]/30 bg-[var(--color-info)]/4 ring-1 ring-[var(--color-info)]/10"
					: "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]",
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="text-3xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
							{EXPEDIENTE_KIND_LABELS[exp.kind]}
						</span>
						<span
							className="inline-block h-1.5 w-1.5 rounded-full"
							style={{
								backgroundColor: EXPEDIENTE_STATUS_COLORS[exp.status],
							}}
						/>
					</div>
					<h2 className="mt-1 text-sm font-bold text-[var(--text-primary)] truncate">
						{exp.titulo}
					</h2>
					<div className="mt-1.5 flex items-center gap-3 text-2xs text-[var(--text-tertiary)]">
						<span className="flex items-center gap-1">
							<Building2 size={10} />
							{exp.companyName}
						</span>
						<span className="flex items-center gap-1">
							<Calendar size={10} />
							{exp.periodo}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<span
						className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-3xs font-bold"
						style={{
							borderColor: EXPEDIENTE_STATUS_COLORS[exp.status],
							color: EXPEDIENTE_STATUS_COLORS[exp.status],
						}}
					>
						<StatusIcon size={10} />
						{EXPEDIENTE_STATUS_LABELS[exp.status]}
					</span>
					<ChevronRight
						size={14}
						className="text-[var(--text-tertiary)]"
					/>
				</div>
			</div>

			{exp.pendingActions > 0 && (
				<p className="mt-2 text-3xs text-[var(--color-warning)]">
					{exp.pendingActions} acciones pendientes
				</p>
			)}
		</button>
	);
}
