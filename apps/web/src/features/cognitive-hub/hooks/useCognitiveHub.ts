/**
 * Cognitive Hub Hook - Main orchestrator
 *
 * Refactored Feb 2026 to use real AI streaming instead of hardcoded artifacts.
 *
 * Before: 434 lines of if-else hardcoded responses
 * After: ~100 lines with real AI integration
 */

import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { captureError } from "@/lib/monitoring";
import { extractArtifacts, stripArtifacts } from "../logic/artifact-extractor";
import { extractNavigationIntent, parseIntent } from "../logic/intent-parser";
import { buildSheetDiffArtifactFromInput } from "../logic/sheet-diff-builder";
import type { CognitiveMessage } from "@drenyra/shared/messaging";
import { useCognitiveStream } from "./useCognitiveStream";

export function useCognitiveHub() {
	const [messages, setMessages] = useState<CognitiveMessage[]>([]);
	const {
		streamMessage,
		submitApprovalDecision,
		recoverRunState,
		isStreaming,
		pendingApproval,
		usage,
		activityTimeline,
		runId,
		clearTimeline,
	} = useCognitiveStream();
	const navigate = useNavigate();

	useEffect(() => {
		recoverRunState().catch((error) => {
			captureError(
				error instanceof Error
					? error
					: new Error("Failed to recover cognitive run state"),
				{
					source: "cognitive-hub.recover-run-state",
				},
			);
		});
	}, [recoverRunState]);

	/**
	 * Load historical mission (kept for backward compatibility)
	 */
	const loadHistoricalMission = useCallback((missionTitle: string) => {
		const historicalMsg: CognitiveMessage = {
			id: crypto.randomUUID(),
			role: "assistant",
			content: `Cargando evidencia histórica: **${missionTitle}**. Reconstruyendo estados de agentes y decisiones registradas en el Ledger.`,
			timestamp: new Date(),
			artifacts: [
				{
					id: "hist-1",
					type: "table",
					title: `Neural Timeline: ${missionTitle}`,
					payload: {
						events: [
							{
								agent: "Eviden",
								time: "09:42:10",
								description: "Extracción de RUC exitosa en Factura F001-44.",
								type: "validation",
							},
							{
								agent: "Vigila",
								time: "09:42:15",
								description:
									"Verificando reglas SIRE 2026 para el periodo actual...",
								type: "action",
							},
							{
								agent: "Traza",
								time: "09:42:22",
								description:
									"Consenso alcanzado: Registro en Ledger autorizado.",
								type: "decision",
								impact: "Asiento #A442 Generado",
							},
						],
					},
				},
			],
		};
		setMessages([historicalMsg]);
	}, []);

	/**
	 * Send message with real AI streaming
	 */
	const sendMessage = useCallback(
		async (content: string, files?: File[]) => {
			// 1. Check for navigation intent (local, no AI needed)
			//    parseIntent returns a string: "command" | "query" | "task" | "navigation"
			const intentType = parseIntent(content);
			if (intentType === "navigation") {
				const navIntent = extractNavigationIntent(content);
				if (navIntent) {
					navigate({ to: navIntent.target as string });
					return;
				}
			}

			// 2. Add user message to UI
			const userMessage: CognitiveMessage = {
				id: crypto.randomUUID(),
				role: "user",
				content,
				timestamp: new Date(),
			};

			const diffArtifact = await buildSheetDiffArtifactFromInput({
				content,
				files,
			});
			if (diffArtifact) {
				setMessages((prev) => [
					...prev,
					userMessage,
					{
						id: crypto.randomUUID(),
						role: "assistant",
						content:
							"Preparé una propuesta de conciliación con vista diff. Revisa la hoja corregida y confirma con Ctrl+Enter.",
						timestamp: new Date(),
						artifacts: [diffArtifact],
					},
				]);
				return;
			}

			setMessages((prev) => [...prev, userMessage]);

			// 3. Prepare placeholder assistant message (updated as tokens stream)
			let fullResponse = "";
			const assistantId = crypto.randomUUID();
			setMessages((prev) => [
				...prev,
				{
					id: assistantId,
					role: "assistant",
					content: "",
					timestamp: new Date(),
					artifacts: [],
				},
			]);

			// 4. Stream AI response
			const messageHistory = [...messages, userMessage].map((m) => ({
				role: m.role,
				content: m.content,
			}));

			await streamMessage(messageHistory, "fast", (event) => {
				if (event.type === "token") {
					fullResponse += event.content;
					// Show raw response during streaming (artifact tags visible but harmless)
					setMessages((prev) =>
						prev.map((m) =>
							m.id === assistantId ? { ...m, content: fullResponse } : m,
						),
					);
				}

				if (event.type === "done") {
					// Strip <artifact> tags from prose, render them as components
					const artifacts = extractArtifacts(fullResponse);
					const cleanContent = stripArtifacts(fullResponse);
					setMessages((prev) =>
						prev.map((m) =>
							m.id === assistantId
								? { ...m, content: cleanContent, artifacts }
								: m,
						),
					);
				}
			});
		},
		[messages, streamMessage, navigate],
	);

	const approvePendingTool = useCallback(
		async (options?: { pairingCode?: string; reason?: string }) => {
			if (!pendingApproval) return;
			await submitApprovalDecision(pendingApproval, true, options);
		},
		[pendingApproval, submitApprovalDecision],
	);

	const denyPendingTool = useCallback(
		async (reason?: string) => {
			if (!pendingApproval) return;
			await submitApprovalDecision(pendingApproval, false, { reason });
		},
		[pendingApproval, submitApprovalDecision],
	);

	return {
		messages,
		sendMessage,
		loadHistoricalMission,
		isSwarmActive: isStreaming,
		pendingApproval,
		approvePendingTool,
		denyPendingTool,
		usage,
		activityTimeline,
		runId,
		clearTimeline,
	};
}
