import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	Check,
	CheckCircle2,
	Circle,
	Clock,
	Link2,
	Loader2,
	Plus,
	SkipForward,
	Unlink,
	UserMinus,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	StatusBadge,
	type StatusBadgeProps,
} from "@/components/ui/StatusBadge";
import { threadKeys } from "./query-keys";
import { threadDetailQueryOptions } from "./query-options";
import * as threadsApi from "./threads.api";
import type {
	ThreadAgentAssignment,
	ThreadDetail,
	ThreadTask,
} from "./threads.types";

// ─── Status helpers ──────────────────────────────────────────────────────────

const THREAD_STATUS_BADGE: Record<
	string,
	{ status: StatusBadgeProps["status"]; label: string; color: string }
> = {
	DRAFT: {
		status: "neutral",
		label: "Borrador",
		color: "var(--color-text-muted)",
	},
	ACTIVE: { status: "info", label: "Activo", color: "var(--color-info)" },
	BLOCKED: {
		status: "danger",
		label: "Bloqueado",
		color: "var(--color-danger)",
	},
	PENDING_REVIEW: {
		status: "warning",
		label: "Revisión pendiente",
		color: "var(--color-warning)",
	},
	AWAITING_INFO: {
		status: "pending",
		label: "Esperando info",
		color: "var(--color-warning)",
	},
	REVIEWED: {
		status: "success",
		label: "Revisado",
		color: "var(--color-success)",
	},
	CLOSED: {
		status: "neutral",
		label: "Cerrado",
		color: "var(--color-text-muted)",
	},
};

const TASK_STATUS_BADGE: Record<string, StatusBadgeProps["status"]> = {
	PENDING: "pending",
	ASSIGNED: "info",
	IN_PROGRESS: "warning",
	COMPLETED: "success",
	FAILED: "danger",
	SKIPPED: "neutral",
};

const PRIORITY_BADGE: Record<string, StatusBadgeProps["status"]> = {
	LOW: "neutral",
	MEDIUM: "info",
	HIGH: "warning",
	URGENT: "danger",
};

// ─── Tabs ────────────────────────────────────────────────────────────────────

type TabId = "tasks" | "agents" | "evidence" | "timeline";

const TABS: { id: TabId; label: string }[] = [
	{ id: "tasks", label: "Tareas" },
	{ id: "agents", label: "Agentes" },
	{ id: "evidence", label: "Evidencia" },
	{ id: "timeline", label: "Timeline" },
];

// ─── Timeline event type ─────────────────────────────────────────────────────

interface TimelineEvent {
	id: string;
	type:
		| "created"
		| "task_completed"
		| "task_skipped"
		| "status_changed"
		| "agent_assigned"
		| "closed";
	label: string;
	timestamp: string;
}

function buildTimeline(thread: ThreadDetail): TimelineEvent[] {
	const events: TimelineEvent[] = [
		{
			id: "created",
			type: "created",
			label: "Thread creado",
			timestamp: thread.createdAt,
		},
	];

	for (const task of thread.tasks) {
		if (task.status === "COMPLETED") {
			events.push({
				id: `task-completed-${task.id}`,
				type: "task_completed",
				label: `Tarea completada: ${task.title}`,
				timestamp: task.completedAt ?? task.updatedAt,
			});
		}
		if (task.status === "SKIPPED") {
			events.push({
				id: `task-skipped-${task.id}`,
				type: "task_skipped",
				label: `Tarea omitida: ${task.title}`,
				timestamp: task.updatedAt,
			});
		}
	}

	if (thread.closedAt) {
		events.push({
			id: "closed",
			type: "closed",
			label: "Thread cerrado",
			timestamp: thread.closedAt,
		});
	}

	events.sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	);
	return events;
}

const TIMELINE_ICONS: Record<TimelineEvent["type"], React.ElementType> = {
	created: Plus,
	task_completed: CheckCircle2,
	task_skipped: SkipForward,
	status_changed: Clock,
	agent_assigned: UserMinus,
	closed: X,
};

// ─── Page ────────────────────────────────────────────────────────────────────

