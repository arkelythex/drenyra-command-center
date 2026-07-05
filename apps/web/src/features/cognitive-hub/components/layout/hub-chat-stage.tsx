import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HubMessage } from "../message/HubMessage";
import type { ResolvedHubEvent } from "../hub-events.constants";
import type { CognitiveMessage } from '@drenyra/shared/messaging';
import type { PendingToolApproval } from "../../hooks/useCognitiveStream";
import type { CognitiveActivityEntry } from "../../hooks/cognitive-stream";
import type { DiscrepancyScenario } from "../anomaly/discrepancy-scenario";
import type { DiscrepancyCommitStatus } from "../anomaly/use-discrepancy-resolution.store";

const HubCommandDock = React.lazy(async () => {
	const mod = await import("./hub-command-dock");
	return { default: mod.HubCommandDock };
});

const HubEmptyState = React.lazy(async () => {
	const mod = await import("./hub-empty-state");
	return { default: mod.HubEmptyState };
});

interface HubChatStageProps {
	messages: CognitiveMessage[];
	density: "compact" | "normal";
	autonomyLevel: number;
	hasPendingApproval: boolean;
	isSwarmStreaming: boolean;
	isDiscrepancyComposerOpen: boolean;
	isSuggestionAccepted: boolean;
	discrepancyScenario: DiscrepancyScenario | null;
	discrepancyCommitStatus: DiscrepancyCommitStatus;
	undoSecondsLeft: number;
	showResolvedEvents: boolean;
	isCommandPaletteActive: boolean;
	pendingApproval: PendingToolApproval | null;
	activityTimeline: CognitiveActivityEntry[];
	activeRunId: string | null;
	isSwarmActive: boolean;
	onAutonomyLevelChange: (level: number) => void;
	onReviewDiscrepancy: () => void;
	onCloseComposer: () => void;
	onAcceptSuggestion: () => void;
	onToggleResolvedEvents: () => void;
	onSelectResolvedEvent: (event: ResolvedHubEvent) => void;
	onApprovePendingTool: (options?: {
		pairingCode?: string;
		reason?: string;
	}) => Promise<void>;
	onDenyPendingTool: (reason?: string) => Promise<void>;
	onClearTimeline: () => void;
	onSend: (content: string, files?: File[]) => void;
	onCommandModeChange: (isActive: boolean) => void;
}

const CONTAINER_VARIANTS = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

export const HubChatStage = ({
	messages,
	density,
	autonomyLevel,
	hasPendingApproval,
	isSwarmStreaming,
	isDiscrepancyComposerOpen,
	isSuggestionAccepted,
	discrepancyScenario,
	discrepancyCommitStatus,
	undoSecondsLeft,
	showResolvedEvents,
	isCommandPaletteActive,
	pendingApproval,
	activityTimeline,
	activeRunId,
	isSwarmActive,
	onAutonomyLevelChange,
	onReviewDiscrepancy,
	onCloseComposer,
	onAcceptSuggestion,
	onToggleResolvedEvents,
	onSelectResolvedEvent,
	onApprovePendingTool,
	onDenyPendingTool,
	onClearTimeline,
	onSend,
	onCommandModeChange,
}: HubChatStageProps) => {
	const [isChatBackdropActive, setIsChatBackdropActive] = React.useState(false);

	return (
		<div className="flex h-full w-full flex-col">
			<>
				<motion.div
					variants={CONTAINER_VARIANTS}
					initial="hidden"
					animate="visible"
					className={cn(
						"relative z-10 flex-1 overflow-y-auto scrollbar-none @container",
						messages.length === 0
							? "flex min-h-0 items-center justify-center p-4 sm:p-6 xl:p-8"
							: density === "compact"
								? "space-y-6 p-6"
								: "space-y-12 p-8 xl:p-10",
					)}
				>
					<AnimatePresence initial={false}>
						{messages.map((message) => (
							<HubMessage key={message.id} message={message} />
						))}
					</AnimatePresence>

					{messages.length === 0 ? (
						<React.Suspense
							fallback={
								<HubPanelFallback label="Cargando panel operativo de Drenyra" />
							}
						>
							<HubEmptyState
								autonomyLevel={autonomyLevel}
								hasPendingApproval={hasPendingApproval}
								isSwarmStreaming={isSwarmStreaming}
								isDiscrepancyComposerOpen={isDiscrepancyComposerOpen}
								isSuggestionAccepted={isSuggestionAccepted}
								discrepancyScenario={discrepancyScenario}
								discrepancyCommitStatus={discrepancyCommitStatus}
								undoSecondsLeft={undoSecondsLeft}
								showResolvedEvents={showResolvedEvents}
								onAutonomyLevelChange={onAutonomyLevelChange}
								onReviewDiscrepancy={onReviewDiscrepancy}
								onCloseComposer={onCloseComposer}
								onAcceptSuggestion={onAcceptSuggestion}
								onToggleResolvedEvents={onToggleResolvedEvents}
								onSelectResolvedEvent={onSelectResolvedEvent}
								onRunQuickAction={onSend}
							/>
						</React.Suspense>
					) : null}
				</motion.div>

				{isChatBackdropActive ? (
					<div
						className="pointer-events-none absolute inset-0 z-10 bg-black/60"
						aria-hidden
					/>
				) : null}

				<React.Suspense fallback={<HubCommandDockFallback />}>
					<HubCommandDock
						density={density}
						pendingApproval={pendingApproval}
						isCommandPaletteActive={isCommandPaletteActive}
						activityTimeline={activityTimeline}
						activeRunId={activeRunId}
						isSwarmActive={isSwarmActive}
						onApprovePendingTool={onApprovePendingTool}
						onDenyPendingTool={onDenyPendingTool}
						onClearTimeline={onClearTimeline}
						onSend={onSend}
						onCommandModeChange={onCommandModeChange}
						onChatBackdropChange={setIsChatBackdropActive}
					/>
				</React.Suspense>
			</>
		</div>
	);
};

function HubPanelFallback({ label }: { label: string }) {
	return (
		<div
			className="w-full max-w-6xl space-y-5"
			role="status"
			aria-live="polite"
		>
			<div className="h-32 animate-pulse rounded-3xl bg-[var(--surface-hover)]" />
			<div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
				<div className="space-y-3">
					<div className="h-24 animate-pulse rounded-xl bg-[var(--surface-hover)]" />
					<div className="h-24 animate-pulse rounded-xl bg-[var(--surface-hover)]" />
				</div>
				<div className="h-52 animate-pulse rounded-xl bg-[var(--surface-hover)]" />
			</div>
			<span className="sr-only">{label}</span>
		</div>
	);
}

function HubCommandDockFallback() {
	return (
		<div
			className="relative z-20 px-6 pb-6 pt-6 xl:px-8"
			role="status"
			aria-live="polite"
		>
			<div className="h-16 animate-pulse rounded-2xl bg-[var(--surface-hover)]" />
			<span className="sr-only">Cargando compositor de Drenyra</span>
		</div>
	);
}
