interface AgenticSidebarFooterProps {
	isCollapsed: boolean;
}

export function AgenticSidebarFooter({
	isCollapsed,
}: AgenticSidebarFooterProps) {
	if (isCollapsed) {
		return (
			<div className="flex items-center justify-center border-t border-[var(--border-subtle)] px-2 py-3">
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[11px] font-semibold text-[var(--text-muted)]">
					U
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-3 py-3">
			<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[11px] font-semibold text-[var(--text-muted)]">
				U
			</div>
			<div className="flex-1 overflow-hidden">
				<div className="truncate text-xs font-medium text-[var(--text-primary)]">
					Usuario
				</div>
				<div className="truncate text-[10px] text-[var(--text-muted)]">
					usuario@ejemplo.com
				</div>
			</div>
		</div>
	);
}
