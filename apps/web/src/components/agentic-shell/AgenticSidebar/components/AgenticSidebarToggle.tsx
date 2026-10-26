import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgenticShell } from "@/stores/agentic-shell.store";

/** Collapses the desktop sidebar, or closes it when it is open as a mobile drawer. */
export function AgenticSidebarToggle() {
	const isCollapsed = useAgenticShell((s) => s.isSidebarCollapsed);
	const isDrawerOpen = useAgenticShell((s) => s.isSidebarMobileOpen);
	const toggleCollapsed = useAgenticShell((s) => s.toggleSidebarCollapsed);
	const setDrawerOpen = useAgenticShell((s) => s.setSidebarMobileOpen);

	const label = isDrawerOpen
		? "Cerrar menú"
		: isCollapsed
			? "Expandir menú"
			: "Contraer menú";

	return (
		<button
			type="button"
			onClick={() => (isDrawerOpen ? setDrawerOpen(false) : toggleCollapsed())}
			className={cn(
				"flex size-11 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)] lg:size-9",
				"text-[var(--text-muted)] hover:text-[var(--text-primary)]",
			)}
			aria-label={label}
		>
			<ChevronLeft
				size={16}
				aria-hidden="true"
				className={cn(
					"transition-transform duration-200",
					isCollapsed && !isDrawerOpen && "rotate-180",
				)}
			/>
		</button>
	);
}
