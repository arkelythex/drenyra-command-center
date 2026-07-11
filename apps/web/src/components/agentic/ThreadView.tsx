"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	Bot,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Copy,
	ExternalLink,
	FileCode,
	GitBranch,
	Loader2,
	Maximize2,
	Minimize2,
	MoreHorizontal,
	PanelRight,
	Pencil,
	Pin,
	PinOff,
	RotateCcw,
	Sparkles,
	Terminal,
	User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArtifactRenderer } from "@/features/cognitive-hub/components/artifacts/ArtifactRenderer";
import {
	extractArtifacts,
	stripArtifacts,
} from "@/features/cognitive-hub/logic/artifact-extractor";
import type { HubArtifact } from "@/features/cognitive-hub/types/hub.types";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useArtifactStore } from "@/stores/artifact-store";
import type { ApprovalRequest } from "@/stores/diff-approval-store";
import { useThreadStore } from "@/stores/thread-store";
import { ApprovalCard } from "./ApprovalCard";
import { type Checkpoint, CheckpointHistory } from "./CheckpointHistory";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ToolCall {
	id: string;
	name: string;
	status: "running" | "completed" | "error";
	output?: string;
	exitCode?: number;
	error?: string;
	entityType?: string;
	entityId?: string;
}

export interface DiffHunk {
	oldStart: number;
	newStart: number;
	content: string;
}

export interface DiffBlock {
	filePath: string;
	hunks: DiffHunk[];
}

export interface Message {
	id: string;
	role: "user" | "agent" | "system";
	content: string;
	timestamp: string;
	toolCalls?: ToolCall[];
	diffs?: DiffBlock[];
	status?: "streaming" | "complete" | "error";
	approvalRequest?: ApprovalRequest;
}

interface ThreadViewProps {
	messages?: Message[];
	isStreaming?: boolean;
	loadingHistory?: boolean;
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

export const DEMO_MESSAGES: Message[] = [
	{
		id: "demo-1",
		role: "user",
		content: "Show me the financial summary for RUC 20123456789 for March 2026",
		timestamp: new Date(Date.now() - 300_000).toISOString(),
	},
	{
		id: "demo-2",
		role: "agent",
		content: [
			"Analicé los datos financieros de **RUC 20123456789** (Minera Summa S.A.C.) para **Marzo 2026**.",
			"",
			"Acá está el resumen:",
			"",
			"- **Total Ingresos**: S/ 1,234,567.89",
			"- **Total Gastos**: S/ 987,654.32",
			"- **IGV Mensual**: S/ 222,222.22",
			"- **Detracciones**: S/ 123,456.78",
			"- **Retenciones**: S/ 45,678.90",
			"",
			"The company is in _buen estado fiscal_ with all declarations up to date.",
		].join("\n"),
		timestamp: new Date(Date.now() - 240_000).toISOString(),
		toolCalls: [
			{
				id: "tc-1",
				name: "query_sunat",
				status: "completed",
				output: [
					"RUC: 20123456789",
					"Razón Social: Minera Summa S.A.C.",
					"Estado: ACTIVO",
					"Condición: HABIDO",
					"Periodo: 2026-03",
				].join("\n"),
				exitCode: 0,
			},
			{
				id: "tc-2",
				name: "analyze_financials",
				status: "completed",
				output: [
					"Periodo: 2026-03",
					"Ingresos: S/ 1,234,567.89",
					"Gastos: S/ 987,654.32",
					"IGV: S/ 222,222.22",
					"Detracciones: S/ 123,456.78",
				].join("\n"),
				exitCode: 0,
			},
			{
				id: "tc-3",
				name: "update_invoice",
				status: "completed",
				entityType: "invoice",
				entityId: "INV-2026-001",
				output: "Invoice series updated from F001 to B001 successfully",
				exitCode: 0,
			},
		],
	},
	{
		id: "demo-3",
		role: "user",
		content: "Fix the invoice series from F001 to B001 in the last declaration",
		timestamp: new Date(Date.now() - 180_000).toISOString(),
	},
	{
		id: "demo-4",
		role: "agent",
		content: "I've updated the invoice series. Here's the diff:",
		timestamp: new Date(Date.now() - 120_000).toISOString(),
		diffs: [
			{
				filePath: "declarations/march-2026.json",
				hunks: [
					{
						oldStart: 42,
						newStart: 42,
						content: [
							'  "invoiceSeries": {',
							'-    "series": "F001",',
							'+    "series": "B001",',
							'    "type": "FACTURA",',
							'    "authorized": true',
							"  }",
						].join("\n"),
					},
				],
			},
		],
	},
	{
		id: "demo-5",
		role: "system",
		content: "✓ Declaration updated successfully. SUNAT sync pending.",
		timestamp: new Date(Date.now() - 60_000).toISOString(),
	},
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ToolCallCard({
	toolCall,
	onShowCheckpoints,
}: {
	toolCall: ToolCall;
	onShowCheckpoints?: (entityType: string, entityId: string) => void;
}) {
	const [expanded, setExpanded] = useState(false);

	const statusIcon: Record<ToolCall["status"], React.ReactNode> = {
		running: (
			<Loader2 size={14} className="animate-spin text-[var(--premium-info)]" />
		),
		completed: (
			<CheckCircle2 size={14} className="text-[var(--premium-success)]" />
		),
		error: <AlertCircle size={14} className="text-[var(--premium-danger)]" />,
	};

	return (
		<div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]">
			<div className="flex items-center">
				<button
					onClick={() => setExpanded(!expanded)}
					className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--surface-3)]"
				>
					{expanded ? (
						<ChevronDown
							size={12}
							className="shrink-0 text-[var(--text-muted)]"
						/>
					) : (
						<ChevronRight
							size={12}
							className="shrink-0 text-[var(--text-muted)]"
						/>
					)}
					<Terminal size={12} className="shrink-0 text-[var(--text-muted)]" />
					<span className="flex-1 truncate text-xs font-medium text-[var(--text-primary)]">
						{toolCall.name}
					</span>
					{statusIcon[toolCall.status]}
				</button>

