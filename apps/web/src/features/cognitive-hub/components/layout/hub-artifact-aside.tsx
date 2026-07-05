import type { HubArtifact } from "@drenyra/shared/artifacts";
import { useReducedMotion } from "framer-motion";
import { Activity, X } from "lucide-react";
import { ArtifactRenderer } from "../artifacts/ArtifactRenderer";

interface HubArtifactAsideProps {
	activeArtifact: HubArtifact;
	onClose: () => void;
}

export const HubArtifactAside = ({
	activeArtifact,
	onClose,
}: HubArtifactAsideProps) => {
	const _prefersReducedMotion = useReducedMotion();

	return (
		<div className="flex h-full flex-col">
			<header className="flex h-16 shrink-0 items-center justify-between px-6">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
						<Activity size={16} strokeWidth={2.5} />
					</div>
					<div className="flex flex-col">
						<span className="text-xs font-bold uppercase tracking-widest text-muted">
							Artefacto
						</span>
						<span className="text-sm font-bold text-primary truncate max-w-[240px]">
							{activeArtifact.title || "Untitled Artifact"}
						</span>
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/10 hover:text-primary"
					aria-label="Cerrar"
				>
					<X size={20} strokeWidth={1.5} />
				</button>
			</header>

			<div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-none">
				<div className="rounded-2xl border border-white/5 bg-white/5 p-1 shadow-inner">
					<div className="rounded-[14px] bg-background/40 p-4 ">
						<ArtifactRenderer artifact={activeArtifact} />
					</div>
				</div>
			</div>
		</div>
	);
};
