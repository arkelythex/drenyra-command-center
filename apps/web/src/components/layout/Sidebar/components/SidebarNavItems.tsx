import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { SIDEBAR_NAV_ITEMS } from "../Sidebar.data";

interface SidebarNavItemsProps {
	isCollapsed: boolean;
	onNavigate: () => void;
}

export function SidebarNavItems({ isCollapsed, onNavigate }: SidebarNavItemsProps) {
	const navigate = useNavigate();

	if (isCollapsed) return null;

	return (
		<div className="space-y-0.5">
			{SIDEBAR_NAV_ITEMS.map((item) => {
				const ItemIcon = item.icon;
				return (
					<button
						key={item.to}
						type="button"
						onClick={() => {
							onNavigate();
							navigate({ to: item.to } as unknown as Parameters<typeof navigate>[0]);
						}}
						className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
					>
						<ItemIcon size={13} className="text-[var(--text-muted)]" />
						<span className="flex-1">{item.label}</span>
						<ChevronRight size={12} className="text-[var(--text-muted)]" />
					</button>
				);
			})}
		</div>
	);
}
