import { History, ShieldCheck, X, ChevronRight } from "lucide-react";
import {
	FISCAL_ACTION_STATUS_COLORS,
	FISCAL_ACTION_STATUS_LABELS,
} from "@drenyra/domain";
import type { HistoryListProps } from "../FiscalInspector.types";

/**
 * History list of recent fiscal actions.
 * Shows an empty state when no actions exist, or a scrollable list with a clear button.
 */
export function FiscalInspectorHistory({
	actions,
	onSelect,
	onClose,
	onClear,
}: HistoryListProps) {
	return (
		<>
			<div className="shrink-0 border-b border-[var(--color-stroke-1)] px-5 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<History size={16} className="text-[var(--color-info)]" />
						<span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
							Historial Fiscal
						</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
						aria-label="Cerrar historial fiscal"
					>
						<X size={16} />
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto custom-scrollbar p-5">
				{actions.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center space-y-3">
						<ShieldCheck
							size={32}
							className="text-[var(--color-text-disabled)]"
						/>
						<p className="text-xs font-bold text-[var(--color-text-muted)]">
							Sin acciones recientes
						</p>
						<p className="text-2xs text-[var(--color-text-disabled)] leading-relaxed max-w-[200px]">
							Las acciones fiscales que requieran revisión aparecerán aquí.
						</p>
					</div>
				) : (
					<div className="space-y-1.5">
						{actions.map((action) => (
							<button
								key={action.traceId}
								type="button"
								onClick={() => onSelect(action)}
								className="w-full text-left rounded-xl border border-[var(--color-stroke-1)] bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-2)] px-3 py-2.5 transition-colors"
							>
								<div className="flex items-center gap-2">
									<span
										className="inline-block h-2 w-2 rounded-full shrink-0"
										style={{
											backgroundColor:
												FISCAL_ACTION_STATUS_COLORS[action.status],
										}}
									/>
									<div className="min-w-0 flex-1">
										<p className="truncate text-xs font-bold text-[var(--color-text-primary)]">
											{action.summary}
										</p>
										<p className="text-3xs text-[var(--color-text-muted)]">
											{action.companyRuc} ·{" "}
											{FISCAL_ACTION_STATUS_LABELS[action.status]}
										</p>
									</div>
									<ChevronRight
										size={12}
										className="text-[var(--color-text-muted)] shrink-0"
									/>
								</div>
							</button>
						))}
					</div>
				)}
			</div>

			{actions.length > 0 && (
				<div className="shrink-0 border-t border-[var(--color-stroke-1)] px-5 py-3">
					<button
						type="button"
						onClick={onClear}
						className="w-full rounded-lg border border-[var(--color-stroke-1)] bg-[var(--color-surface-1)] px-3 py-2 text-2xs font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
					>
						Limpiar historial
					</button>
				</div>
			)}
		</>
	);
}