				{toolCall.status === "completed" &&
					toolCall.entityType &&
					toolCall.entityId &&
					onShowCheckpoints && (
						<button
							onClick={() =>
								onShowCheckpoints(toolCall.entityType!, toolCall.entityId!)
							}
							className="flex h-full items-center px-2 py-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--premium-warning)]"
							title="View checkpoints"
						>
							<RotateCcw size={12} />
						</button>
					)}
			</div>
			<AnimatePresence>
				{expanded && toolCall.output && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<pre className="border-t border-[var(--border-subtle)] p-3 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
							{toolCall.output}
						</pre>
					</motion.div>
				)}
			</AnimatePresence>
			{toolCall.error && (
				<div className="border-t border-[var(--border-subtle)] bg-[var(--color-danger)]/5 px-3 py-2 text-xs text-[var(--premium-danger)]">
					{toolCall.error}
				</div>
			)}
		</div>
	);
}

function DiffView({ diff }: { diff: DiffBlock }) {
	return (
		<div className="overflow-hidden rounded-lg border border-[var(--border-subtle)]">
			<div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2">
				<FileCode size={12} className="text-[var(--text-muted)]" />
				<span className="text-xs font-medium text-[var(--text-primary)]">
					{diff.filePath}
				</span>
			</div>
			<div className="overflow-x-auto">
				{diff.hunks.map((hunk, i) => {
					const lines = hunk.content.split("\n");
					return (
						<div key={i}>
							{lines.map((line, j) => {
								if (line.startsWith("+")) {
									return (
										<div
											key={j}
											className="flex bg-[var(--premium-success)]/5 px-3 py-px font-mono text-xs leading-6"
										>
											<span className="mr-4 w-8 shrink-0 select-none text-right text-[var(--text-muted)]">
												{hunk.newStart + j}
											</span>
											<span className="text-[var(--premium-success)]">
												{line}
											</span>
										</div>
									);
								}
								if (line.startsWith("-")) {
									return (
										<div
											key={j}
											className="flex bg-[var(--premium-danger)]/5 px-3 py-px font-mono text-xs leading-6"
										>
											<span className="mr-4 w-8 shrink-0 select-none text-right text-[var(--text-muted)]">
												{hunk.oldStart + j}
											</span>
											<span className="text-[var(--premium-danger)]">
												{line}
											</span>
										</div>
									);
								}
								return (
									<div
										key={j}
										className="flex px-3 py-px font-mono text-xs leading-6 text-[var(--text-secondary)]"
									>
										<span className="mr-4 w-8 shrink-0 select-none text-right text-[var(--text-muted)]">
											{hunk.oldStart + j}
										</span>
										<span>{line}</span>
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function StreamingText({
	content,
	status,
}: {
	content: string;
	status: Message["status"];
}) {
	const [displayedLength, setDisplayedLength] = useState(0);
	const [cursorPhase, setCursorPhase] = useState<"blink" | "pulse" | "gone">(
		status === "streaming" ? "blink" : "gone",
	);
	const contentRef = useRef(content);
	const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		contentRef.current = content;
	});

	useEffect(() => {
		if (status !== "streaming") {
			setDisplayedLength(content.length);
			return;
		}

		setDisplayedLength(0);

		const RATE = 5;
		const TICK = 16;

		const id = setInterval(() => {
			setDisplayedLength((prev) => {
				const total = contentRef.current.length;
				const next = prev + RATE;
				return next >= total ? total : next;
			});
		}, TICK);

		return () => clearInterval(id);
	}, [status]);

	useEffect(() => {
		if (status === "complete") {
			setDisplayedLength(content.length);
			setCursorPhase("pulse");
			pulseTimerRef.current = setTimeout(() => setCursorPhase("gone"), 1000);
		}
		if (status === "streaming") {
			setCursorPhase("blink");
		}
		return () => {
			if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
		};
	}, [status, content.length]);

	return (
		<>
			<span>{content.slice(0, displayedLength)}</span>
			{cursorPhase !== "gone" && (
				<motion.span
					className="ml-0.5 inline-block h-4 w-[2px] bg-[var(--color-primary)]"
					animate={
						cursorPhase === "pulse"
							? { opacity: [1, 1, 0], scaleY: [1, 1.5, 0] }
							: { opacity: [1, 0, 1] }
					}
					transition={
						cursorPhase === "pulse"
							? { duration: 1, ease: "easeInOut", times: [0, 0.3, 1] }
							: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
					}
				/>
			)}
		</>
	);
}

function StreamingIndicator() {
	return (
		<div className="flex items-start gap-3">
			<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--premium-info)]/10">
				<Sparkles size={14} className="text-[var(--premium-info)]" />
			</div>
			<div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-[var(--surface-2)] px-4 py-3">
				{[0, 0.2, 0.4].map((delay) => (
					<motion.span
						key={delay}
						className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]"
						animate={{ opacity: [0.3, 1, 0.3] }}
						transition={{
							duration: 1.2,
							repeat: Infinity,
							delay,
							ease: "easeInOut",
						}}
					/>
				))}
			</div>
		</div>
	);
}

function MessageBubble({
	message,
	onShowCheckpoints,
}: {
	message: Message;
	onShowCheckpoints?: (entityType: string, entityId: string) => void;
}) {
	const isUser = message.role === "user";
	const isSystem = message.role === "system";
	const isAgent = !isUser && !isSystem;

	const artifactCollapsed = useArtifactStore((s) => s.artifactCollapsed);
	const density = useArtifactStore((s) => s.density);
	const pinnedArtifacts = useArtifactStore((s) => s.pinnedArtifacts);
	const setArtifactCollapsed = useArtifactStore((s) => s.setArtifactCollapsed);
	const toggleArtifactCollapsed = useArtifactStore(
		(s) => s.toggleArtifactCollapsed,
	);
	const pinArtifact = useArtifactStore((s) => s.pinArtifact);
	const unpinArtifact = useArtifactStore((s) => s.unpinArtifact);
	const setActiveArtifactId = useArtifactStore((s) => s.setActiveArtifactId);
	const toggleRightRail = useUIStore((s) => s.toggleRightRail);
	const setRightPanelTab = useUIStore((s) => s.setRightPanelTab);

	const isCompact = density === "compact";

	// Extract artifacts from agent message content (non-streaming only)
	const { artifacts, displayContent } = useMemo(() => {
		if (isAgent && message.content && message.status !== "streaming") {
			return {
				artifacts: extractArtifacts(message.content),
				displayContent: stripArtifacts(message.content),
			};
		}
		return { artifacts: [] as HubArtifact[], displayContent: message.content };
	}, [isAgent, message.content, message.status]);

	const showArtifacts = artifacts.length > 0;

	// All artifacts start collapsed by default
	useEffect(() => {
		if (showArtifacts) {
			for (const a of artifacts) {
				if (artifactCollapsed[a.id] === undefined) {
					setArtifactCollapsed(a.id, true);
				}
			}
		}
		 
	}, [showArtifacts]);

	const handlePin = useCallback(
		(artifact: HubArtifact) => {
			const isPinned = pinnedArtifacts.some((p) => p.id === artifact.id);
			if (isPinned) {
				unpinArtifact(artifact.id);
			} else {
				pinArtifact(artifact);
			}
		},
		[pinnedArtifacts, pinArtifact, unpinArtifact],
	);

	const handleMoveToPanel = useCallback(
		(artifact: HubArtifact) => {
			setActiveArtifactId(artifact.id);
			pinArtifact(artifact);
			setRightPanelTab("artifact");
			if (!useUIStore.getState().isRightRailOpen) {
				toggleRightRail();
			}
		},
		[pinArtifact, toggleRightRail, setRightPanelTab, setActiveArtifactId],
	);

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
			className={cn("flex gap-3", isUser && "flex-row-reverse")}
		>
			<div
				className={cn(
					"flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
					isUser && "bg-[var(--color-primary)]/10",
					isSystem && "bg-[var(--color-warning)]/10",
					isAgent && "bg-[var(--premium-info)]/10",
				)}
			>
				{isUser ? (
					<User size={14} className="text-[var(--color-primary)]" />
				) : isSystem ? (
					<AlertCircle size={14} className="text-[var(--color-warning)]" />
				) : (
					<Bot size={14} className="text-[var(--premium-info)]" />
				)}
			</div>

			<div
				className={cn("flex max-w-[80%] flex-col gap-2", isUser && "items-end")}
			>
				{message.approvalRequest && (
					<div className="w-full max-w-lg">
						<ApprovalCard request={message.approvalRequest} />
					</div>
				)}

				{/* Text bubble — uses displayContent (artifacts stripped) */}
				{displayContent && !message.approvalRequest && (
					<div
						className={cn(
							"rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
							isUser &&
								"rounded-br-sm bg-[var(--color-primary)]/10 text-[var(--text-primary)]",
							isAgent &&
								"rounded-bl-sm bg-[var(--surface-2)] text-[var(--text-primary)]",
							isSystem &&
								"rounded-bl-sm bg-[var(--color-warning)]/5 text-[var(--text-secondary)] italic",
							message.status === "error" &&
								"border border-[var(--premium-danger)]/30",
						)}
					>
						<div className="whitespace-pre-wrap">
							{message.status === "streaming" ? (
								<StreamingText
									content={displayContent}
									status={message.status}
								/>
							) : (
								displayContent
							)}
						</div>
						{message.status === "error" && (
							<div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--premium-danger)]">
								<AlertCircle size={12} />
								<span>Error al procesar la respuesta</span>
							</div>
						)}
					</div>
				)}

				{/* Inline rendered artifacts — collapsible with pin/move */}
				{showArtifacts && (
					<div className={cn("space-y-3", isCompact && "space-y-2")}>
						{artifacts.map((artifact) => {
							const collapsed = artifactCollapsed[artifact.id] ?? true;
							const isPinned = pinnedArtifacts.some(
								(p) => p.id === artifact.id,
							);
							return (
								<div
									key={artifact.id}
									className={cn(
										"overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] transition-all",
										collapsed && "hover:border-[var(--border-default)]",
										isCompact && "rounded-lg",
									)}
								>
									{/* Artifact header bar */}
									<div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2">
										<button
											onClick={() => toggleArtifactCollapsed(artifact.id)}
											className="flex items-center gap-2 text-left"
										>
											{collapsed ? (
												<ChevronRight
													size={isCompact ? 12 : 14}
													className="shrink-0 text-[var(--text-muted)]"
												/>
											) : (
												<ChevronDown
													size={isCompact ? 12 : 14}
													className="shrink-0 text-[var(--text-muted)]"
												/>
											)}
											<span
												className={cn(
													"font-medium text-[var(--text-primary)]",
													isCompact ? "text-xs" : "text-sm",
												)}
											>
												{artifact.title}
											</span>
										</button>

										<span className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-3xs text-[var(--text-muted)]">
											{artifact.type}
										</span>

										{/* Spacer */}
										<div className="flex-1" />

										{/* Pin/unpin */}
										<button
											onClick={() => handlePin(artifact)}
											className={cn(
												"flex h-6 w-6 items-center justify-center rounded",
												"transition-colors",
												isPinned
													? "text-[var(--color-primary)]"
													: "text-[var(--text-muted)] opacity-0 hover:opacity-100",
											)}
											title={isPinned ? "Unpin" : "Pin to panel"}
										>
											{isPinned ? (
												<Pin size={isCompact ? 12 : 14} />
											) : (
												<PinOff size={isCompact ? 12 : 14} />
											)}
										</button>

										{/* Move to right panel */}
										<button
											onClick={() => handleMoveToPanel(artifact)}
											className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition-all hover:text-[var(--color-primary)]"
											title="Open in right panel"
										>
											<PanelRight size={isCompact ? 12 : 14} />
										</button>

										{/* Expand/collapse all */}
										<button
											onClick={() => toggleArtifactCollapsed(artifact.id)}
											className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition-all hover:text-[var(--text-primary)]"
											title={collapsed ? "Expand" : "Collapse"}
										>
											{collapsed ? (
												<Maximize2 size={isCompact ? 12 : 14} />
											) : (
												<Minimize2 size={isCompact ? 12 : 14} />
											)}
										</button>
									</div>

									{/* Artifact content — hidden when collapsed */}
									<AnimatePresence initial={false}>
										{!collapsed && (
											<motion.div
												key="content"
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: "auto", opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												transition={{ duration: 0.2 }}
												className={cn(isCompact && "text-xs")}
											>
												<div className={isCompact ? "p-2" : "p-3"}>
													<ArtifactRenderer artifact={artifact} />
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							);
						})}
					</div>
				)}

				<AnimatePresence>
					{message.toolCalls?.map((tc) => (
						<motion.div
							key={tc.id}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -10 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							<ToolCallCard
								toolCall={tc}
								onShowCheckpoints={onShowCheckpoints}
							/>
						</motion.div>
					))}
				</AnimatePresence>

				{message.diffs?.map((diff, i) => (
					<DiffView key={`${diff.filePath}-${i}`} diff={diff} />
				))}

				<span
					className={cn(
						"text-3xs text-[var(--text-muted)]",
						isUser ? "text-right" : "text-left",
					)}
				>
					{new Date(message.timestamp).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</span>
			</div>
		</motion.div>
	);
}

// ─── Thread Header ───────────────────────────────────────────────────────────

function ThreadViewHeader({
	threadId,
	title,
	onRename,
	onFork,
}: {
	threadId: string;
	title: string;
	onRename: (title: string) => void;
	onFork: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [editValue, setEditValue] = useState(title);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editing) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [editing]);

	useEffect(() => {
		setEditValue(title);
	}, [title]);

	const handleSubmit = useCallback(() => {
		if (editValue.trim()) {
			onRename(editValue.trim());
		}
		setEditing(false);
	}, [editValue, onRename]);

	const handleCancel = useCallback(() => {
		setEditValue(title);
		setEditing(false);
	}, [title]);

	return (
		<div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4 py-2.5">
			<div className="flex min-w-0 items-center gap-2">
				{editing ? (
					<input
						aria-label="Edit thread title"
						ref={inputRef}
						value={editValue}
						onChange={(e) => setEditValue(e.target.value)}
						onBlur={handleSubmit}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSubmit();
							if (e.key === "Escape") handleCancel();
						}}
						onClick={(e) => e.stopPropagation()}
						className="rounded border border-[var(--border-default)] bg-[var(--surface-2)] px-2 py-1 text-sm font-medium text-[var(--text-primary)] outline-none"
					/>
				) : (
					<div className="flex items-center gap-2">
						<span
							onClick={() => setEditing(true)}
							className="cursor-pointer text-sm font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--color-primary)]"
						>
							{title}
						</span>
						<button
							aria-label="Edit title"
							onClick={() => setEditing(true)}
							className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] group-hover:opacity-100"
						>
							<Pencil size={12} />
						</button>
					</div>
				)}
			</div>

			<div className="flex items-center gap-1">
				<button
					aria-label="Pop out thread"
					onClick={() =>
						window.open(
							`/popout/${threadId}`,
							"_blank",
							"width=800,height=600,left=" +
								Math.round((screen.width - 800) / 2) +
								",top=" +
								Math.round((screen.height - 600) / 2),
						)
					}
					className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
					title="Pop out thread"
				>
					<ExternalLink size={14} />
				</button>
				<button
					aria-label="Fork thread"
					onClick={onFork}
					className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
					title="Fork thread"
				>
					<GitBranch size={14} />
				</button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							aria-label="More options"
							className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
						>
							<MoreHorizontal size={14} />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setEditing(true)}>
							<Pencil size={14} className="mr-2" />
							Rename
						</DropdownMenuItem>
						<DropdownMenuItem onClick={onFork}>
							<GitBranch size={14} className="mr-2" />
							Fork
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => navigator.clipboard.writeText(threadId)}
						>
							<Copy size={14} className="mr-2" />
							Copy ID
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ThreadView({
	messages,
	isStreaming,
	loadingHistory,
}: ThreadViewProps) {
	const activeThreadId = useThreadStore((s) => s.activeThreadId);
	const threads = useThreadStore((s) => s.threads);
	const renameThread = useThreadStore((s) => s.renameThread);
	const forkThread = useThreadStore((s) => s.forkThread);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [userScrolledUp, setUserScrolledUp] = useState(false);

	// Checkpoint dialog state
	const [checkpointDialog, setCheckpointDialog] = useState<{
		entityType: string;
		entityId: string;
	} | null>(null);

	// Demo checkpoints for preview
	const [checkpoints] = useState<Checkpoint[]>(() => [
		{
			id: "demo-cp-1",
			entityType: "invoice",
			entityId: "INV-2026-001",
			beforeSnapshot: { series: "F001", amount: 1500, status: "issued" },
			afterSnapshot: { series: "B001", amount: 1500, status: "issued" },
			diff: '-  "series": "F001"\n+  "series": "B001"',
			agentId: "agent-sunat-1",
			reason: "Corrección de serie de factura",
			createdAt: new Date(Date.now() - 300_000).toISOString(),
			status: "active",
		},
		{
			id: "demo-cp-2",
			entityType: "invoice",
			entityId: "INV-2026-001",
			beforeSnapshot: { series: "B001", amount: 1500, igv: 270 },
			afterSnapshot: { series: "B001", amount: 1800, igv: 324 },
			diff: '-  "amount": 1500\n+  "amount": 1800\n-  "igv": 270\n+  "igv": 324',
			agentId: "agent-sunat-1",
			reason: "Actualización de montos tras revisión",
			createdAt: new Date(Date.now() - 240_000).toISOString(),
			status: "active",
		},
		{
			id: "demo-cp-3",
			entityType: "journal-entry",
			entityId: "JE-2026-042",
			beforeSnapshot: { account: "7011", debit: 5000, credit: 0 },
			afterSnapshot: { account: "7012", debit: 5000, credit: 0 },
			diff: '-  "account": "7011"\n+  "account": "7012"',
			agentId: "agent-contable-2",
			reason: "Reclasificación de cuenta contable",
			createdAt: new Date(Date.now() - 600_000).toISOString(),
			status: "rolled-back",
		},
		{
			id: "demo-cp-4",
			entityType: "bank-transaction",
			entityId: "BTX-2026-891",
			beforeSnapshot: { amount: 2500, category: "uncategorized" },
			afterSnapshot: { amount: 2500, category: "proveedores" },
			diff: '-  "category": "uncategorized"\n+  "category": "proveedores"',
			agentId: "agent-bank-3",
			reason: "Categorización automática de transacción",
			createdAt: new Date(Date.now() - 900_000).toISOString(),
			status: "active",
		},
		{
			id: "demo-cp-5",
			entityType: "invoice",
			entityId: "INV-2026-002",
			beforeSnapshot: { series: "F001", amount: 3200, status: "draft" },
			afterSnapshot: { series: "F001", amount: 3200, status: "issued" },
			diff: '-  "status": "draft"\n+  "status": "issued"',
			agentId: "agent-sunat-1",
			reason: "Emisión de factura electrónica",
			createdAt: new Date(Date.now() - 1_200_000).toISOString(),
			status: "active",
		},
		{
			id: "demo-cp-6",
			entityType: "journal-entry",
			entityId: "JE-2026-043",
			beforeSnapshot: {
				account: "4011",
				debit: 0,
				credit: 1800,
				period: "2026-02",
			},
			afterSnapshot: {
				account: "4011",
				debit: 0,
				credit: 1800,
				period: "2026-03",
			},
			diff: '-  "period": "2026-02"\n+  "period": "2026-03"',
			agentId: "agent-contable-2",
			reason: "Corrección de período contable",
			createdAt: new Date(Date.now() - 1_500_000).toISOString(),
			status: "active",
		},
	]);

	const activeThread = useMemo(
		() => threads.find((t) => t.id === activeThreadId),
		[threads, activeThreadId],
	);

	const showDemo = !messages && !activeThreadId;
	const displayMessages = messages ?? (showDemo ? DEMO_MESSAGES : []);

	const handleScroll = useCallback(() => {
		if (!scrollRef.current) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
		const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
		setUserScrolledUp(!isAtBottom);
	}, []);

	useEffect(() => {
		if (userScrolledUp || !scrollRef.current) return;
		const raf = requestAnimationFrame(() => {
			if (scrollRef.current) {
				scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
			}
		});
		return () => cancelAnimationFrame(raf);
	}, [displayMessages, isStreaming, userScrolledUp]);

	const onShowCheckpoints = (entityType: string, entityId: string) => {
		setCheckpointDialog({ entityType, entityId });
	};

	const onCloseCheckpoints = () => {
		setCheckpointDialog(null);
	};

	const onRollback = (checkpointId: string) => {
		setCheckpoints((prev) =>
			prev.map((cp) =>
				cp.id === checkpointId ? { ...cp, status: "rolled-back" as const } : cp,
			),
		);
	};

	const filteredCheckpoints = checkpointDialog
		? checkpoints.filter(
				(cp) =>
					cp.entityType === checkpointDialog.entityType &&
					cp.entityId === checkpointDialog.entityId,
			)
		: [];

	return (
		<div className="flex h-full flex-col">
			{activeThread && (
				<ThreadViewHeader
					threadId={activeThread.id}
					title={activeThread.title}
					onRename={(title) => renameThread(activeThread.id, title)}
					onFork={() => forkThread(activeThread.id)}
				/>
			)}

			<ScrollArea ref={scrollRef} onScroll={handleScroll} className="flex-1">
				{loadingHistory && (
					<div className="flex items-center justify-center gap-2 py-4">
						<Loader2
							size={14}
							className="animate-spin text-[var(--text-muted)]"
						/>
						<span className="text-xs text-[var(--text-muted)]">
							Loading conversation history...
						</span>
					</div>
				)}

				<div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
					{displayMessages.length === 0 && !isStreaming ? (
						<div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
							<Bot size={32} className="mb-3 text-[var(--text-muted)]" />
							<p className="text-sm font-medium text-[var(--text-secondary)]">
								No messages yet
							</p>
							<p className="mt-1 text-xs text-[var(--text-muted)]">
								Start a conversation to begin
							</p>
						</div>
					) : (
						displayMessages.map((msg) => (
							<MessageBubble
								key={msg.id}
								message={msg}
								onShowCheckpoints={onShowCheckpoints}
							/>
						))
					)}

					<AnimatePresence>
						{isStreaming && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, y: -8, height: 0 }}
								transition={{ duration: 0.4, ease: "easeInOut" }}
							>
								<StreamingIndicator />
							</motion.div>
						)}
					</AnimatePresence>

					<div className="h-px" />
				</div>
			</ScrollArea>

			<CheckpointHistory
				isOpen={checkpointDialog !== null}
				onClose={onCloseCheckpoints}
				checkpoints={filteredCheckpoints}
				onRollback={onRollback}
			/>
		</div>
	);
}

ThreadView.displayName = "ThreadView";
