"use client";

/**
 * Details tab components extracted from RightPanel.
 *
 * Shows thread metadata, status, dates, skills, and RUC/period context.
 * Supports inline title editing.
 */

import { Check, FileText, Pencil, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import type { Thread } from "@/stores/thread-store";
import { useThreadStore } from "@/stores/thread-store";
import { LabelValue } from "./RightPanel.context-cards";

// ─── Details tab ──────────────────────────────────────────────────────────────

export function DetailsTab() {
	const threads = useThreadStore((s) => s.threads);
	const activeThreadId = useThreadStore((s) => s.activeThreadId);
	const renameThread = useThreadStore((s) => s.renameThread);
	const thread = threads.find((t) => t.id === activeThreadId);

	if (!thread) {
		return (
			<div className="flex h-full flex-col items-center justify-center text-center px-6">
				<FileText size={32} className="text-[var(--text-muted)] mb-3" />
				<p className="text-sm text-[var(--text-muted)]">
					Ningún caso seleccionado
				</p>
				<p className="mt-1 text-xs text-[var(--text-muted)]">
					Seleccioná un caso del panel lateral para ver sus detalles
				</p>
			</div>
		);
	}

	return <ThreadDetailContent thread={thread} onRename={renameThread} />;
}

// ─── Thread detail content ────────────────────────────────────────────────────

function ThreadDetailContent({
	thread,
	onRename,
}: {
	thread: Thread;
	onRename: (id: string, title: string) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [editValue, setEditValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	function handleStartEdit() {
		setEditValue(thread.title);
		setEditing(true);
		requestAnimationFrame(() => inputRef.current?.select());
	}

	function handleSave() {
		const trimmed = editValue.trim();
		if (trimmed && trimmed !== thread.title) {
			onRename(thread.id, trimmed);
		}
		setEditing(false);
	}

	function handleCancel() {
		setEditing(false);
	}

	return (
		<div className="space-y-5 p-4">
			<div>
				<div className="flex items-center gap-2">
					{editing ? (
						<div className="flex flex-1 items-center gap-1">
							<input
								aria-label="Edit thread title"
								ref={inputRef}
								value={editValue}
								onChange={(e) => setEditValue(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleSave();
									if (e.key === "Escape") handleCancel();
								}}
								onBlur={handleSave}
								className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
								autoFocus
							/>
							<button
								type="button"
								aria-label="Guardar"
								onClick={handleSave}
								className="rounded-lg p-1 text-[var(--color-success)] transition-colors hover:bg-[var(--color-success)]/10"
							>
								<Check size={12} />
							</button>
							<button
								type="button"
								aria-label="Cancelar"
								onClick={handleCancel}
								className="rounded-lg p-1 text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10"
							>
								<X size={12} />
							</button>
						</div>
					) : (
						<>
							<h3 className="flex-1 truncate text-sm font-semibold text-[var(--text-primary)]">
								{thread.title}
							</h3>
							<button
								type="button"
								aria-label="Editar título"
								onClick={handleStartEdit}
								className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
							>
								<Pencil size={12} />
							</button>
						</>
					)}
				</div>
			</div>

			<div className="space-y-2">
				<LabelValue label="Estado">
					<span
						className={cn(
							"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
							thread.status === "active" &&
								"bg-[var(--color-success)]/10 text-[var(--color-success)]",
							thread.status === "pinned" &&
								"bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
							thread.status === "archived" &&
								"bg-[var(--text-muted)]/10 text-[var(--text-muted)]",
						)}
					>
						{thread.status}
					</span>
				</LabelValue>

				<LabelValue label="Creado">
					<span className="text-xs text-[var(--text-secondary)]">
						{formatDate(thread.createdAt)}
					</span>
				</LabelValue>

				<LabelValue label="Actualizado">
					<span className="text-xs text-[var(--text-secondary)]">
						{formatDate(thread.updatedAt)}
					</span>
				</LabelValue>

				<LabelValue label="Mensajes">
					<span className="text-xs font-mono text-[var(--text-primary)]">
						{thread.messageCount}
					</span>
				</LabelValue>
			</div>

			{thread.context?.skills && thread.context.skills.length > 0 && (
				<div>
					<p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
						Skills utilizados
					</p>
					<div className="flex flex-wrap gap-1.5">
						{thread.context.skills.map((skill) => (
							<span
								key={skill}
								className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-2xs font-medium text-[var(--text-secondary)]"
							>
								{skill}
							</span>
						))}
					</div>
				</div>
			)}

			{thread.context && (thread.context.ruc || thread.context.period) && (
				<div>
					<p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
						Context
					</p>
					<div className="space-y-1.5">
						{thread.context.ruc && (
							<LabelValue label="RUC">
								<span className="font-mono text-xs text-[var(--text-primary)]">
									{thread.context.ruc}
								</span>
							</LabelValue>
						)}
						{thread.context.period && (
							<LabelValue label="Periodo">
								<span className="text-xs text-[var(--text-primary)]">
									{thread.context.period}
								</span>
							</LabelValue>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
