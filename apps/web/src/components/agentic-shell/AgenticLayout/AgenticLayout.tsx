import { Outlet } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { InspectorProvider } from "@/context/InspectorContext";
import { cn } from "@/lib/utils";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import { FiscalEditorialShell } from "../../layout/FiscalEditorialShell";
import { AgenticCommandBar } from "../AgenticCommandBar/AgenticCommandBar";
import { MobileTopBar } from "../MobileTopBar/MobileTopBar";
import { AgenticLayoutContext } from "./AgenticLayout.context";
import { AgenticLayoutLoading } from "./AgenticLayout.loading";
import type {
	AgenticLayoutContextValue,
	AgenticLayoutProps,
} from "./AgenticLayout.types";

const AgenticSidebar = lazy(() =>
	import("../AgenticSidebar/AgenticSidebar").then((m) => ({
		default: m.AgenticSidebar,
	})),
);

const InspectorHost = lazy(() =>
	import("../../agentic/InspectorHost").then((m) => ({
		default: m.InspectorHost,
	})),
);

const CommandPalette = lazy(() =>
	import("../../agentic/CommandPalette").then((m) => ({
		default: m.CommandPalette,
	})),
);

/**
 * AgenticLayout — three-panel layout for Drenyra's agentic-first shell.
 *
 * ┌───────────┬──────────────────────────┬──────────────────┐
 * │  Sidebar  │      Main Content        │  Right Inspector │
 * │  (260px)  │      (flex-1)            │  (420px, toggle) │
 * └───────────┴──────────────────────────┴──────────────────┘
 *
 * Responsive: below `lg` (1024px) the sidebar is a drawer opened from MobileTopBar.
 * Focus mode: hides sidebar.
 *
 * When used as a route layout (no `children`), renders `<Outlet />` for child routes.
 * When passed `children`, renders them directly — useful for flat routes like `/`.
 */
export function AgenticLayout({ children }: AgenticLayoutProps) {
	const {
		isSidebarCollapsed,
		isSidebarMobileOpen,
		setSidebarMobileOpen,
		activeInspector,
		closeInspector,
		isCommandPaletteOpen,
		openCommandPalette,
		closeCommandPalette,
		isFocusMode,
	} = useAgenticShell();

	useEffect(() => {
		if (!isSidebarMobileOpen) return;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setSidebarMobileOpen(false);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [isSidebarMobileOpen, setSidebarMobileOpen]);

	const [workspace, setWorkspace] = useState<
		import("./AgenticLayout.types").WorkspaceSelection | null
	>(null);

	const contextValue = useMemo<AgenticLayoutContextValue>(
		() => ({
			workspace,
			setWorkspace,
			inspector: activeInspector,
			openInspector: (panel) => useAgenticShell.getState().openInspector(panel),
			closeInspector,
			isCommandPaletteOpen,
			openCommandPalette,
			closeCommandPalette,
		}),
		[
			workspace,
			activeInspector,
			closeInspector,
			isCommandPaletteOpen,
			openCommandPalette,
			closeCommandPalette,
		],
	);

	return (
		<AgenticLayoutContext.Provider value={contextValue}>
			<FiscalEditorialShell mode="command-center">
				{/* Global command palette overlay */}
				<Suspense fallback={null}>
					<CommandPalette />
				</Suspense>

				<MobileTopBar />

				{/* Three-panel row */}
				<div className="flex min-h-0 flex-1">
					{/* Sidebar: drawer below `lg` (driven by isSidebarMobileOpen), inline from `lg` (driven by isSidebarCollapsed). */}
					<aside
						id="app-sidebar"
						aria-label="Navegación principal"
						className={cn(
							"flex-shrink-0 overflow-y-auto border-r border-border-subtle bg-card",
							"max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-30 max-lg:w-72 max-lg:max-w-[85vw] max-lg:pt-[env(safe-area-inset-top)] max-lg:shadow-2xl max-lg:transition-transform max-lg:duration-200",
							isSidebarMobileOpen
								? "max-lg:translate-x-0"
								: "max-lg:invisible max-lg:-translate-x-full",
							"lg:transition-[width] lg:duration-200 lg:ease-in-out",
							isFocusMode
								? "lg:w-0 lg:overflow-hidden"
								: isSidebarCollapsed
									? "lg:w-16"
									: "lg:w-[260px]",
						)}
					>
						{!isFocusMode && (
							<div className="flex h-full flex-col">
								<Suspense fallback={<div className="p-4">Loading...</div>}>
									<AgenticSidebar />
								</Suspense>
							</div>
						)}
					</aside>

					{/* Mobile drawer backdrop */}
					{isSidebarMobileOpen && (
						// biome-ignore lint/a11y/noStaticElementInteractions: mobile sidebar dismiss overlay; Escape also closes it
						<div
							className="fixed inset-0 z-20 bg-black/50 lg:hidden"
							onClick={() => setSidebarMobileOpen(false)}
							role="presentation"
						/>
					)}

					{/* Main content area */}
					<main className="relative flex min-w-0 flex-1 flex-col">
						<InspectorProvider>
							<Suspense fallback={<AgenticLayoutLoading />}>
								{children ?? <Outlet />}
							</Suspense>
						</InspectorProvider>
					</main>

					<Suspense fallback={null}>
						<InspectorHost />
					</Suspense>
				</div>

				{/* Always-visible command bar at the bottom */}
				<AgenticCommandBar />
			</FiscalEditorialShell>
		</AgenticLayoutContext.Provider>
	);
}
