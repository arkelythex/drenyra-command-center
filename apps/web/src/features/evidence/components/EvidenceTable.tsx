import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { EvidenceItem } from "../hooks/useEvidence";

const STATUS_LABELS = {
	UPLOADED: "Subido",
	EXTRACTING: "Extrayendo",
	CLASSIFIED: "Clasificado",
	VALIDATED: "Validado",
	REJECTED: "Rechazado",
	ERROR: "Error",
} as const;

interface EvidenceTableProps {
	items: EvidenceItem[];
	total: number;
	limit: number;
	offset: number;
	onPageChange: (offset: number) => void;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function EvidenceTable({ items, total, limit, offset, onPageChange }: EvidenceTableProps) {
	const currentPage = Math.floor(offset / limit) + 1;
	const pages = Math.max(1, Math.ceil(total / limit));

	return (
		<div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
			<div className="overflow-x-auto">
				<table className="w-full min-w-[760px]">
					<thead className="bg-[var(--surface-2)] text-left text-2xs uppercase tracking-wider text-[var(--text-tertiary)]">
						<tr><th className="px-4 py-3">Archivo</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Tamaño</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Origen</th></tr>
					</thead>
					<tbody>
						{items.map((item) => (
							<tr key={item.id} className="border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
								<td className="px-4 py-3 font-semibold"><Link to="/evidence/$id" params={{ id: item.id }} className="text-[var(--color-primary)] hover:underline">{item.filename}</Link></td>
								<td className="px-4 py-3">{item.evidenceType}</td>
								<td className="px-4 py-3"><span className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-2xs font-semibold">{STATUS_LABELS[item.status]}</span></td>
								<td className="px-4 py-3">{formatBytes(item.sizeBytes)}</td>
								<td className="px-4 py-3">{new Date(item.createdAt).toLocaleDateString()}</td>
								<td className="px-4 py-3">{item.source}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-3 text-xs text-[var(--text-tertiary)]">
				<span>Página {currentPage} de {pages} · {total} resultados</span>
				<div className="flex gap-2"><Button variant="outline" size="sm" disabled={offset === 0} onClick={() => onPageChange(Math.max(0, offset - limit))}>Anterior</Button><Button variant="outline" size="sm" disabled={offset + limit >= total} onClick={() => onPageChange(offset + limit)}>Siguiente</Button></div>
			</div>
		</div>
	);
}
