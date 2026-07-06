import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgenticShell } from "@/stores/agentic-shell.store";

export function AgenticSidebarToggle() {
	const isCollapsed = useAgenticShell((s) => s.isSidebarCollapsed);
	const toggleSidebar = useAgenticShell((s) => s.toggleSidebar);

	return (
		<button
			type="button"
			onClick={toggleSidebar}
			className={cn(
				"flex items-center justify-center p-2 transition-colors hover:bg-[var(--surface-2)]",
				"text-[var(--text-muted)] hover:text-[var(--text-primary)]",
			)}
			aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
		>
			<ChevronLeft
				size={16}
				className={cn(
					"transition-transform duration-200",
					isCollapsed && "rotate-180",
				)}
			/>
		</button>
	);
}