export function ThreadDetailPage() {
	const { threadId } = useParams({ from: "/threads/$threadId" });
	const queryClient = useQueryClient();

	// ── State ──────────────────────────────────────────────────────────────
	const [activeTab, setActiveTab] = useState<TabId>("tasks");
	const [showCloseConfirm, setShowCloseConfirm] = useState(false);
	const [closeNote, setCloseNote] = useState("");
	const [showLinkEvidence, setShowLinkEvidence] = useState(false);
	const [evidenceId, setEvidenceId] = useState("");

	// ── Queries ────────────────────────────────────────────────────────────
	const {
		data: thread,
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery(threadDetailQueryOptions(threadId));

	// ── Mutations ──────────────────────────────────────────────────────────
	const closeMutation = useMutation({
		mutationFn: () => threadsApi.closeThread(threadId, closeNote || undefined),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: threadKeys.detail(threadId) });
			queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
			setShowCloseConfirm(false);
			setCloseNote("");
		},
	});

	const updateTaskMutation = useMutation({
		mutationFn: ({
			taskId,
			data,
		}: {
			taskId: string;
			data: { status: string };
		}) => threadsApi.updateTask(threadId, taskId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: threadKeys.detail(threadId) });
		},
	});

	const unlinkEvidenceMutation = useMutation({
		mutationFn: (evId: string) => threadsApi.unlinkEvidence(threadId, evId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: threadKeys.detail(threadId) });
		},
	});

	const linkEvidenceMutation = useMutation({
		mutationFn: () => threadsApi.linkEvidence(threadId, evidenceId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: threadKeys.detail(threadId) });
			setShowLinkEvidence(false);
			setEvidenceId("");
		},
	});

	// ── Derived ────────────────────────────────────────────────────────────
	const threadBadge = thread
		? (THREAD_STATUS_BADGE[thread.status] ?? THREAD_STATUS_BADGE.DRAFT)
		: null;
	const isClosed = thread?.status === "CLOSED";
	const timeline = thread ? buildTimeline(thread) : [];

	// ── Loading state ──────────────────────────────────────────────────────
	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center p-8">
				<div className="flex flex-col items-center gap-3 text-center">
					<Loader2
						size={24}
						className="animate-spin text-[var(--text-tertiary)]"
					/>
					<p className="text-sm text-[var(--text-secondary)]">
						Cargando thread...
					</p>
				</div>
			</div>
		);
	}

	// ── Error state ────────────────────────────────────────────────────────
	if (isError) {
		const isNotFound =
			error instanceof Error &&
			(error.message.includes("not found") || error.message.includes("404"));

		if (isNotFound) {
			return (
				<div className="flex h-full items-center justify-center p-8">
					<div className="flex flex-col items-center gap-4 text-center">
						<AlertCircle size={32} className="text-[var(--text-tertiary)]" />
						<div>
							<p className="text-base font-semibold text-[var(--text-primary)]">
								Thread no encontrado
							</p>
							<p className="mt-1 text-sm text-[var(--text-tertiary)]">
								El thread que buscas no existe o fue eliminado
							</p>
						</div>
						<Link
							to="/threads"
							className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
						>
							<ArrowLeft size={14} />
							Volver a threads
						</Link>
					</div>
				</div>
			);
		}

		return (
			<div className="flex h-full items-center justify-center p-8">
				<div className="flex flex-col items-center gap-4 text-center">
					<AlertCircle size={24} className="text-[var(--color-danger-text)]" />
					<div>
						<p className="text-sm font-medium text-[var(--text-primary)]">
							Error al cargar el thread
						</p>
						<p className="text-xs text-[var(--text-tertiary)]">
							{error instanceof Error ? error.message : "Error desconocido"}
						</p>
					</div>
					<Button variant="secondary" size="sm" onClick={() => refetch()}>
						Reintentar
					</Button>
				</div>
			</div>
		);
	}

	// ── Guard: no data ─────────────────────────────────────────────────────
	if (!thread) return null;

	// ── Render ─────────────────────────────────────────────────────────────
	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[900px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-6">
					{/* Back link */}
					<Link
						to="/threads"
						className="inline-flex items-center gap-1.5 text-2xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
					>
						<ArrowLeft size={14} />
						Volver a threads
					</Link>

					{/* Header */}
					<header className="space-y-4">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
								{thread.title}
							</h1>
							{threadBadge && (
								<StatusBadge
									status={threadBadge.status}
									label={threadBadge.label}
									size="sm"
								/>
							)}
							{thread.priority && (
								<StatusBadge
									status={PRIORITY_BADGE[thread.priority] ?? "neutral"}
									label={thread.priority}
									size="sm"
								/>
							)}
							{thread.environment && (
								<StatusBadge
									status="info"
									label={thread.environment}
									size="sm"
								/>
							)}
							{thread.period && (
								<span className="text-2xs text-[var(--text-tertiary)] font-mono">
									{thread.period}
								</span>
							)}
						</div>

						{thread.description && (
							<p className="text-sm text-[var(--text-secondary)]">
								{thread.description}
							</p>
						)}

						{/* Tags */}
						{thread.tags && thread.tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{thread.tags.map((tag) => (
									<span
										key={tag}
										className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-0.5 text-2xs text-[var(--text-tertiary)]"
									>
										{tag}
									</span>
								))}
							</div>
						)}
					</header>

					{/* Actions bar */}
					{!isClosed && (
						<div className="flex flex-wrap items-center gap-2">
							<Button
								variant="primary"
								size="sm"
								onClick={() => setShowCloseConfirm(true)}
							>
								<X size={14} className="mr-1.5" />
								Cerrar thread
							</Button>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => setShowLinkEvidence(!showLinkEvidence)}
							>
								<Link2 size={14} className="mr-1.5" />
								Vincular evidencia
							</Button>
						</div>
					)}

					{/* Link evidence form */}
					{showLinkEvidence && (
						<div className="flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
							<input
								value={evidenceId}
								onChange={(e) => setEvidenceId(e.target.value)}
								placeholder="ID de evidencia..."
								className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
							/>
							<Button
								variant="primary"
								size="sm"
								onClick={() => linkEvidenceMutation.mutate()}
								disabled={!evidenceId.trim() || linkEvidenceMutation.isPending}
							>
								{linkEvidenceMutation.isPending ? (
									<Loader2 size={14} className="animate-spin" />
								) : (
									"Vincular"
								)}
							</Button>
							<button
								type="button"
								onClick={() => {
									setShowLinkEvidence(false);
									setEvidenceId("");
								}}
								className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
							>
								<X size={16} />
							</button>
						</div>
					)}

					{/* Tabs */}
					<div>
						<div className="flex gap-1 border-b border-[var(--border-subtle)]">
							{TABS.map((tab) => (
								<button
									key={tab.id}
									type="button"
									onClick={() => setActiveTab(tab.id)}
									className={[
										"px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-[1px]",
										activeTab === tab.id
											? "border-[var(--color-primary)] text-[var(--color-primary)]"
											: "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
									].join(" ")}
								>
									{tab.label}
								</button>
							))}
						</div>

						<div className="pt-4">
							{activeTab === "tasks" && (
								<TasksTab
									tasks={thread.tasks}
									onUpdateTask={updateTaskMutation.mutate}
									isClosed={isClosed}
								/>
							)}
							{activeTab === "agents" && (
								<AgentsTab agents={thread.agents} threadId={threadId} />
							)}
							{activeTab === "evidence" && (
								<EvidenceTab
									evidenceIds={thread.evidenceIds}
									onUnlink={(evId) => unlinkEvidenceMutation.mutate(evId)}
									isClosed={isClosed}
								/>
							)}
							{activeTab === "timeline" && <TimelineTab events={timeline} />}
						</div>
					</div>

					{/* Close confirmation dialog */}
					{showCloseConfirm && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 ">
							<div className="mx-4 w-full max-w-md rounded-2xl bg-[var(--surface-1)] p-6 shadow-xl">
								<h2 className="text-base font-semibold text-[var(--text-primary)]">
									Cerrar thread
								</h2>
								<p className="mt-2 text-sm text-[var(--text-secondary)]">
									¿Estás seguro de cerrar este thread? Esta acción no se puede
									deshacer.
								</p>
								<div className="mt-4 space-y-2">
									<label className="text-xs font-medium text-[var(--text-secondary)]">
										Nota de cierre (opcional)
									</label>
									<textarea
										value={closeNote}
										onChange={(e) => setCloseNote(e.target.value)}
										placeholder="Motivo del cierre..."
										rows={3}
										maxLength={500}
										className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-primary)] resize-none"
									/>
								</div>
								{closeMutation.isError && (
									<p className="mt-2 text-xs text-[var(--color-danger-text)]">
										{closeMutation.error instanceof Error
											? closeMutation.error.message
											: "Error al cerrar el thread"}
									</p>
								)}
								<div className="mt-6 flex justify-end gap-3">
									<Button
										variant="secondary"
										size="sm"
										onClick={() => {
											setShowCloseConfirm(false);
											setCloseNote("");
										}}
									>
										Cancelar
									</Button>
									<Button
										variant="primary"
										size="sm"
										onClick={() => closeMutation.mutate()}
										disabled={closeMutation.isPending}
									>
										{closeMutation.isPending ? (
											<>
												<Loader2 size={14} className="mr-2 animate-spin" />
												Cerrando...
											</>
										) : (
											"Cerrar thread"
										)}
									</Button>
								</div>
							</div>
						</div>
					)}

					{/* Closed state info */}
					{isClosed && thread.closeNote && (
						<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
							<p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">
								Nota de cierre
							</p>
							<p className="text-sm text-[var(--text-secondary)]">
								{thread.closeNote}
							</p>
							{thread.closedAt && (
								<p className="mt-2 text-2xs text-[var(--text-tertiary)]">
									{new Date(thread.closedAt).toLocaleString("es-PE")}
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ─── Tasks Tab ───────────────────────────────────────────────────────────────

function TasksTab({
	tasks,
	onUpdateTask,
	isClosed,
}: {
	tasks: ThreadTask[];
	onUpdateTask: (args: { taskId: string; data: { status: string } }) => void;
	isClosed: boolean;
}) {
	if (tasks.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 py-8 text-center">
				<Circle size={20} className="text-[var(--text-tertiary)]" />
				<p className="text-sm text-[var(--text-tertiary)]">
					No hay tareas en este thread
				</p>
			</div>
		);
	}

	const sorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);

	return (
		<div className="space-y-2">
			{sorted.map((task) => {
				const badgeStatus = TASK_STATUS_BADGE[task.status] ?? "neutral";

				return (
					<div
						key={task.id}
						className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
					>
						{/* Status indicator */}
						<div className="mt-0.5">
							{task.status === "COMPLETED" ? (
								<CheckCircle2
									size={18}
									className="text-[var(--color-success)]"
								/>
							) : task.status === "FAILED" ? (
								<AlertCircle size={18} className="text-[var(--color-danger)]" />
							) : task.status === "SKIPPED" ? (
								<SkipForward
									size={18}
									className="text-[var(--text-tertiary)]"
								/>
							) : (
								<Circle size={18} className="text-[var(--text-tertiary)]" />
							)}
						</div>

						{/* Content */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<p
									className={`text-sm font-medium ${
										task.status === "COMPLETED" || task.status === "SKIPPED"
											? "text-[var(--text-tertiary)] line-through"
											: "text-[var(--text-primary)]"
									}`}
								>
									{task.title}
								</p>
								<StatusBadge
									status={badgeStatus}
									label={task.status}
									size="sm"
								/>
							</div>

							{task.description && (
								<p className="mt-1 text-xs text-[var(--text-tertiary)]">
									{task.description}
								</p>
							)}

							{task.agentId && (
								<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
									Asignado a: {task.agentId}
								</p>
							)}

							{task.resultSummary && (
								<p className="mt-1 text-xs text-[var(--text-secondary)]">
									{task.resultSummary}
								</p>
							)}

							{/* Actions */}
							{!isClosed &&
								task.status !== "COMPLETED" &&
								task.status !== "SKIPPED" && (
									<div className="mt-2 flex gap-2">
										<button
											type="button"
											onClick={() =>
												onUpdateTask({
													taskId: task.id,
													data: { status: "COMPLETED" },
												})
											}
											className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-2xs font-medium text-[var(--color-success)] hover:bg-[var(--color-success)]/10 transition-colors"
										>
											<Check size={12} />
											Completar
										</button>
										<button
											type="button"
											onClick={() =>
												onUpdateTask({
													taskId: task.id,
													data: { status: "SKIPPED" },
												})
											}
											className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-2xs font-medium text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] transition-colors"
										>
											<SkipForward size={12} />
											Omitir
										</button>
									</div>
								)}
						</div>
					</div>
				);
			})}
		</div>
	);
}

// ─── Agents Tab ──────────────────────────────────────────────────────────────

function AgentsTab({
	agents,
	threadId: _threadId,
}: {
	agents: ThreadAgentAssignment[];
	threadId: string;
}) {
	if (agents.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 py-8 text-center">
				<UserMinus size={20} className="text-[var(--text-tertiary)]" />
				<p className="text-sm text-[var(--text-tertiary)]">
					No hay agentes asignados a este thread
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{agents.map((agent) => (
				<div
					key={agent.agentId}
					className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
				>
					<div className="flex items-center gap-3">
						<div
							className={`flex size-9 items-center justify-center rounded-xl text-sm font-bold ${
								agent.isActive
									? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
									: "bg-[var(--surface-3)] text-[var(--text-tertiary)]"
							}`}
						>
							{agent.agentName.charAt(0)}
						</div>
						<div>
							<p className="text-sm font-medium text-[var(--text-primary)]">
								{agent.agentName}
							</p>
							<div className="flex items-center gap-2 text-2xs text-[var(--text-tertiary)]">
								<StatusBadge status="info" label={agent.role} size="sm" />
								<span>
									{new Date(agent.assignedAt).toLocaleDateString("es-PE")}
								</span>
								{!agent.isActive && (
									<span className="text-[var(--color-danger-text)]">
										Inactivo
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Evidence Tab ────────────────────────────────────────────────────────────

function EvidenceTab({
	evidenceIds,
	onUnlink,
	isClosed,
}: {
	evidenceIds: string[];
	onUnlink: (id: string) => void;
	isClosed: boolean;
}) {
	if (evidenceIds.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 py-8 text-center">
				<Link2 size={20} className="text-[var(--text-tertiary)]" />
				<p className="text-sm text-[var(--text-tertiary)]">
					No hay evidencia vinculada a este thread
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{evidenceIds.map((evId) => (
				<div
					key={evId}
					className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
				>
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-[var(--surface-2)]">
							<Link2 size={16} className="text-[var(--text-tertiary)]" />
						</div>
						<div>
							<p className="text-sm font-mono text-[var(--text-primary)]">
								{evId}
							</p>
						</div>
					</div>
					{!isClosed && (
						<button
							type="button"
							onClick={() => onUnlink(evId)}
							className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-2xs font-medium text-[var(--color-danger-text)] hover:bg-[var(--color-danger)]/10 transition-colors"
						>
							<Unlink size={12} />
							Desvincular
						</button>
					)}
				</div>
			))}
		</div>
	);
}

// ─── Timeline Tab ────────────────────────────────────────────────────────────

function TimelineTab({ events }: { events: TimelineEvent[] }) {
	if (events.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 py-8 text-center">
				<Clock size={20} className="text-[var(--text-tertiary)]" />
				<p className="text-sm text-[var(--text-tertiary)]">Sin eventos</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{events.map((event) => {
				const Icon = TIMELINE_ICONS[event.type];

				return (
					<div
						key={event.id}
						className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
					>
						<div className="mt-0.5 flex size-8 items-center justify-center rounded-xl bg-[var(--surface-2)]">
							<Icon size={14} className="text-[var(--text-tertiary)]" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-[var(--text-primary)]">
								{event.label}
							</p>
							<p className="text-2xs text-[var(--text-tertiary)] mt-0.5">
								{new Date(event.timestamp).toLocaleString("es-PE")}
							</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}
