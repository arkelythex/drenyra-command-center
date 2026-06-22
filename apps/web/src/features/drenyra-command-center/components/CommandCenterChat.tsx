/**
 * CommandCenterChat — Chat como canvas principal del Drenyra Command Center.
 *
 * El chat es la UI principal (como Codex de OpenAI). Reemplaza el toggle
 * Workspace/Chat y funciona como superficie única de interacción con los
 * agentes fiscales.
 *
 * Features:
 * - Active Case Badge con botones contextuales (Run, Upload, New Case, Request Approval)
 * - Streaming de mensajes del swarm via useCognitiveStream
 * - Artifacts inline (sheet_diff, accounting_diff, etc.)
 * - Approval UI con aprobar/denegar
 * - Inline EvidenceAttachmentForm y FiscalCaseCreationForm
 * - Expandable Case Details artifact (collapsed por defecto)
 *
 * @since Jun 2026
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n/i18n";
import {
	AlertTriangle,
	Check,
	Loader2,
	X,
} from "lucide-react";
import type { DensityMode } from "./ArtifactCollapsible";
import { VirtualizedMessageList } from "./VirtualizedMessageList";
import { extractArtifacts, stripArtifacts } from "@/features/cognitive-hub/logic/artifact-extractor";
import {
	parseSimulationIntent,
	generateSimulationArtifact,
	generateSimulationSummary,
} from "../logic/SimulationEngine";
import { useCognitiveStream } from "@/features/cognitive-hub/hooks/useCognitiveStream";
import type { CognitiveMessage, HubArtifact } from "@/features/cognitive-hub/types/hub.types";
import { Button } from "@/components/ui/button";
import { EvidenceAttachmentForm } from "./EvidenceAttachmentForm";
import { FiscalCaseCreationForm } from "./FiscalCaseCreationForm";
import { useChatHistory } from "../hooks/useChatHistory";
import type {
	AddEvidenceRequest,
	CreateFiscalCaseRequest,
	DrenyraAgentType,
	FiscalCase,
	FiscalCaseDetails,
	FiscalCaseStatus,
} from "../api/drenyra-command-center.api";

import { CommandCenterChatHeader } from "./CommandCenterChatHeader";
import { CommandCenterChatInput } from "./CommandCenterChatInput";
import { CommandCenterChatEmptyState } from "./CommandCenterChatEmptyState";
import { CommandCenterChatCaseDetails } from "./CommandCenterChatCaseDetails";

// ── Props ────────────────────────────────────────────────────────────────────

export interface CommandCenterChatProps {
	/** Identificador de compañía para scoping del historial */
	companyId: string;
	/** Callback para notificar al panel derecho sobre cambios de contexto */
	onContextChange?: (ctx: {
		isStreaming: boolean;
		lastArtifact?: HubArtifact | null;
		pinnedArtifacts?: HubArtifact[];
	}) => void;
	cases: FiscalCase[];
	selectedCaseId: string | null;
	details?: FiscalCaseDetails;
	selectedAgent: DrenyraAgentType;
	isBusy: boolean;
	onCreateCase: (request: CreateFiscalCaseRequest) => void;
	onRunAgent: () => void;
	onAddEvidence: (request: AddEvidenceRequest) => void;
	onUpdateStatus: (status: FiscalCaseStatus, reason?: string) => void;
	onSelectCase: (caseId: string) => void;
	onRequestApproval: () => void;
	onSelectedAgentChange?: (agent: DrenyraAgentType) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function CommandCenterChat({
	companyId,
	onContextChange,
	cases,
	selectedCaseId,
	details,
	selectedAgent,
	isBusy,
	onCreateCase,
	onRunAgent,
	onAddEvidence,
	onUpdateStatus,
	onSelectCase,
	onRequestApproval,
	onSelectedAgentChange,
}: CommandCenterChatProps) {
	const { messages, appendMessage, updateMessage, clearHistory } = useChatHistory(companyId);
	const { t } = useTranslation();
	const [input, setInput] = useState("");
	const [showEvidenceForm, setShowEvidenceForm] = useState(false);
	const [showNewCaseForm, setShowNewCaseForm] = useState(false);
	const [showDetails, setShowDetails] = useState(false);
	const [densityMode, setDensityMode] = useState<DensityMode>("detail");
	const [pinnedArtifactIds, setPinnedArtifactIds] = useState<Set<string>>(new Set());
	const [activeThreadId, setActiveThreadId] = useState("main");
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const {
		streamMessage,
		submitApprovalDecision,
		isStreaming,
		pendingApproval,
	} = useCognitiveStream();

	// ── Derived state ──

	const activeCase = selectedCaseId
		? cases.find((c) => c.id === selectedCaseId) ?? null
		: null;

	// ── Thread management ──

	const THREAD_KEY = "drenyra:threads:";
	const THREAD_MAIN_KEY = "drenyra:thread:active";

	const handleCreateThread = useCallback((name: string) => {
		if (!name || name === "main") {
			setActiveThreadId("main");
			return;
		}
		const threadId = crypto.randomUUID();
		const threads = JSON.parse(localStorage.getItem(THREAD_KEY + companyId) || "{}");
		threads[threadId] = { id: threadId, name, createdAt: Date.now() };
		localStorage.setItem(THREAD_KEY + companyId, JSON.stringify(threads));
		localStorage.setItem(THREAD_MAIN_KEY + companyId, threadId);
		setActiveThreadId(threadId);
	}, [companyId]);

	// ── Command parser & dispatch ──

	const handleCommand = useCallback((content: string) => {
		const cmdMatch = content.match(/^\/(\w+)\s*(.*)/);
		if (cmdMatch) {
			const cmd = cmdMatch[1].toLowerCase();
			const rest = cmdMatch[2];

			switch (cmd) {
				case "compacto":
				case "compact":
					setDensityMode("compact");
					return true;
				case "detalle":
				case "detail":
					setDensityMode("detail");
					return true;
				case "solo-numeros":
				case "numbers":
				case "numeros":
					setDensityMode("numbers-only");
					return true;
				case "rama":
				case "branch":
				case "thread":
					handleCreateThread(rest);
					return true;
				case "help":
				case "ayuda":
					appendMessage({
						id: crypto.randomUUID(),
						role: "assistant",
						content: "Comandos disponibles:\n\n`/compacto` — Modo compacto\n`/detalle` — Modo detalle\n`/solo-numeros` — Solo números\n`/rama <nombre>` — Crear rama conversacional\n`/rama main` — Volver a rama principal\n`/simular <consulta>` — Simulación predictiva\n`/clear` — Limpiar historial\n`/help` — Esta ayuda",
						timestamp: new Date(),
					});
					return true;
				case "clear":
					clearHistory();
					return true;
				case "simular":
				case "simulate":
					if (!rest) {
						appendMessage({
							id: crypto.randomUUID(),
							role: "assistant",
							content: "Usá `/simular <consulta>`. Ej: `/simular incremento de 10% en ventas`",
							timestamp: new Date(),
						});
						return true;
					}
					runSimulation(rest);
					return true;
				default:
					return false;
			}
		}
		return false;
	}, [appendMessage, clearHistory, handleCreateThread]);

	// ── Simulation: detect intent + generate artifact locally ──

	const runSimulation = useCallback((query: string) => {
		const simParam = parseSimulationIntent(query);
		if (!simParam) {
			appendMessage({
				id: crypto.randomUUID(),
				role: "assistant",
				content: "No pude detectar un escenario de simulación. Probá con:\n- `/simular aumento de 10% en salarios`\n- `¿Qué pasa si subimos las ventas 15%?`\n- `Simulá reducción de 8% en gastos`",
				timestamp: new Date(),
			});
			return;
		}

		const artifact = generateSimulationArtifact(simParam);
		const summary = generateSimulationSummary(simParam);

		appendMessage({
			id: crypto.randomUUID(),
			role: "assistant",
			content: summary,
			timestamp: new Date(),
			artifacts: [artifact],
		});

		onContextChange?.({ isStreaming: false, lastArtifact: artifact });
	}, [appendMessage, onContextChange]);

	const sendMessage = useCallback(async (overrideContent?: string) => {
		const content = (overrideContent ?? input).trim();

		if (selectedFiles.length === 0 && handleCommand(content)) {
			if (!overrideContent) setInput("");
			return;
		}

		if (!content || isStreaming) return;
		if (!overrideContent) setInput("");

		// Detect simulation intent (skip if files are attached)
		if (selectedFiles.length === 0) {
			const simParam = parseSimulationIntent(content);
			if (simParam) {
				const userMessage: CognitiveMessage = {
					id: crypto.randomUUID(),
					role: "user",
					content,
					timestamp: new Date(),
				};
				appendMessage(userMessage);
				runSimulation(content);
				return;
			}
		}

		// Upload files as evidence if case is selected
		if (selectedFiles.length > 0 && selectedCaseId && onAddEvidence) {
			for (const file of selectedFiles) {
				onAddEvidence({
					type: "DOCUMENT",
					title: file.name,
					summary: `Archivo adjunto: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
					source: "Command Center Chat",
					sourceRef: file.name,
				});
			}
		}

		// Show attached files in context
		const fileContext = selectedFiles.length > 0
			? `\n\n---\n📎 Archivos adjuntos (${selectedFiles.length}):\n${selectedFiles.map((f) => `  - ${f.name}`).join("\n")}`
			: "";

		const contentWithContext = content + fileContext;

		const userMessage: CognitiveMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content: contentWithContext,
			timestamp: new Date(),
		};
		appendMessage(userMessage);

		// Notificar al panel derecho: streaming en progreso
		onContextChange?.({ isStreaming: true });

		let fullResponse = "";
		const assistantId = crypto.randomUUID();
		appendMessage({
			id: assistantId,
			role: "assistant",
			content: "",
			timestamp: new Date(),
			artifacts: [],
		});

		const messageHistory = [...messages, userMessage].map((m) => ({
			role: m.role,
			content: m.content,
		}));

		await streamMessage(messageHistory, "fast", (event) => {
			if (event.type === "token") {
				fullResponse += event.content;
				updateMessage(assistantId, { content: fullResponse });
			}

			if (event.type === "done") {
				const artifacts = extractArtifacts(fullResponse);
				const cleanContent = stripArtifacts(fullResponse);
				updateMessage(assistantId, { content: cleanContent, artifacts });

				// Notificar al panel derecho con el último artifact
				const lastArtifact = artifacts.length > 0 ? artifacts[artifacts.length - 1] : null;
				onContextChange?.({ isStreaming: false, lastArtifact });
			}
		});

		setSelectedFiles([]);

		// Streaming finalizó sin artifacts
		onContextChange?.({ isStreaming: false });
	}, [input, messages, isStreaming, streamMessage, appendMessage, updateMessage, onContextChange, handleCommand, selectedFiles, selectedCaseId, onAddEvidence]);

	// ── Approval handlers ──

	const handleApprove = useCallback(async () => {
		if (!pendingApproval) return;
		await submitApprovalDecision(pendingApproval, true);
	}, [pendingApproval, submitApprovalDecision]);

	const handleDeny = useCallback(async () => {
		if (!pendingApproval) return;
		await submitApprovalDecision(pendingApproval, false, {
			reason: "Denegado por el usuario",
		});
	}, [pendingApproval, submitApprovalDecision]);

	const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		setSelectedFiles((prev) => [...prev, ...files]);
		e.target.value = "";
	}, []);

	const handleRemoveFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
			setIsDragOver(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) {
			setSelectedFiles((prev) => [...prev, ...files]);
		}
	};

	const handleInputAreaClick = () => {
		fileInputRef.current?.click();
	};

	// ── Input handlers ──

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const handlePin = (artifactId: string) => {
		setPinnedArtifactIds((prev) => {
			const next = new Set(prev);
			if (next.has(artifactId)) {
				next.delete(artifactId);
			} else {
				next.add(artifactId);
			}
			return next;
		});
	};

	// ── Sync pinned artifacts to parent ──

	useEffect(() => {
		const pinned: HubArtifact[] = [];
		for (const msg of messages) {
			if (!msg.artifacts) continue;
			for (const a of msg.artifacts) {
				if (pinnedArtifactIds.has(a.id)) pinned.push(a);
			}
		}
		onContextChange?.({ isStreaming: false, pinnedArtifacts: pinned });
	}, [pinnedArtifactIds, messages, onContextChange]);

	// ── Crear caso desde artifact ──

	const handleCreateCaseFromArtifact = useCallback(
		(artifact: HubArtifact) => {
			// Extraer título y descripción según tipo de artifact
			let title = artifact.title;
			let description = `Caso creado desde artifact: ${artifact.title}`;

			// Mapear datos específicos del artifact a la solicitud
			switch (artifact.type) {
				case "sheet_diff": {
					const s = artifact.payload;
					title = `Conciliación: ${s.sourceName ?? s.command}`;
					description = `Diff de ${s.summary.total} registros (${s.summary.updated} actualizados, ${s.summary.flagged} flagged) en ${s.sourceName}. Comando: ${s.command}`;
					break;
				}
				case "accounting_diff": {
					const a = artifact.payload;
					title = `Ajuste contable: ${a.scope}`;
					description = `${a.diffs.length} cambios propuestos en ${a.scope}.${a.summary ? ` ${a.summary}` : ""}`;
					break;
				}
				case "dashboard": {
					const d = artifact.payload;
					title = `Reporte: ${artifact.title}`;
					description = `Métrica principal: ${d.primaryMetric.value} (tendencia: ${d.primaryMetric.trend}). Score: ${d.statusScore}%`;
					break;
				}
				case "simulation": {
					const sim = artifact.payload;
					title = `Simulación: ${artifact.title}`;
					description = `${sim.entries.length} asientos simulados para revisión`;
					break;
				}
				case "comparison": {
					const comp = artifact.payload;
					const recommended = comp.scenarios.find((s) => s.recommended);
					title = `Comparación: ${artifact.title}`;
					description = `${comp.scenarios.length} escenarios${recommended ? ` — recomendado: ${recommended.name}` : ""}`;
					break;
				}
			}

			const request: CreateFiscalCaseRequest = {
				title,
				description,
				type: "MONTHLY_CLOSE",
				riskLevel: "MEDIUM",
			};

			// Crear el caso vía la mutation del padre
			onCreateCase(request);

			// Mostrar mensaje de sistema en el chat
			const systemMsg: CognitiveMessage = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: `✅ **Caso creado**: "${title}"\n\n${description}`,
				timestamp: new Date(),
			};
			appendMessage(systemMsg);
		},
		[onCreateCase, appendMessage],
	);

	// ── Custom event listeners ──

	useEffect(() => {
		const handleClear = () => { handleCommand("/clear"); };
		const handleDensity = (e: Event) => {
			const mode = (e as CustomEvent).detail as DensityMode;
			setDensityMode(mode);
		};
		window.addEventListener("drenyra:clear-chat", handleClear);
		window.addEventListener("drenyra:density-change", handleDensity);
		return () => {
			window.removeEventListener("drenyra:clear-chat", handleClear);
			window.removeEventListener("drenyra:density-change", handleDensity);
		};
	}, [handleCommand]);

	// ── Inline form handlers ──

	const handleCreateCase = useCallback(
		(request: CreateFiscalCaseRequest) => {
			onCreateCase(request);
			setShowNewCaseForm(false);
		},
		[onCreateCase],
	);

	const handleAddEvidence = useCallback(
		(request: AddEvidenceRequest) => {
			onAddEvidence(request);
			setShowEvidenceForm(false);
		},
		[onAddEvidence],
	);

	// ── Render ──

	return (
		<section
			role="region"
			aria-label="Centro de Comandos — Chat con agente fiscal"
			className="flex min-h-[600px] flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] overflow-hidden"
		>
			<CommandCenterChatHeader
				activeCase={activeCase}
				activeThreadId={activeThreadId}
				companyId={companyId}
				densityMode={densityMode}
				selectedAgent={selectedAgent}
				showEvidenceForm={showEvidenceForm}
				showNewCaseForm={showNewCaseForm}
				selectedCaseId={selectedCaseId}
				isBusy={isBusy}
				onDensityModeChange={setDensityMode}
				onSelectedAgentChange={onSelectedAgentChange}
				onRunAgent={onRunAgent}
				onRequestApproval={onRequestApproval}
				onSelectCase={onSelectCase}
				onToggleEvidenceForm={() => setShowEvidenceForm((prev) => !prev)}
				onToggleNewCaseForm={() => setShowNewCaseForm((prev) => !prev)}
			/>

			{/* ═══════════════════════════════════════════════════════════════
			     SCROLLABLE CONTENT AREA — Virtualized Message List
			     ═══════════════════════════════════════════════════════════════ */}
			<div
				className="relative flex-1 overflow-hidden flex flex-col"
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				{messages.length === 0 && !isStreaming && !showEvidenceForm && !showNewCaseForm ? (
					<CommandCenterChatEmptyState sendMessage={sendMessage} />
				) : (
					/* ── Content: forms + virtualized messages + footer ── */
					<div className="flex flex-1 flex-col min-h-0">
						{/* Inline forms (above virtual list) */}
						{showNewCaseForm && (
							<div className="shrink-0 px-4 lg:px-6 pt-4">
								<FiscalCaseCreationForm
									onSubmit={handleCreateCase}
									isPending={isBusy}
								/>
							</div>
						)}

						{showEvidenceForm && activeCase && (
							<div className="shrink-0 px-4 lg:px-6 pt-4">
								<EvidenceAttachmentForm
									onSubmit={handleAddEvidence}
									isPending={isBusy}
									isDisabled={!selectedCaseId}
								/>
							</div>
						)}

						{/* Virtualized message list */}
						{messages.length > 0 && (
							<VirtualizedMessageList
								messages={messages}
								densityMode={densityMode}
								pinnedArtifactIds={pinnedArtifactIds}
								onPin={handlePin}
								onContextChange={onContextChange}
								onCreateCase={handleCreateCaseFromArtifact}
							/>
						)}

						{/* Below-list: approval, streaming, case details */}
						{(pendingApproval || isStreaming || (activeCase && details)) && (
							<div className="shrink-0 space-y-4 px-4 lg:px-6 pb-4">
								{/* ── Approval UI ── */}
								{pendingApproval && (
									<div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4" role="status" aria-live="polite" aria-atomic="true">
										<div className="flex items-center gap-2">
											<AlertTriangle
												size={16}
												className="text-[var(--color-warning)]"
												aria-hidden="true"
											/>
											<p className="text-sm font-bold">{t("chat.approval.title")}</p>
										</div>
										<p className="mt-1 text-xs text-[var(--text-secondary)] font-mono">
											{pendingApproval.name}
										</p>
										{pendingApproval.args !== undefined && pendingApproval.args !== null && (
											<pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--surface-2)] p-2 text-2xs text-[var(--text-tertiary)]">
												{JSON.stringify(pendingApproval.args, null, 2)}
											</pre>
										)}
										<div className="mt-3 flex gap-2">
											<Button
												size="sm"
												onClick={handleApprove}
												disabled={isStreaming}
											>
												<Check size={14} className="mr-1" aria-hidden="true" />
												{t("chat.approval.approve")}
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={handleDeny}
												disabled={isStreaming}
											>
												<X size={14} className="mr-1" aria-hidden="true" />
												{t("chat.approval.deny")}
											</Button>
										</div>
									</div>
								)}

								{/* ── Streaming indicator ── */}
								{isStreaming && !pendingApproval && (
									<div className="flex items-center gap-2 px-1 text-xs text-[var(--text-tertiary)]" role="status" aria-live="polite">
										<Loader2 size={14} className="animate-spin" aria-hidden="true" />
										{t("chat.streaming")}
									</div>
								)}

								{/* ── Expandable: Case Details Artifact ── */}
								{activeCase && details && (
									<CommandCenterChatCaseDetails
										activeCase={activeCase}
										details={details}
										isBusy={isBusy}
										showDetails={showDetails}
										onToggleDetails={() => setShowDetails((prev) => !prev)}
										onUpdateStatus={onUpdateStatus}
									/>
								)}
							</div>
						)}
					</div>
				)}

				{/* ── Drag overlay ── */}
				{isDragOver && (
					<div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--surface-1)]/90 backdrop-blur-xl" role="status" aria-live="polite">
						<div className="rounded-2xl border-2 border-dashed border-[var(--color-info)]/40 p-12 text-center">
							<p className="text-lg font-bold text-[var(--text-primary)]">Soltá archivos aquí</p>
						</div>
					</div>
				)}
			</div>

			<CommandCenterChatInput
				input={input}
				isStreaming={isStreaming}
				selectedFiles={selectedFiles}
				inputRef={inputRef}
				fileInputRef={fileInputRef}
				onInputChange={setInput}
				onSend={() => sendMessage()}
				onFileSelect={handleFileSelect}
				onRemoveFile={handleRemoveFile}
				onPaperclipClick={handleInputAreaClick}
				onKeyDown={handleKeyDown}
			/>
		</section>
	);
}
