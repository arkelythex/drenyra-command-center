import { ChevronDown } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface SidebarSectionItem {
	icon: ReactNode;
	label: string;
	to: string;
}

interface SidebarSectionProps {
	label: string;
	items: SidebarSectionItem[];
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	onNavigate: () => void;
}

export function SidebarSection({
	label,
	items,
	collapsible = false,
	defaultCollapsed = false,
	onNavigate,
}: SidebarSectionProps) {
	const navigate = useNavigate();
	const [collapsed, setCollapsed] = useState(defaultCollapsed);

	const handleToggle = useCallback(() => {
		if (collapsible) setCollapsed((p) => !p);
	}, [collapsible]);

	if (items.length === 0) return null;

	return (
		<div>
			<button
				type="button"
				onClick={handleToggle}
				className={cn(
					"flex w-full items-center gap-1.5 px-1 py-1",
					collapsible
						? "cursor-pointer hover:text-[var(--text-primary)]"
						: "cursor-default",
				)}
				aria-expanded={collapsible ? !collapsed : undefined}
			>
				<span className="text-2xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
					{label}
				</span>
				{collapsible && (
					<ChevronDown
						size={11}
						className={cn(
							"text-[var(--text-muted)] transition-transform duration-200",
							collapsed && "-rotate-90",
						)}
					/>
				)}
			</button>
			{(!collapsible || !collapsed) && (
				<div className="mt-0.5 space-y-0.5">
					{items.map((item) => (
						<button
							key={item.to}
							type="button"
							onClick={() => {
								onNavigate();
								navigate({ to: item.to } as Parameters<typeof navigate>[0]);
							}}
							className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
						>
							<span className="text-[var(--text-muted)]">{item.icon}</span>
							<span className="flex-1">{item.label}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
