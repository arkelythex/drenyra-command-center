"use client";

import { useEffect } from "react";
import { FiscalEditorialShell } from "@/components/layout/FiscalEditorialShell";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import { cn } from "@/lib/utils";
import { AgenticLayoutProvider } from "./AgenticLayout.context";
import { AgenticSidebar } from "../AgenticSidebar/AgenticSidebar";
import { AgenticCommandBar } from "../AgenticCommandBar/AgenticCommandBar";
import { CommandPalette } from "../CommandPalette/CommandPalette";
import { RightInspector } from "../RightInspector/RightInspector";
import { AgenticTopBar } from "../AgenticTopBar/AgenticTopBar";

interface AgenticLayoutProps {
	children: React.ReactNode;
	fullPage?: boolean;
}

function AgenticLayoutInner({ children, fullPage }: AgenticLayoutProps) {
	const store = useAgenticShell();

	// Auto-collapse sidebar on tablet
	useEffect(() => {
		const onResize = () => {
			const tab = matchMedia(
				"(min-width:640px) and (max-width:1023px)",
			).matches;
			const mob = matchMedia("(max-width:639px)").matches;
			if (tab && !store.isSidebarCollapsed) store.setSidebarCollapsed(true);
			if (!mob && !tab && store.isSidebarMobileOpen)
				store.setSidebarMobileOpen(false);
		};
		addEventListener("resize", onResize);
		onResize();
		return () => removeEventListener("resize", onResize);
	}, [
		store.isSidebarCollapsed,
		store.setSidebarCollapsed,
		store.isSidebarMobileOpen,
		store.setSidebarMobileOpen,
	]);

	// Escape closes mobile sidebar
	useEffect(() => {
		if (!store.isSidebarMobileOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") store.setSidebarMobileOpen(false);
		};
		addEventListener("keydown", onKey);
		return () => removeEventListener("keydown", onKey);
	}, [store.isSidebarMobileOpen, store.setSidebarMobileOpen]);

	// Body scroll lock when mobile sidebar open
	useEffect(() => {
		if (typeof document === "undefined" || !store.isSidebarMobileOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [store.isSidebarMobileOpen]);

	const sidebarWidth = store.isFocusMode
		? "pointer-events-none w-0 opacity-0 lg:w-0"
		: cn(
				"w-[88vw] max-w-[336px] opacity-100",
				store.isSidebarCollapsed ? "lg:w-[64px]" : "lg:w-[240px]",
			);

	if (fullPage) {
		return <>{children}</>;
	}

	return (
		<FiscalEditorialShell
			mode="operational"
			className="relative overflow-hidden font-sans transition-colors duration-300 selection:bg-primary/20 bg-[var(--akx-workspace-bg)]"
		>
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[var(--surface-1)] focus:text-[var(--text-primary)] focus:rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:outline-none"
			>
				Saltar al contenido principal
			</a>

			{/* Mobile top bar */}
			<AgenticTopBar onMenuOpen={() => store.setSidebarMobileOpen(true)} />

			{/* Mobile sidebar overlay */}
			{store.isSidebarMobileOpen && (
				// biome-ignore lint/a11y/noStaticElementInteractions: mobile nav dismiss overlay
				<div
					className="fixed inset-0 z-[110] bg-black/40 lg:hidden"
					onClick={() => store.setSidebarMobileOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							store.setSidebarMobileOpen(false);
						}
					}}
					role="presentation"
					tabIndex={-1}
				/>
			)}

			{/* Sidebar */}
			<div
				className={cn(
					"fixed inset-y-0 left-0 z-[120] transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none lg:relative lg:translate-x-0",
					store.isSidebarMobileOpen
						? "translate-x-0"
						: "-translate-x-full lg:translate-x-0",
					sidebarWidth,
				)}
				role={store.isSidebarMobileOpen ? "dialog" : undefined}
			>
				<AgenticSidebar
					isCollapsed={store.isSidebarCollapsed}
					onToggle={() => store.setSidebarCollapsed(!store.isSidebarCollapsed)}
					onNavigate={() => store.setSidebarMobileOpen(false)}
				/>
			</div>

			{/* Main content area + Right Inspector */}
			<div className="flex flex-1 flex-row overflow-hidden">
				<main
					id="main-content"
					className="flex flex-1 flex-col overflow-hidden pt-14 lg:pt-0"
				>
					<div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto">
						{children}
					</div>
				</main>

				{/* Right Inspector — slides in when active */}
				{store.activeInspector && (
					<div className="hidden xl:flex h-full">
						<RightInspector
							panel={store.activeInspector}
							onClose={() => store.closeInspector()}
						/>
					</div>
				)}
			</div>

			{/* Command Bar — always visible */}
			<AgenticCommandBar />

			{/* Command Palette — overlay */}
			<CommandPalette
				isOpen={store.isCommandPaletteOpen}
				onClose={() => store.closeCommandPalette()}
			/>
		</FiscalEditorialShell>
	);
}

export function AgenticLayout({ children, fullPage }: AgenticLayoutProps) {
	return (
		<AgenticLayoutProvider>
			<AgenticLayoutInner fullPage={fullPage}>{children}</AgenticLayoutInner>
		</AgenticLayoutProvider>
	);
}
