import { Outlet } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { FiscalInspectorProvider } from "@/context/FiscalInspectorContext";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import { FiscalEditorialShell } from "../../layout/FiscalEditorialShell";
import { AgenticCommandBar } from "../AgenticCommandBar/AgenticCommandBar";
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

const RightPanel = lazy(() =>
	import("../../agentic/RightPanel").then((m) => ({
		default: m.RightPanel,
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
 * Responsive: sidebar becomes overlay on <1024px.
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

	const isRightRailOpen = useUIStore((s) => s.isRightRailOpen);

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

				{/* Three-panel row */}
				<div className="flex min-h-0 flex-1">
					{/* Sidebar */}
					<aside
						className={cn(
							"flex-shrink-0 overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--surface-1)] transition-[width] duration-200 ease-in-out",
							"max-xl:fixed max-xl:bottom-0 max-xl:left-0 max-xl:top-0 max-xl:z-30",
							!isFocusMode && !isSidebarCollapsed
								? "w-[260px] max-xl:w-72 max-xl:max-w-[85vw]"
								: "w-0 overflow-hidden max-xl:w-0",
							isSidebarCollapsed && !isFocusMode && "w-[64px] max-xl:w-0",
						)}
						aria-hidden={isFocusMode || (!isSidebarCollapsed && false)}
					>
						{!isFocusMode && (
							<div className="flex h-full min-w-[200px] max-xl:min-w-0 flex-col">
								<Suspense fallback={<div className="p-4">Loading...</div>}>
									<AgenticSidebar />
								</Suspense>
							</div>
						)}
					</aside>

					{/* Mobile overlay backdrop */}
					{isSidebarMobileOpen && (
						// biome-ignore lint/a11y/noStaticElementInteractions: mobile sidebar dismiss overlay
						<div
							className="fixed inset-0 z-20 bg-black/50 xl:hidden"
							onClick={() => setSidebarMobileOpen(false)}
							role="presentation"
						/>
					)}

					{/* Main content area */}
					<main className="relative flex min-w-0 flex-1 flex-col">
						<FiscalInspectorProvider>
							<Suspense fallback={<AgenticLayoutLoading />}>
								{children ?? <Outlet />}
							</Suspense>
						</FiscalInspectorProvider>
					</main>

					{/* Right Inspector panel */}
					<aside
						className={cn(
							"flex-shrink-0 overflow-y-auto border-l border-[var(--border-subtle)] bg-[var(--surface-1)] transition-[width] duration-200 ease-in-out",
							"max-xl:fixed max-xl:bottom-0 max-xl:right-0 max-xl:top-0 max-xl:z-30 max-xl:shadow-2xl",
							isRightRailOpen
								? "w-[420px] max-xl:w-80 max-xl:max-w-[85vw]"
								: "w-0 overflow-hidden max-xl:w-0",
						)}
						aria-hidden={!isRightRailOpen}
					>
						{isRightRailOpen && (
							<div className="flex h-full min-w-[380px] max-xl:min-w-0 flex-col">
								<Suspense fallback={<div className="p-4">Loading...</div>}>
									<RightPanel />
								</Suspense>
							</div>
						)}
					</aside>
				</div>

				{/* Always-visible command bar at the bottom */}
				<AgenticCommandBar />
			</FiscalEditorialShell>
		</AgenticLayoutContext.Provider>
	);
}
