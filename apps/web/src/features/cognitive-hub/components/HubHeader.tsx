import { X, BrainCircuit, Activity, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useHubState } from "../hooks/useHubState";

/**
 * HubHeader: encabezado compacto del workspace agéntico.
 */
export const HubHeader = ({ showClose = false }: { showClose?: boolean }) => {
	const { isAuditMode, setAuditMode, toggleHistory } = useHubState();

	return (
		<header className="relative z-50 flex flex-col gap-3 bg-transparent px-5 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
			<div className="flex min-w-0 items-center gap-3">
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
					<BrainCircuit size={16} strokeWidth={2.5} />
				</div>

				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-bold tracking-tight text-primary">
							Drenyra Workspace
						</span>
						<div className="h-1.5 w-1.5 rounded-full bg-success" />
					</div>
				</div>
			</div>

			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={toggleHistory}
					className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-secondary transition-colors hover:bg-[var(--surface-2)] hover:text-primary"
					title="Historial de runs"
				>
					<BookOpen size={14} />
					Historial
				</button>

				<button
					type="button"
					onClick={() => setAuditMode(!isAuditMode)}
					className={cn(
						"inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors",
						isAuditMode
							? "bg-[var(--info)]/10 text-[var(--info)]"
							: "text-secondary hover:bg-[var(--surface-2)] hover:text-primary",
					)}
				>
					<Activity size={14} />
					{isAuditMode ? "Auditoría" : "Auditar"}
				</button>

				{showClose ? (
					<button
						type="button"
						className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
						title="Cerrar panel"
					>
						<X size={18} />
					</button>
				) : null}
			</div>
		</header>
	);
};
