"use client";

import { Trash2 } from "lucide-react";
import { createElement } from "react";
import { cn } from "@/lib/utils";
import type { DocumentItem } from "@/stores/central-board-store";
import {
	formatFileSize,
	getFileIcon,
	STATUS_CONFIG,
} from "../DocumentsList.data";

interface DocumentRowProps {
	doc: DocumentItem;
	onRemove: (id: string) => void;
	onPreview: (doc: DocumentItem) => void;
}

function renderFileIcon(type: DocumentItem["type"]) {
	return createElement(getFileIcon(type), {
		size: 18,
		className: "text-[var(--text-secondary)]",
	});
}

export function DocumentRow({ doc, onRemove, onPreview }: DocumentRowProps) {
	const status = STATUS_CONFIG[doc.status];
	const isUploadingDoc = doc.status === "processing";
	const isReady = doc.status === "ready";

	const rowClassName = cn(
		"group flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 transition-all",
		isReady &&
			"hover:border-[var(--border-default)] hover:bg-[var(--surface-2)]/30",
		isUploadingDoc && "opacity-70",
	);

	return (
		<div className={rowClassName}>
			{isReady ? (
				<button
					type="button"
					onClick={() => onPreview(doc)}
					className="flex min-w-0 flex-1 items-center gap-3 text-left"
				>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
						{renderFileIcon(doc.type)}
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-xs font-medium text-[var(--text-primary)]">
							{doc.name}
						</p>
						<div className="mt-0.5 flex items-center gap-2">
							<span className="text-2xs text-[var(--text-muted)]">
								{formatFileSize(doc.size)}
							</span>
							<span
								className={cn(
									"inline-flex items-center gap-1 text-2xs",
									status.className,
								)}
							>
								{createElement(status.icon, { size: 10 })}
								{status.label}
							</span>
						</div>
					</div>
				</button>
			) : (
				<>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
						{renderFileIcon(doc.type)}
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-xs font-medium text-[var(--text-primary)]">
							{doc.name}
						</p>
						<div className="mt-0.5 flex items-center gap-2">
							<span className="text-2xs text-[var(--text-muted)]">
								{formatFileSize(doc.size)}
							</span>
							<span
								className={cn(
									"inline-flex items-center gap-1 text-2xs",
									status.className,
								)}
							>
								{createElement(status.icon, {
									size: 10,
									className: isUploadingDoc ? "animate-spin" : "",
								})}
								{status.label}
							</span>
						</div>
					</div>
				</>
			)}

			{isReady && (
				<button
					type="button"
					onClick={() => onRemove(doc.id)}
					className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 transition-all hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] group-hover:opacity-100"
					aria-label={`Eliminar ${doc.name}`}
				>
					<Trash2 size={14} />
				</button>
			)}
		</div>
	);
}
