import { Building2, ChevronDown } from "lucide-react";

interface WorkspaceSelectorProps {
	compact?: boolean;
}

/**
 * WorkspaceSelector — displays current organization + period.
 *
 * Will connect to real company/period API in later PRs.
 * Currently shows a static placeholder with the expected structure.
 */
export function WorkspaceSelector({ compact }: WorkspaceSelectorProps) {
	if (compact) {
		return (
			<button
				type="button"
				className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
			>
				<Building2 size={14} />
				<span className="truncate max-w-[120px]">Andrés Capital SAC</span>
				<ChevronDown size={12} />
			</button>
		);
	}

	return (
		<div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border-subtle)]">
			<div className="flex items-center gap-2 min-w-0">
				<Building2
					size={16}
					className="flex-shrink-0 text-[var(--text-muted)]"
				/>
				<div className="min-w-0">
					<p className="truncate text-xs font-medium text-[var(--text-primary)]">
						Andrés Capital SAC
					</p>
					<p className="truncate text-[10px] text-[var(--text-muted)]">
						RUC 20123456789 · Jun 2026
					</p>
				</div>
			</div>
			<div className="ml-auto flex items-center gap-2">
				<span className="rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-success)]">
					Activo
				</span>
			</div>
		</div>
	);
}
