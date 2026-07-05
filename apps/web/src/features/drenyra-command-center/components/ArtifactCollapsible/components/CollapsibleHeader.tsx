import {
	ChevronDown,
	ChevronRight,
	Download,
	FolderPlus,
	Pin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HubArtifact } from "../../../../cognitive-hub/types/hub.types";
import {
	CASE_CREATABLE_TYPES,
	getCollapsedSummary,
	getNumericKPI,
} from "../ArtifactCollapsible.data";
import type { DensityMode } from "../ArtifactCollapsible.types";

interface CollapsibleHeaderProps {
	artifact: HubArtifact;
	density: DensityMode;
	isPinned: boolean;
	expanded: boolean;
	onToggle: () => void;
	onPin: () => void;
	onExport: () => void;
	onCreateCase?: () => void;
}

export function CollapsibleHeader({
	artifact,
	density,
	isPinned,
	expanded,
	onToggle,
	onPin,
	onExport,
	onCreateCase,
}: CollapsibleHeaderProps) {
	return (
		<div className="flex items-center gap-2 px-3 py-2">
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={expanded}
				aria-controls={`artifact-content-${artifact.id}`}
				className="flex flex-1 items-center gap-2 text-left min-w-0"
			>
				{expanded ? (
					<ChevronDown
						size={14}
						className="shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
				) : (
					<ChevronRight
						size={14}
						className="shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
				)}

				<span className="truncate text-sm font-medium text-foreground">
					{artifact.title}
				</span>

				<span className="shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-3xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
					{artifact.type.replace(/_/g, " ")}
				</span>

				{!expanded && density === "detail" && (
					<span className="truncate text-xs text-muted-foreground">
						{getCollapsedSummary(artifact)}
					</span>
				)}

				{!expanded && density === "numbers-only" && (
					<span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
						{getNumericKPI(artifact)}
					</span>
				)}
			</button>

			<button
				type="button"
				onClick={onPin}
				className={cn(
					"shrink-0 transition-[opacity,color]",
					!isPinned && "opacity-0 group-hover:opacity-100",
					"text-muted-foreground hover:text-foreground",
				)}
				aria-label={isPinned ? "Unpin artifact" : "Pin artifact"}
			>
				<Pin
					size={14}
					aria-hidden="true"
					className={cn(isPinned && "fill-current text-primary")}
				/>
			</button>

			<button
				type="button"
				onClick={onExport}
				className="shrink-0 opacity-0 group-hover:opacity-100 transition-[opacity,color] text-muted-foreground hover:text-foreground"
				aria-label="Export artifact"
				title="Export artifact"
			>
				<Download size={14} aria-hidden="true" />
			</button>

			{onCreateCase && CASE_CREATABLE_TYPES.has(artifact.type) && (
				<button
					type="button"
					onClick={onCreateCase}
					className="shrink-0 opacity-0 group-hover:opacity-100 transition-[opacity,color] text-[var(--color-info)] hover:text-[var(--color-info)]/80"
					aria-label="Crear caso fiscal desde este artifact"
					title="Crear caso fiscal desde este artifact"
				>
					<FolderPlus size={14} aria-hidden="true" />
				</button>
			)}
		</div>
	);
}

CollapsibleHeader.displayName = "CollapsibleHeader";
