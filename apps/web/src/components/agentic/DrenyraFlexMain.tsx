"use client";

import { useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useFiscalCaseStore } from "@/stores/fiscal-case-store";
import { useThreadStore } from "@/stores/thread-store";

const ThreadView = lazy(() =>
	import("./ThreadView").then((m) => ({ default: m.ThreadView })),
);

import { CentralBoard } from "@/features/central-board/CentralBoard";
import {
	type CognitiveActivityEntry,
	readPersistedTimeline,
} from "@/features/cognitive-hub/hooks/cognitive-stream";
import { extractNavigationIntent } from "@/features/cognitive-hub/logic/intent-parser";
import { usePersistedChat } from "@/features/drenyra-workspace/hooks/usePersistedChat";
import { DRENYRA_AGENTS } from "@/lib/agents";
import { cn } from "@/lib/utils";
import { Composer } from "./Composer";
import { SplitView } from "./SplitView";

// ─── Agent Status Line (inline, subtle, above composer) ─────────────────────

function AgentStatusLine({ isStreaming }: { isStreaming: boolean }) {
	const [events, setEvents] = useState<CognitiveActivityEntry[]>([]);

	useEffect(() => {
		setEvents(readPersistedTimeline());
		const interval = setInterval(() => {
			setEvents(readPersistedTimeline());
		}, 2000);
		return () => clearInterval(interval);
	}, []);

	const statusAgents = DRENYRA_AGENTS.filter((a) =>
		["sire", "ledger", "evidence", "cpe"].includes(a.id),
	);

	const isAgentActive = useCallback(
		(agentId: string) => {
			if (!isStreaming) return false;
			return events
				.slice(-5)
				.some(
					(e) =>
						e.type === "tool_executing" &&
						e.detail?.toLowerCase().includes(agentId),
				);
		},
		[isStreaming, events],
	);

	return (
		<div className="flex items-center gap-3 px-4 py-1 bg-[var(--surface-1)]/50">
			{statusAgents.map((agent) => {
				const active = isAgentActive(agent.id);
				return (
					<span
						key={agent.id}
						className="inline-flex items-center gap-1.5 text-2xs text-[var(--text-muted)]"
					>
						<span
							className={cn(
								"inline-block h-1.5 w-1.5 rounded-full",
								active ? "bg-[var(--color-success)]" : "bg-[var(--text-muted)]",
							)}
						/>
						{agent.label}
						<span className="text-[var(--text-tertiary)]">
							{active ? "working" : "idle"}
						</span>
					</span>
				);
			})}
		</div>
	);
}

// ─── DrenyraFlexMain ──────────────────────────────────────────────────────────

export function DrenyraFlexMain() {
	const navigate = useNavigate();
	const activeThreadId = useThreadStore((s) => s.activeThreadId);
	const activeFiscalCaseId = useFiscalCaseStore((s) => s.activeFiscalCaseId);

	const {
		messages,
		sendMessage,
		isStreaming,
		loadingHistory,
		error,
		clearError,
	} = usePersistedChat({
		threadId: activeThreadId,
		linkedCaseId: activeFiscalCaseId,
	});

	const handleSend = useCallback(
		async (text: string) => {
			if (text.startsWith("/")) {
				const intent = extractNavigationIntent(text);
				if (intent) {
					navigate({
						to: intent.target as unknown as Parameters<
							typeof navigate
						>[0]["to"],
					});
					return;
				}
			}
			await sendMessage(text);
		},
		[sendMessage, navigate],
	);

	const handleRetry = useCallback(async () => {
		clearError();
		const lastUserMsg = messages.filter((m) => m.role === "user").at(-1);
		if (lastUserMsg) {
			setTimeout(() => sendMessage(lastUserMsg.content), 0);
		}
	}, [clearError, messages, sendMessage]);

	const handleUploadEvidence = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".pdf,.jpg,.png,.csv,.xlsx";
		input.click();
	};

	return (
		<div className="flex h-full flex-1">
			<SplitView
				left={
					<div className="flex h-full flex-col">
						{/* Messages area */}
						<div className="flex-1 overflow-y-auto">
							<Suspense
								fallback={
									<div className="flex h-full items-center justify-center p-8">
										<span className="text-sm text-[var(--text-muted)]">
											Loading conversation...
										</span>
									</div>
								}
							>
								<ThreadView
									messages={messages}
									isStreaming={isStreaming}
									loadingHistory={loadingHistory}
								/>
							</Suspense>
						</div>

						{/* Error bar */}
						{error && (
							<div className="flex items-center gap-2 border-t border-[var(--premium-danger)]/30 bg-[var(--premium-danger)]/5 px-4 py-2">
								<span className="flex-1 text-xs text-[var(--premium-danger)]">
									{error}
								</span>
								<button
									onClick={handleRetry}
									className="text-xs font-medium text-[var(--color-primary)] hover:underline"
								>
									Reintentar
								</button>
								<button
									onClick={clearError}
									className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
								>
									Descartar
								</button>
							</div>
						)}

						{/* Agent status line — inline above composer */}
						<AgentStatusLine isStreaming={isStreaming} />

						{/* Composer — always visible */}
						<Composer
							onSend={handleSend}
							isSending={isStreaming}
							onFileUpload={handleUploadEvidence}
						/>
					</div>
				}
				right={<CentralBoard />}
			/>
		</div>
	);
}
