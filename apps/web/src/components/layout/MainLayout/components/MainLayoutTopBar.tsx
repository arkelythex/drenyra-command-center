import { Menu } from "lucide-react";
import { ActiveCompanySwitcher } from "@/components/layout/ActiveCompanySwitcher";
import { HeaderSupportMenu } from "@/components/layout/HeaderSupportMenu";
import { UserMenu } from "@/features/auth/components/UserMenu";

interface MainLayoutTopBarProps {
	onMenuOpen: () => void;
}

/**
 * 📱 Fixed mobile top bar — visible only on screens < 1024px.
 * Includes hamburger menu, company switcher, support menu, and user menu.
 */
export function MainLayoutTopBar({ onMenuOpen }: MainLayoutTopBarProps) {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 shadow-sm lg:hidden">
			<button
				onClick={onMenuOpen}
				className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] active:scale-95"
				aria-label="Abrir menú de navegación"
			>
				<Menu size={20} strokeWidth={1.5} />
			</button>

			<div className="min-w-0 flex-1">
				<ActiveCompanySwitcher compact className="w-full" />
			</div>

			<div className="flex items-center gap-2">
				<HeaderSupportMenu compact />
				<UserMenu compact />
			</div>
		</header>
	);
}
