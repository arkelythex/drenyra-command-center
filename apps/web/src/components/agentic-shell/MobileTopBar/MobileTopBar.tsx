import { Menu, Search } from "lucide-react";
import { useAgenticShell } from "@/stores/agentic-shell.store";

const iconButtonClass =
	"flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

/**
 * Phone/tablet app bar (below `lg`): opens the navigation drawer and the
 * command palette. Desktop keeps the persistent sidebar instead.
 */
export function MobileTopBar() {
	const isDrawerOpen = useAgenticShell((s) => s.isSidebarMobileOpen);
	const setDrawerOpen = useAgenticShell((s) => s.setSidebarMobileOpen);
	const openCommandPalette = useAgenticShell((s) => s.openCommandPalette);

	return (
		<header className="flex shrink-0 items-center justify-between border-b border-border bg-background px-2 pt-[env(safe-area-inset-top)] lg:hidden">
			<button
				type="button"
				onClick={() => setDrawerOpen(true)}
				aria-label="Abrir menú"
				aria-controls="app-sidebar"
				aria-expanded={isDrawerOpen}
				className={iconButtonClass}
			>
				<Menu aria-hidden="true" className="size-5" />
			</button>
			<span className="text-sm font-medium tracking-tight text-foreground">
				Drenyra
			</span>
			<button
				type="button"
				onClick={openCommandPalette}
				aria-label="Buscar"
				className={iconButtonClass}
			>
				<Search aria-hidden="true" className="size-5" />
			</button>
		</header>
	);
}
