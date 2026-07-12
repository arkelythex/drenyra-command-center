"use client";

import { Loader2, Upload } from "lucide-react";
import type { ReactElement } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { INBOX_ACCEPT, INBOX_EXAMPLE_FILES } from "../inbox.config";
import type { InboxUiPhase } from "../inbox.schema";

type InboxUploadZoneProps = {
	phase: InboxUiPhase;
	onFilesSelected: (files: File[]) => void;
};

export function InboxUploadZone({
	phase,
	onFilesSelected,
}: InboxUploadZoneProps): ReactElement {
	const inputRef = useRef<HTMLInputElement>(null);
	const isBusy = phase === "uploading" || phase === "processing";

	const handleFiles = (list: FileList | null) => {
		if (!list || list.length === 0 || isBusy) return;
		onFilesSelected(Array.from(list));
	};

	const onDrop = (event: React.DragEvent<HTMLButtonElement>) => {
		event.preventDefault();
		handleFiles(event.dataTransfer.files);
	};

	return (
		<button
			type="button"
			onDragOver={(event) => event.preventDefault()}
			onDrop={onDrop}
			className={cn(
				"flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-6 text-center transition",
				isBusy
					? "border-[var(--color-info)]/40 bg-[var(--color-info)]/5"
					: "border-[var(--border-strong)] bg-[var(--surface-1)]/60 hover:border-[var(--color-info)]/50",
			)}
			onClick={() => !isBusy && inputRef.current?.click()}
		>
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				multiple
				accept={INBOX_ACCEPT}
				aria-label="Subir archivo"
				onChange={(event) => handleFiles(event.target.files)}
			/>
			{isBusy ? (
				<Loader2
					size={32}
					className="animate-spin text-[var(--color-info)]"
					aria-hidden
				/>
			) : (
				<Upload size={32} className="text-[var(--color-info)]" aria-hidden />
			)}
			<p className="mt-4 text-sm font-semibold">
				{phase === "uploading"
					? "Subiendo archivos…"
					: phase === "processing"
						? "Procesando batch…"
						: "Arrastrá facturas acá o hacé click"}
			</p>
			<ul className="mt-4 space-y-1 text-2xs text-[var(--text-tertiary)]">
				{INBOX_EXAMPLE_FILES.map((example) => (
					<li key={example.label}>
						📄 {example.label} · {example.hint}
					</li>
				))}
			</ul>
		</button>
	);
}
