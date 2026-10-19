import { cn } from "@/lib/utils";

export interface MobileTab {
	readonly id: string;
	readonly label: string;
}

export interface MobileTabNavigationProps {
	tabs: readonly MobileTab[];
	activeTab: string;
	onTabChange: (tabId: string) => void;
	className?: string;
}

/** Compact tab switcher shown only below the `md` breakpoint. */
export function MobileTabNavigation({
	tabs,
	activeTab,
	onTabChange,
	className,
}: MobileTabNavigationProps) {
	return (
		<div
			role="tablist"
			aria-label="Vistas"
			className={cn(
				"fixed z-[var(--z-sticky)] flex gap-1 rounded-full border border-border bg-card/90 p-1 backdrop-blur md:hidden",
				className,
			)}
		>
			{tabs.map((tab) => {
				const selected = tab.id === activeTab;
				return (
					<button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={selected}
						onClick={() => onTabChange(tab.id)}
						className={cn(
							"rounded-full px-3 py-1 text-xs font-medium transition-colors",
							selected
								? "bg-[var(--accent)] text-[var(--color-bg-0)]"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{tab.label}
					</button>
				);
			})}
		</div>
	);
}
