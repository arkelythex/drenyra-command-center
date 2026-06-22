import { Search } from "lucide-react";

interface SidebarSearchProps {
	isCollapsed: boolean;
}

export function SidebarSearch({ isCollapsed }: SidebarSearchProps) {
	if (isCollapsed) return null;

	return (
		<div className="relative">
			<Search
				size={13}
				className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
			/>
			<input
				aria-label="Buscar casos fiscales"
				placeholder="Buscar casos..."
				className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] py-2 pl-8 pr-3 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--border-default)]"
			/>
		</div>
	);
}
