"use client";

import { useMutation } from "@tanstack/react-query";
import { FileUp } from "lucide-react";
import type { DragEvent, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SwarmActivityFeed } from "@/features/intelligence/components/SwarmActivityFeed";
import { useAgentStream } from "@/features/intelligence/hooks/useAgentStream";
import { useSwarmStore } from "@/features/intelligence/stores/useSwarmStore";
import {
	bootstrapMissionFromDocument,
	uploadFiscalDocument,
} from "../api/drenyra-mission.api";
import { DrenyraConversationalBar } from "./DrenyraConversationalBar";
import { DrenyraMissionDeskCard } from "./DrenyraMissionDesk.card";
import {
	DrenyraMissionDeskResult,
	DrenyraMissionDeskStageList,
} from "./DrenyraMissionDesk.detail";
import { DrenyraMissionDeskHeader } from "./DrenyraMissionDesk.header";
import type {
	DrenyraMissionDeskProps,
	MissionPhase,
} from "./DrenyraMissionDesk.types";
import { seedBootstrapDebateLogs } from "./DrenyraMissionDesk.utils";

/* ------------------------------------------------------------------ */
/*  Main orchestrator                                                  */
/* ------------------------------------------------------------------ */

/**
 * Cursor-style addictive hook: drop invoice → live agent debate → declaración lista.
 * Gentleman-AI pattern: orchestrator phases visible; CLI/TUI parity via same SSE stream.
 */
export function DrenyraMissionDesk({
	onMissionReady,
}: DrenyraMissionDeskProps): ReactElement {
	const inputRef = useRef<HTMLInputElement>(null);
	const [phase, setPhase] = useState<MissionPhase>("idle");
	const [filename, setFilename] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [missionResult, setMissionResult] = useState<Awaited<
		ReturnType<typeof bootstrapMissionFromDocument>
	> | null>(null);
	const notifiedCaseIdRef = useRef<string | null>(null);

	const { startStream, isStreaming, connectionStatus } = useAgentStream();
	const setActiveRunId = useSwarmStore((state) => state.setActiveRunId);
	const upsertRun = useSwarmStore((state) => state.upsertRun);
	const appendRunLog = useSwarmStore((state) => state.appendRunLog);
	const setRunStatus = useSwarmStore((state) => state.setRunStatus);
	const activeRunId = useSwarmStore((state) => state.activeRunId);
	const runsById = useSwarmStore((state) => state.runsById);
	const lastError = useSwarmStore((state) => state.lastError);

	const activeLogs = useMemo(() => {
		if (!activeRunId) return [];
		return runsById[activeRunId]?.logs ?? [];
	}, [activeRunId, runsById]);

	/* Notify parent once the mission fully completes */
	useEffect(() => {
		if (!missionResult || !activeRunId) return;
		const runStatus = runsById[activeRunId]?.status;
		if (runStatus !== "completed") return;

		setPhase("ready");
		if (notifiedCaseIdRef.current === missionResult.fiscalCase.id) return;
		notifiedCaseIdRef.current = missionResult.fiscalCase.id;
		onMissionReady?.({
			fiscalCase: missionResult.fiscalCase,
			mission: missionResult,
		});
	}, [activeRunId, missionResult, onMissionReady, runsById]);

	/* Core mutation: upload → bootstrap → stream */
	const runMission = useMutation({
		mutationFn: async (file: File) => {
			setPhase("uploading");
			setErrorMessage(null);
			setFilename(file.name);

			const uploaded = await uploadFiscalDocument(file);
			setPhase("orchestrating");

			const mission = await bootstrapMissionFromDocument({
				documentId: uploaded.id,
				filename: file.name,
				mimeType: file.type || undefined,
			});

			seedBootstrapDebateLogs(
				mission.agentRun.id,
				mission.agentRun,
				appendRunLog,
				setActiveRunId,
				upsertRun,
			);

			setPhase("streaming");
			startStream({
				documentId: mission.agentStreamQuery.documentId,
				filename: mission.agentStreamQuery.filename,
				mimeType: mission.agentStreamQuery.mimeType,
			});

			if (mission.agentRun.status === "COMPLETED") {
				setRunStatus(mission.agentRun.id, "completed");
			}

			setMissionResult(mission);
			return mission;
		},
		onError: (error) => {
			setPhase("error");
			setErrorMessage(
				error instanceof Error
					? error.message
					: "No se pudo procesar el comprobante",
			);
		},
	});

	const handleFiles = useCallback(
		(files: FileList | null) => {
			const file = files?.[0];
			if (!file || runMission.isPending || isStreaming) return;
			runMission.mutate(file);
		},
		[isStreaming, runMission],
	);

	const onDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		handleFiles(event.dataTransfer.files);
	};

	const isBusy =
		phase !== "ready" &&
		(runMission.isPending || isStreaming || phase === "streaming");

	return (
		<section
			className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/80 p-5 shadow-2xl shadow-black/20"
			aria-labelledby="drenyra-mission-title"
		>
			<DrenyraConversationalBar
				className="mb-4"
				onRequestUpload={() => !isBusy && inputRef.current?.click()}
			/>

			<DrenyraMissionDeskHeader
				connectionStatus={connectionStatus}
				isBusy={isBusy}
			/>

			<DrenyraMissionDeskCard
				isBusy={isBusy}
				filename={filename}
				phase={phase}
				inputRef={inputRef}
				onFiles={handleFiles}
				onDrop={onDrop}
			/>

			<div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
				<div aria-live="polite">
					<SwarmActivityFeed
						className="max-h-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/70"
						emptyMessage={
							phase === "idle"
								? "El debate multi-agente aparece acá en cuanto subas un comprobante."
								: "Esperando trazas del enjambre…"
						}
					/>
					{(errorMessage || lastError) && (
						<p className="mt-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
							{errorMessage ?? lastError}
						</p>
					)}
				</div>

				<DrenyraMissionDeskStageList
					phase={phase}
					isBusy={isBusy}
					activeLogCount={activeLogs.length}
				/>
			</div>

			<DrenyraMissionDeskResult missionResult={missionResult} phase={phase} />

			<div className="mt-4 flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					variant="secondary"
					disabled={isBusy}
					onClick={() => inputRef.current?.click()}
				>
					<FileUp size={14} />
					Subir otro comprobante
				</Button>
			</div>
		</section>
	);
}

export { DrenyraMissionDeskCard } from "./DrenyraMissionDesk.card";
export { AGENT_STAGES, DEBATE_AGENTS } from "./DrenyraMissionDesk.data";
export {
	DrenyraMissionDeskResult,
	DrenyraMissionDeskStageList,
} from "./DrenyraMissionDesk.detail";
/* Re-exports for backward compatibility */
export { DrenyraMissionDeskHeader } from "./DrenyraMissionDesk.header";
export type {
	DrenyraMissionDeskProps,
	MissionPhase,
} from "./DrenyraMissionDesk.types";
export { seedBootstrapDebateLogs } from "./DrenyraMissionDesk.utils";
