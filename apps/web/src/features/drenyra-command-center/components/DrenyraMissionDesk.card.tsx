import type { ReactElement, RefObject } from "react";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MissionPhase } from "./DrenyraMissionDesk.types";

export type DrenyraMissionDeskCardProps = {
	isBusy: boolean;
	filename: string | null;
	phase: MissionPhase;
	inputRef: RefObject<HTMLInputElement | null>;
	onFiles: (files: FileList | null) => void;
	onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
};

/**
 * Drag-&-drop / click-to-upload zone.
 * Acts as the primary input for fiscal documents.
 */
export function DrenyraMissionDeskCard({
	isBusy,
	filename,
	phase,
	inputRef,
	onFiles,
	onDrop,
}: DrenyraMissionDeskCardProps): ReactElement {
	return (
		<div
			onDragOver={(event) => event.preventDefault()}
			onDrop={onDrop}
			className={cn(
				"mt-4 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition",
				isBusy
					? "border-[var(--color-info)]/40 bg-[var(--color-info)]/5"
					: "border-[var(--border-strong)] bg-[var(--surface-1)]/60 hover:border-[var(--color-info)]/50 hover:bg-[var(--color-info)]/5",
			)}
			onClick={() => !isBusy && inputRef.current?.click()}
			role="button"
			tabIndex={0}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					if (!isBusy) inputRef.current?.click();
				}
			}}
		>
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				aria-label="Subir documento"
				accept=".pdf,.xml,application/pdf,text/xml,image/jpeg,image/png"
				onChange={(event) => onFiles(event.target.files)}
			/>
			{isBusy ? (
				<Loader2
					size={28}
					className="animate-spin text-[var(--color-info)]"
					aria-hidden
				/>
			) : (
				<Upload
					size={28}
					className="text-[var(--color-info)]"
					aria-hidden
				/>
			)}
			<p className="mt-3 text-sm font-medium">
				{filename
					? `Procesando ${filename}`
					: "Arrastrá PDF o XML · o hacé clic para elegir"}
			</p>
			<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
				RUC, IGV 18%, UBL 2.1, SIRE — scope peruano automático
			</p>
		</div>
	);
}
