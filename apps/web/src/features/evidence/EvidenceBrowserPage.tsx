import type {
	EvidenceSource,
	EvidenceStatus,
	EvidenceType,
} from "@drenyra/domain";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

interface EvidenceItem {
	id: string;
	filename: string;
	evidenceType: EvidenceType;
	source: EvidenceSource;
	status: EvidenceStatus;
	sizeBytes: number;
	createdAt: string;
}

const STATUS_BADGE: Record<EvidenceStatus, { label: string; color: string }> = {
	UPLOADED: { label: "Subido", color: "var(--color-warning)" },
	EXTRACTING: { label: "Extrayendo", color: "var(--color-info)" },
	CLASSIFIED: { label: "Clasificado", color: "var(--color-success)" },
	VALIDATED: { label: "Validado", color: "var(--color-success)" },
	REJECTED: { label: "Rechazado", color: "var(--color-danger)" },
	ERROR: { label: "Error", color: "var(--color-danger)" },
};

const TYPE_LABELS: Record<EvidenceType, string> = {
	INVOICE: "Factura",
	RECEIPT: "Recibo",
	CONTRACT: "Contrato",
	BANK_STATEMENT: "Estado de Cuenta",
	EMAIL: "Correo",
	OTHER: "Otro",
};

export function EvidenceBrowserPage() {
	const [filterStatus, setFilterStatus] = useState<EvidenceStatus | "ALL">(
		"ALL",
	);
	const [filterType, setFilterType] = useState<EvidenceType | "ALL">("ALL");
	const [searchQuery, setSearchQuery] = useState("");

	const items: EvidenceItem[] = [];

	const filtered = items.filter((item) => {
		const matchesStatus =
			filterStatus === "ALL" || item.status === filterStatus;
		const matchesType =
			filterType === "ALL" || item.evidenceType === filterType;
		const matchesSearch =
			!searchQuery ||
			item.filename.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesStatus && matchesType && matchesSearch;
	});

	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-8">
					<header className="space-y-4">
						<div className="flex items-center justify-between">
							<h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
								Evidencia
							</h1>
						</div>

						{/* Filters */}
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="relative flex-1 max-w-xs">
								<Search
									size={14}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
								/>
								<input
									type="text"
									placeholder="Buscar por nombre..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] pl-9 pr-3 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
								/>
							</div>

							<div className="flex items-center gap-2">
								<select
									aria-label="Filtrar por estado"
									value={filterStatus}
									onChange={(e) =>
										setFilterStatus(e.target.value as EvidenceStatus | "ALL")
									}
									className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 text-2xs font-bold text-[var(--text-primary)] outline-none"
								>
									<option value="ALL">Todos los estados</option>
									{Object.entries(STATUS_BADGE).map(([key, val]) => (
										<option key={key} value={key}>
											{val.label}
										</option>
									))}
								</select>
								<select
									aria-label="Filtrar por tipo"
									value={filterType}
									onChange={(e) =>
										setFilterType(e.target.value as EvidenceType | "ALL")
									}
									className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 text-2xs font-bold text-[var(--text-primary)] outline-none"
								>
									<option value="ALL">Todos los tipos</option>
									{Object.entries(TYPE_LABELS).map(([key, label]) => (
										<option key={key} value={key}>
											{label}
										</option>
									))}
								</select>
							</div>
						</div>
					</header>

					{/* Table */}
					<div className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
						<table className="w-full">
							<thead>
								<tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
									<th className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
										Archivo
									</th>
									<th className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
										Tipo
									</th>
									<th className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
										Estado
									</th>
									<th className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
										Tamaño
									</th>
									<th className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
										Fecha
									</th>
								</tr>
							</thead>
							<tbody>
								{filtered.length === 0 ? (
									<tr>
										<td colSpan={5} className="px-4 py-12 text-center">
											<p className="text-xs font-bold text-[var(--text-tertiary)]">
												Sin evidencia registrada
											</p>
											<p className="text-2xs text-[var(--text-tertiary)] mt-1">
												Los documentos cargados aparecerán aquí.
											</p>
										</td>
									</tr>
								) : (
									filtered.map((item) => (
										<tr
											key={item.id}
											className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors"
										>
											<td className="px-4 py-3">
												<Link
													to="/evidence/$id"
													params={{ id: item.id }}
													className="text-xs font-bold text-[var(--color-primary)] hover:underline"
												>
													{item.filename}
												</Link>
											</td>
											<td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
												{TYPE_LABELS[item.evidenceType]}
											</td>
											<td className="px-4 py-3">
												<span
													className="inline-block rounded-full px-2 py-0.5 text-2xs font-bold"
													style={{
														backgroundColor: `${STATUS_BADGE[item.status].color}20`,
														color: STATUS_BADGE[item.status].color,
													}}
												>
													{STATUS_BADGE[item.status].label}
												</span>
											</td>
											<td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
												{formatBytes(item.sizeBytes)}
											</td>
											<td className="px-4 py-3 text-xs text-[var(--text-tertiary)]">
												{new Date(item.createdAt).toLocaleDateString()}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}
