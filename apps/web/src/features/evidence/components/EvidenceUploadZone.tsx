import { Upload } from "lucide-react";
import { useState } from "react";

export function EvidenceUploadZone() {
	const [isDragging, setIsDragging] = useState(false);
	const [hasDroppedFiles, setHasDroppedFiles] = useState(false);

	return (
		<button
			type="button"
			className="w-full rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-2)] p-6 text-center"
			onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
			onDragOver={(event) => event.preventDefault()}
			onDragLeave={() => setIsDragging(false)}
			onDrop={(event) => { event.preventDefault(); setIsDragging(false); setHasDroppedFiles(event.dataTransfer.files.length > 0); }}
		>
			<Upload size={24} className={isDragging ? "mx-auto text-[var(--color-primary)]" : "mx-auto text-[var(--text-tertiary)]"} />
			<p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Arrastrá documentos para cargar</p>
			<p className="mt-1 text-xs text-[var(--text-tertiary)]">La carga V2 todavía no está disponible. Usá el flujo de carga existente para registrar evidencia.</p>
			{hasDroppedFiles && <p className="mt-3 text-xs font-medium text-[var(--text-secondary)]">Los archivos no se cargaron porque el endpoint de carga V2 no está disponible.</p>}
		</button>
	);
}
