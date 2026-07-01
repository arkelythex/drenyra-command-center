import type { HubArtifact } from "@arkelythex/shared/artifacts";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, Layers } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import type { KnowledgeDocument } from "@/features/agent-swarm/hooks/useKnowledgeStore";
import type { AccountingSkill } from "@/features/agent-swarm/types/skills.types";
import { cn } from "@/lib/utils";

const HubArtifactAside = lazy(async () => {
	const mod = await import("./hub-artifact-aside");
	return { default: mod.HubArtifactAside };
});

const HubContextAside = lazy(async () => {
	const mod = await import("./hub-context-aside");
	return { default: mod.HubContextAside };
});

interface HubRightRailProps {
	activeArtifact: HubArtifact | null;
	showHistory: boolean;
	isSwarmStreaming: boolean;
	skills: AccountingSkill[];
	documents: KnowledgeDocument[];
	onCloseArtifact: () => void;
	onInstallSkill: (skillId: string) => void;
}

export const HubRightRail = ({
	activeArtifact,
	showHistory,
	onCloseArtifact,
}: HubRightRailProps) => {
	const prefersReducedMotion = useReducedMotion();

	// Only show if there is an active artifact (The Context/Summary is now in the Sidebar)
	if (!activeArtifact) return null;

	return (
		<motion.aside
			initial={
				prefersReducedMotion ? { opacity: 0 } : { width: 0, opacity: 0, x: 20 }
			}
			animate={{ width: 440, opacity: 1, x: 0 }}
			exit={
				prefersReducedMotion ? { opacity: 0 } : { width: 0, opacity: 0, x: 20 }
			}
			transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
			className="relative z-50 flex h-full shrink-0 flex-col border-l border-white/10 bg-background/60  shadow-[-20px_0_50px_rgba(0,0,0,0.1)]"
		>
			<div className="flex-1 overflow-hidden">
				<Suspense
					fallback={<HubRightRailPanelFallback label="Cargando artefacto" />}
				>
					<HubArtifactAside
						activeArtifact={activeArtifact}
						onClose={onCloseArtifact}
					/>
				</Suspense>
			</div>
		</motion.aside>
	);
};

function HubRightRailPanelFallback({ label }: { label: string }) {
	return (
		<div className="h-full space-y-4 p-5" role="status" aria-live="polite">
			<div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-hover)]" />
			<div className="space-y-3">
				<div className="h-16 animate-pulse rounded-xl bg-[var(--surface-hover)]" />
				<div className="h-24 animate-pulse rounded-xl bg-[var(--surface-hover)]" />
				<div className="h-20 animate-pulse rounded-xl bg-[var(--surface-hover)]" />
			</div>
			<span className="sr-only">{label}</span>
		</div>
	);
}
