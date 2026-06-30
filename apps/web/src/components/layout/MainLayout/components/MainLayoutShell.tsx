import { lazy, type ReactNode, Suspense, useCallback, useEffect } from "react";
import { FiscalEditorialShell } from "@/components/layout/FiscalEditorialShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { extractPolicyContext } from "@/components/layout/utils/policy-context";
import { useArtifactEvents } from "@/context/ArtifactEventContext";
import { persistArtifactGovernanceEvent } from "@/features/artifacts/api/artifact-governance-audit.api";
import type { ArtifactInteractionEvent } from "@/features/artifacts/types/artifact.types";
import { SessionExpiryNotification } from "@/features/auth/components/SessionExpiryNotification";
import { cn } from "@/lib/utils";
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { MainLayoutContent } from "./MainLayoutContent";
import { NotificationSidebarLoadingFallback } from "./MainLayoutLoading";
import { MainLayoutMobileNav } from "./MainLayoutMobileNav";
import { MainLayoutTopBar } from "./MainLayoutTopBar";

const NotificationSidebar = lazy(() =>
	import("@/components/notifications/NotificationSidebar").then((m) => ({
		default: m.NotificationSidebar,
	})),
);

interface MainLayoutShellProps {
	children: ReactNode;
}

export function MainLayoutShell({ children }: MainLayoutShellProps) {
	const sl = useSidebarLayout();
	const ae = useArtifactEvents();

	// Responsive sidebar behavior
	useEffect(() => {
		const onResize = () => {
			const tab = matchMedia(
				"(min-width:640px) and (max-width:1023px)",
			).matches;
			const mob = matchMedia("(max-width:639px)").matches;
			if (tab && !sl.isCollapsed) sl.setIsCollapsed(true);
			if (!mob && !tab && sl.isMobileOpen) sl.setIsMobileOpen(false);
		};
		addEventListener("resize", onResize);
		onResize();
		return () => removeEventListener("resize", onResize);
	}, [sl.isCollapsed, sl.setIsCollapsed, sl.isMobileOpen, sl.setIsMobileOpen]);

	// Escape closes mobile sidebar
	useEffect(() => {
		if (!sl.isMobileOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") sl.setIsMobileOpen(false);
		};
		addEventListener("keydown", onKey);
		return () => removeEventListener("keydown", onKey);
	}, [sl.isMobileOpen, sl.setIsMobileOpen]);

	// Body scroll lock when mobile sidebar open
	useEffect(() => {
		if (typeof document === "undefined" || !sl.isMobileOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [sl.isMobileOpen]);

	const handleArtifactEvent = useCallback(
		(event: ArtifactInteractionEvent) => {
			const pc = extractPolicyContext(event.payload);
			ae.pushArtifactEvent(event);
			ae.setLastArtifactEvent(event);
			ae.setActiveTraceId(event.traceId);
			void persistArtifactGovernanceEvent(event).catch(() => undefined);
			if (ae.activeArtifact && ae.activeArtifact.id === event.artifactId) {
				if (event.nextStatus) {
					ae.setActiveArtifact({
						...ae.activeArtifact,
						status: event.nextStatus,
						metadata: {
							...ae.activeArtifact.metadata,
							policyResult: pc
								? { allowed: true, reason: `${pc.key} (${pc.riskLevel})` }
								: ae.activeArtifact.metadata.policyResult,
						},
					});
				} else if (event.actionId === "policy-gate-denied") {
					ae.setActiveArtifact({
						...ae.activeArtifact,
						metadata: {
							...ae.activeArtifact.metadata,
							policyResult: { allowed: false, reason: event.message },
						},
					});
				}
			}
		},
		[
			ae.activeArtifact,
			ae.pushArtifactEvent,
			ae.setActiveArtifact,
			ae.setActiveTraceId,
			ae.setLastArtifactEvent,
		],
	);

	const sidebarWidth = sl.isFocusMode
		? "pointer-events-none w-0 opacity-0 lg:w-0"
		: cn(
				"w-[88vw] max-w-[336px] opacity-100",
				sl.isCollapsed ? "lg:w-[64px]" : "lg:w-[260px]",
			);

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
			<MainLayoutTopBar onMenuOpen={() => sl.setIsMobileOpen(true)} />
			{sl.isMobileOpen && (
				// biome-ignore lint/a11y/noStaticElementInteractions: mobile nav dismiss overlay
				<div
					className="ui-overlay fixed inset-0 z-[110] lg:hidden"
					onClick={() => sl.setIsMobileOpen(false)}
					role="presentation"
					tabIndex={-1}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							sl.setIsMobileOpen(false);
						}
					}}
				/>
			)}
			<div
				className={cn(
					"fixed inset-y-0 left-0 z-[120] transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none lg:relative lg:translate-x-0",
					sl.isMobileOpen
						? "translate-x-0"
						: "-translate-x-full lg:translate-x-0",
					sidebarWidth,
				)}
				role={sl.isMobileOpen ? "dialog" : undefined}
			>
				<Sidebar
					isCollapsed={sl.isCollapsed}
					onToggle={() => sl.setIsCollapsed(!sl.isCollapsed)}
					onNavigate={() => sl.setIsMobileOpen(false)}
				/>
			</div>
			<MainLayoutContent
				activeArtifact={ae.activeArtifact}
				onArtifactEvent={handleArtifactEvent}
				onCloseArtifact={() => ae.setActiveArtifact(null)}
			>
				{children}
			</MainLayoutContent>
			{sl.isNotificationsOpen && (
				<Suspense fallback={<NotificationSidebarLoadingFallback />}>
					<NotificationSidebar
						isOpen={sl.isNotificationsOpen}
						onClose={() => sl.setIsNotificationsOpen(false)}
					/>
				</Suspense>
			)}
			<SessionExpiryNotification />
			<MainLayoutMobileNav
				isFocusMode={sl.isFocusMode}
				isMobileOpen={sl.isMobileOpen}
			/>
		</FiscalEditorialShell>
	);
}
