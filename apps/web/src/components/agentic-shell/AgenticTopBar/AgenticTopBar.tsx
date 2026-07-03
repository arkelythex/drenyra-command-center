import { Menu, Bell } from "lucide-react";
import { WorkspaceSelector } from "@/components/agentic-shell/WorkspaceSelector/WorkspaceSelector";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { cn } from "@/lib/utils";

interface AgenticTopBarProps {
	onMenuOpen: () => void;
	className?: string;
}

/**
 * Mobile top bar — visible only on screens < 1024px.
 */
export function AgenticTopBar({ onMenuOpen, className }: AgenticTopBarProps) {
	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 shadow-sm lg:hidden",
				className,
			)}
		>
			<button
				type="button"
				onClick={onMenuOpen}
				className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] active:scale-95"
				aria-label="Abrir menú de navegación"
			>
				<Menu size={20} strokeWidth={1.5} />
			</button>

			<div className="min-w-0 flex-1">
				<WorkspaceSelector compact className="w-full" />
			</div>

			<div className="flex items-center gap-2">
				<button
					type="button"
					className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
					aria-label="Notificaciones"
				>
					<Bell size={18} strokeWidth={1.5} />
					<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
				</button>
				<UserMenu compact />
			</div>
		</header>
	);
}
