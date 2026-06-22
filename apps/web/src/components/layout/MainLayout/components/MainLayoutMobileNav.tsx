import { BottomNavigationBar } from "@/components/layout/BottomNavigationBar";
import { FloatingDrenyraWidget } from "@/features/drenyra-workspace";
import { MOBILE_NAV_ITEMS } from "@/lib/navigation";

interface MainLayoutMobileNavProps {
	isFocusMode: boolean;
	isMobileOpen: boolean;
}

/**
 * Bottom mobile navigation bar and floating Drenyra assistant widget.
 * Hidden when focus mode or mobile sidebar overlay is active.
 */
export function MainLayoutMobileNav({
	isFocusMode,
	isMobileOpen,
}: MainLayoutMobileNavProps) {
	return (
		<>
			{!isFocusMode && !isMobileOpen ? (
				<BottomNavigationBar items={MOBILE_NAV_ITEMS} />
			) : null}
			<FloatingDrenyraWidget />
		</>
	);
}
