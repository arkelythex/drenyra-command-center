import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarToggleProps {
	isCollapsed: boolean;
	onToggle: () => void;
}

export function SidebarToggle({ isCollapsed, onToggle }: SidebarToggleProps) {
	return (
		<header
			className={cn(
				"flex shrink-0 items-center px-4",
				isCollapsed ? "h-14 justify-center" : "h-14 justify-start gap-3",
			)}
		>
			<button
				onClick={onToggle}
				type="button"
				className="p-1.5 text-secondary hover:text-primary transition-colors rounded-lg hover:bg-[var(--surface-2)]"
				aria-label={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
				aria-expanded={!isCollapsed}
				aria-controls="sidebar-navigation"
			>
				{isCollapsed ? (
					<PanelLeftOpen size={18} strokeWidth={1.5} />
				) : (
					<PanelLeftClose size={18} strokeWidth={1.5} />
				)}
			</button>
			{!isCollapsed && (
				<span className="text-[13px] font-semibold tracking-wider text-[var(--text-secondary)]">
					Drenyra
				</span>
			)}
		</header>
	);
}
