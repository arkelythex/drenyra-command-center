import { Suspense, lazy, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { FiscalInspector } from "@/components/layout/FiscalInspector";
import { ArtifactRegistryLoadingFallback } from "./MainLayoutLoading";
import type { ArtifactInteractionEvent } from "@/features/artifacts/types/artifact.types";

const ArtifactRegistry = lazy(async () => {
	const mod = await import("@/features/artifacts/ArtifactRegistry");
	return { default: mod.ArtifactRegistry };
});

interface MainLayoutContentProps {
	children: ReactNode;
	activeArtifact: ArtifactInteractionEvent["payload"] | null;
	onArtifactEvent: (event: ArtifactInteractionEvent) => void;
	onCloseArtifact: () => void;
}

/**
 * Main application content area with optional right panels:
 * - Artifact registry evidence inspector (xl+ screens)
 * - Fiscal inspector (unified right panel)
 */
export function MainLayoutContent({
	children,
	activeArtifact,
	onArtifactEvent,
	onCloseArtifact,
}: MainLayoutContentProps) {
	return (
		<div className="flex-1 flex flex-row h-full relative overflow-hidden bg-[var(--akx-workspace-bg)]">
			<main
				id="main-content"
				className="flex-1 flex flex-col relative overflow-hidden"
			>
				<div className="custom-scrollbar ergonomic-nav-safe lg:pb-0 flex flex-1 flex-col overflow-y-auto pt-14 lg:pt-0">
					<ErrorBoundary>{children}</ErrorBoundary>
				</div>
			</main>

			{/* RIGHT SIDEBAR: EVIDENCE INSPECTOR (Cockpit Layer) */}
			{activeArtifact ? (
				<aside className="w-[420px] shrink-0 border-l border-[var(--border-default)] bg-[var(--surface-1)] hidden xl:flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
					<div className="flex-1 overflow-y-auto custom-scrollbar p-4">
						<Suspense fallback={<ArtifactRegistryLoadingFallback />}>
							<ArtifactRegistry
								artifact={activeArtifact}
								onClose={onCloseArtifact}
								onEvent={onArtifactEvent}
							/>
						</Suspense>
					</div>
				</aside>
			) : null}

			{/* FISCAL INSPECTOR: Unified right panel (risk, evidence, agent, approval, audit) */}
			<FiscalInspector />
		</div>
	);
}
