import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgenticSidebarToggleProps {
	isCollapsed: boolean;
	onToggle: () => void;
}

export function AgenticSidebarToggle({
	isCollapsed,
	onToggle,
}: AgenticSidebarToggleProps) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className={cn(
				"flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
				isCollapsed ? "mx-auto my-3 h-8 w-8" : "mx-3 my-3 h-8 w-8 self-end",
			)}
			aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
		>
			{isCollapsed ? (
				<ChevronRight size={14} strokeWidth={1.5} />
			) : (
				<ChevronLeft size={14} strokeWidth={1.5} />
			)}
		</button>
	);
}
