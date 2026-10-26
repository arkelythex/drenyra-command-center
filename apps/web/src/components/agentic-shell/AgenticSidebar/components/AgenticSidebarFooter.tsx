import { useNavigate } from "@tanstack/react-router";
import { Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgenticSidebarFooterProps {
	isCollapsed: boolean;
}

export function AgenticSidebarFooter({
	isCollapsed,
}: AgenticSidebarFooterProps) {
	const navigate = useNavigate();

	if (isCollapsed) {
		return (
			<div className="flex flex-col items-center gap-1 border-t border-[var(--border-subtle)] p-2">
				<button
					type="button"
					onClick={() => navigate({ to: "/settings" })}
					className="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Settings"
				>
					<Settings size={16} />
				</button>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex items-center gap-2 border-t border-[var(--border-subtle)] p-3",
			)}
		>
			<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-3)]">
				<User size={14} className="text-muted-foreground" />
			</div>
			<span className="flex-1 truncate text-xs font-medium text-[var(--text-secondary)]">
				Usuario
			</span>
			<button
				type="button"
				onClick={() => navigate({ to: "/settings" })}
				className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-label="Settings"
			>
				<Settings size={14} />
			</button>
		</div>
	);
}
