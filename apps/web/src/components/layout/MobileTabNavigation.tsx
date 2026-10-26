import {
	SegmentedControl,
	type SegmentedOption,
} from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/utils";

export type MobileTab = SegmentedOption;

export interface MobileTabNavigationProps {
	tabs: readonly MobileTab[];
	activeTab: string;
	onTabChange: (tabId: string) => void;
	className?: string;
}

/** View switcher shown only below the `md` breakpoint; positioned by the parent, in normal flow. */
export function MobileTabNavigation({
	tabs,
	activeTab,
	onTabChange,
	className,
}: MobileTabNavigationProps) {
	return (
		<SegmentedControl
			label="Vistas"
			options={tabs}
			value={activeTab}
			onChange={onTabChange}
			className={cn("md:hidden", className)}
		/>
	);
}
