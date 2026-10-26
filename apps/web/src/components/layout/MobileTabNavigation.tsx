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

/** Segmented view switcher shown only below the `md` breakpoint; positioned by the parent, in normal flow. */
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
				"flex gap-1 rounded-lg border border-border bg-muted p-1 md:hidden",
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
							"h-10 flex-1 rounded-md px-3 text-sm font-medium transition-colors",
							selected
								? "bg-background text-foreground shadow-sm"
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
