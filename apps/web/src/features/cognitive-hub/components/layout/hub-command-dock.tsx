import { ChevronDown } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { cn } from "@/lib/utils";
import type { CognitiveActivityEntry } from "../../hooks/cognitive-stream";
import { useAccountingJobRuns } from "../../hooks/useAccountingJobRuns";
import type { PendingToolApproval } from "../../hooks/useCognitiveStream";
import { UnifiedInput } from "../input/UnifiedInput";
import { ToolApprovalCard } from "../ToolApprovalCard";
import { ToolExecutionTimeline } from "../ToolExecutionTimeline";
import {
	loadHubEvidenceDrawerModule,
	preloadHubEvidenceDrawer,
} from "./hub-evidence-drawer-loader";

const HubEvidenceDrawer = lazy(async () => {
	const mod = await loadHubEvidenceDrawerModule();
	return { default: mod.HubEvidenceDrawer };
});

interface HubCommandDockProps {
	density: "compact" | "normal";
	pendingApproval: PendingToolApproval | null;
	isCommandPaletteActive: boolean;
	activityTimeline: CognitiveActivityEntry[];
	activeRunId: string | null;
	isSwarmActive: boolean;
	onApprovePendingTool: (options?: {
		pairingCode?: string;
		reason?: string;
	}) => Promise<void>;
	onDenyPendingTool: (reason?: string) => Promise<void>;
	onClearTimeline: () => void;
	onSend: (content: string, files?: File[]) => void;
	onCommandModeChange: (isActive: boolean) => void;
	onChatBackdropChange?: (active: boolean) => void;
}

export const HubCommandDock = ({
	pendingApproval,
	isCommandPaletteActive,
	activityTimeline,
	activeRunId,
	isSwarmActive,
	onApprovePendingTool,
	onDenyPendingTool,
	onClearTimeline,
	onSend,
	onCommandModeChange,
	onChatBackdropChange,
}: HubCommandDockProps) => {
	const { runs } = useAccountingJobRuns(4);
	const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(false);
	const hasEvidence = activityTimeline.length > 0 || Boolean(activeRunId);
	const latestAwaitingRun =
		runs.find((run) => run.status === "AWAITING_APPROVAL") ?? null;

	return (
		<div
			className={cn(
				"relative z-20 mx-auto w-full max-w-4xl bg-transparent px-4 pb-8 sm:px-6",
				isCommandPaletteActive && "z-30",
			)}
		>
			{pendingApproval ? (
				<ToolApprovalCard
					approval={pendingApproval}
					supervisedRun={latestAwaitingRun}
					onApprove={onApprovePendingTool}
					onDeny={onDenyPendingTool}
				/>
			) : null}

			<UnifiedInput
				onSend={onSend}
				disabled={isSwarmActive}
				onCommandModeChange={onCommandModeChange}
				onChatBackdropChange={onChatBackdropChange}
			/>

			{/* Context / Breadcrumbs Row (Codex Style) */}
			{!isCommandPaletteActive && (
				<div className="mt-4 flex flex-wrap items-center justify-center gap-4 px-2 text-xs font-bold uppercase tracking-[0.08em] text-muted">
					<div className="flex items-center gap-1.5 transition-colors hover:text-secondary cursor-pointer">
						<div className="h-1.5 w-1.5 rounded-full bg-border" />
						Drenyra Workspace
						<ChevronDown size={10} />
					</div>
					<div className="flex items-center gap-1.5 transition-colors hover:text-secondary cursor-pointer">
						<div className="h-1.5 w-1.5 rounded-full bg-success" />
						Conectado Localmente
						<ChevronDown size={10} />
					</div>
					<div className="flex items-center gap-1.5 transition-colors hover:text-secondary cursor-pointer">
						<div className="h-1.5 w-1.5 rounded-full bg-border" />
						drenyra/workspace-v1
						<ChevronDown size={10} />
					</div>
				</div>
			)}

			{!isCommandPaletteActive ? (
				<div className="mt-6">
					<ToolExecutionTimeline
						entries={activityTimeline}
						activeRunId={activeRunId}
						onClear={onClearTimeline}
					/>
				</div>
			) : null}

			{hasEvidence ? (
				isEvidenceExpanded ? (
					<Suspense fallback={<EvidenceDrawerFallback />}>
						<HubEvidenceDrawer
							entries={activityTimeline}
							activeRunId={activeRunId}
							isExpanded={isEvidenceExpanded}
							onToggle={() => setIsEvidenceExpanded((prev) => !prev)}
						/>
					</Suspense>
				) : (
					<div className="mt-4 flex justify-center">
						<CollapsedEvidenceTrigger
							entryCount={activityTimeline.length}
							activeRunId={activeRunId}
							onIntent={preloadHubEvidenceDrawer}
							onExpand={() => setIsEvidenceExpanded(true)}
						/>
					</div>
				)
			) : null}
		</div>
	);
};

function EvidenceDrawerFallback() {
	return (
		<section
			className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3"
			role="status"
			aria-live="polite"
		>
			<div className="h-5 w-44 animate-pulse rounded bg-[var(--surface-hover)]" />
			<span className="sr-only">Cargando evidencia activa</span>
		</section>
	);
}

interface CollapsedEvidenceTriggerProps {
	entryCount: number;
	activeRunId: string | null;
	onIntent: () => void;
	onExpand: () => void;
}

function CollapsedEvidenceTrigger({
	entryCount,
	activeRunId,
	onIntent,
	onExpand,
}: CollapsedEvidenceTriggerProps) {
	const evidenceLabel = activeRunId
		? `Ver detalle de L3 Evidencia activa ${activeRunId.slice(0, 12)}`
		: `Ver detalle de L3 Evidencia activa con ${entryCount} eventos detectados`;

	return (
		<button
			type="button"
			aria-label={evidenceLabel}
			onClick={onExpand}
			onPointerEnter={onIntent}
			onFocus={onIntent}
			className="group flex items-center gap-3 rounded-full border border-transparent px-4 py-1.5 text-left transition-all hover:bg-[var(--surface-2)]"
		>
			<span className="text-xs font-black uppercase tracking-[0.15em] text-muted group-hover:text-primary">
				Evidencia Activa
			</span>
			<div className="h-1 w-1 rounded-full bg-border group-hover:bg-primary" />
			<span className="text-2xs font-semibold text-muted group-hover:text-primary">
				{activeRunId
					? activeRunId.slice(0, 12)
					: `${entryCount} eventos detectados`}
			</span>
			<ChevronDown size={12} className="text-muted group-hover:text-primary" />
		</button>
	);
}
