import { useState, useMemo, useCallback } from "react";
import { Search, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEvidenceList, useValidateEvidence, useBatchValidate } from "../hooks/useEvidence";
import type { EvidenceSearchFilters } from "../api";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
	UPLOADED: { label: "Subido", color: "var(--color-warning)" },
	EXTRACTING: { label: "Extrayendo", color: "var(--color-info)" },
	CLASSIFIED: { label: "Clasificado", color: "var(--color-success)" },
	VALIDATED: { label: "Validado", color: "var(--color-success)" },
	REJECTED: { label: "Rechazado", color: "var(--color-danger)" },
	ERROR: { label: "Error", color: "var(--color-danger)" },
};

const TYPE_LABELS: Record<string, string> = {
	INVOICE: "Factura",
	RECEIPT: "Recibo",
	CONTRACT: "Contrato",
	BANK_STATEMENT: "Estado de Cuenta",
	EMAIL: "Correo",
	XML: "XML",
	CDR: "CDR",
	PDF: "PDF",
	OTHER: "Otro",
};

const SOURCE_LABELS: Record<string, string> = {
	UPLOAD: "Upload",
	EMAIL: "Email",
	API: "API",
	SYNC: "Sync",
	SUNAT: "SUNAT",
};

export function EvidenceVaultPage() {
	const [filters, setFilters] = useState<EvidenceSearchFilters>({});
	const { data, isLoading } = useEvidenceList(filters);
	const validateMutation = useValidateEvidence();
	const batchMutation = useBatchValidate();
	const [searchText, setSearchText] = useState("");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [filterType, setFilterType] = useState("ALL");
	const [filterStatus, setFilterStatus] = useState("ALL");

	const items = data?.data ?? [];

	const filtered = useMemo(
		() =>
			items.filter((item) => {
				const matchesType = filterType === "ALL" || item.evidenceType === filterType;
				const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;
				const matchesSearch =
					!searchText ||
					item.filename.toLowerCase().includes(searchText.toLowerCase());
				return matchesType && matchesStatus && matchesSearch;
			}),
		[items, filterType, filterStatus, searchText],
	);

	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			setFilters((prev) => ({ ...prev, q: searchText || undefined }));
		},
		[searchText],
	);

	const toggleSelect = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const handleBatchValidate = useCallback(() => {
		if (selectedIds.size === 0) return;
		batchMutation.mutate(Array.from(selectedIds));
	}, [selectedIds, batchMutation]);

	const handleValidate = useCallback(
		(id: string) => {
			validateMutation.mutate(id);
		},
		[validateMutation],
	);

	return (
		<div className="flex h-full flex-col bg-[var(--surface-1)]">
			{/* Header */}
			<div className="border-b border-[var(--border-subtle)] px-8 py-6">
				<div className="mx-auto flex max-w-6xl items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)]">
							<FileText size={22} strokeWidth={2.5} />
						</div>
						<div>
							<h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
								Evidence Vault
							</h1>
							<p className="text-xs text-[var(--text-secondary)]">
								{data?.total ?? 0} documentos &middot;{" "}
								{items.filter((i) => i.status === "VALIDATED").length} validados
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{selectedIds.size > 0 && (
							<button
								type="button"
								onClick={handleBatchValidate}
								disabled={batchMutation.isPending}
								className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
							>
								{batchMutation.isPending ? (
									<Loader2 size={14} className="animate-spin" />
								) : (
									<CheckCircle2 size={14} />
								)}
								Validar ({selectedIds.size})
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Search + Filters */}
			<div className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-8 py-3">
				<div className="mx-auto flex max-w-6xl items-center gap-3">
					<form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
						<Search
							size={14}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
						/>
						<input
							type="text"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							placeholder="Buscar documentos..."
							className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] py-1.5 pl-9 pr-3 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
						/>
					</form>

					<select
						value={filterType}
						onChange={(e) => setFilterType(e.target.value)}
						className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] outline-none"
						aria-label="Filtrar por tipo"
					>
						<option value="ALL">Todos los tipos</option>
						{Object.entries(TYPE_LABELS).map(([key, label]) => (
							<option key={key} value={key}>{label}</option>
						))}
					</select>

					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
						className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] outline-none"
						aria-label="Filtrar por estado"
					>
						<option value="ALL">Todos los estados</option>
						{Object.entries(STATUS_BADGE).map(([key, val]) => (
							<option key={key} value={key}>{val.label}</option>
						))}
					</select>
				</div>
			</div>

			{/* Table */}
			<div className="flex-1 overflow-y-auto px-8 py-6">
				<div className="mx-auto max-w-6xl">
					{isLoading ? (
						<div className="flex items-center justify-center py-16">
							<Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
						</div>
					) : filtered.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-8 py-16 text-center">
							<FileText size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
							<p className="text-sm font-medium text-[var(--text-primary)]">
								No se encontraron documentos
							</p>
							<p className="text-xs text-[var(--text-secondary)] mt-1">
								Subí documentos o ajustá los filtros de búsqueda.
							</p>
						</div>
					) : (
						<div className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
							<table className="w-full">
								<thead>
									<tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
										<th className="w-8 px-3 py-3">
											<input
												type="checkbox"
												onChange={() => {
													if (selectedIds.size === filtered.length) {
														setSelectedIds(new Set());
													} else {
														setSelectedIds(new Set(filtered.map((i) => i.id)));
													}
												}}
												checked={selectedIds.size === filtered.length && filtered.length > 0}
												className="rounded"
											/>
										</th>
										<th className="text-left px-3 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Archivo</th>
										<th className="text-left px-3 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Tipo</th>
										<th className="text-left px-3 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Fuente</th>
										<th className="text-left px-3 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Estado</th>
										<th className="text-left px-3 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Tamaño</th>
										<th className="text-left px-3 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Fecha</th>
										<th className="w-20 px-3 py-3" />
									</tr>
								</thead>
								<tbody>
									{filtered.map((item) => (
										<tr key={item.id} className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors">
											<td className="px-3 py-3">
												<input
													type="checkbox"
													checked={selectedIds.has(item.id)}
													onChange={() => toggleSelect(item.id)}
													className="rounded"
												/>
											</td>
											<td className="px-3 py-3">
												<Link
													to="/evidence/$id"
													params={{ id: item.id }}
													className="text-xs font-bold text-[var(--color-primary)] hover:underline"
												>
													{item.filename}
												</Link>
											</td>
											<td className="px-3 py-3 text-xs text-[var(--text-secondary)]">
												{TYPE_LABELS[item.evidenceType] ?? item.evidenceType}
											</td>
											<td className="px-3 py-3">
												<span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-2xs font-medium text-[var(--text-muted)]">
													{SOURCE_LABELS[item.source] ?? item.source}
												</span>
											</td>
											<td className="px-3 py-3">
												<span
													className="inline-block rounded-full px-2 py-0.5 text-2xs font-bold"
													style={{
														backgroundColor: `${STATUS_BADGE[item.status]?.color ?? "var(--color-warning)"}20`,
														color: STATUS_BADGE[item.status]?.color ?? "var(--color-warning)",
													}}
												>
													{STATUS_BADGE[item.status]?.label ?? item.status}
												</span>
											</td>
											<td className="px-3 py-3 text-xs text-[var(--text-secondary)]">
												{formatBytes(item.sizeBytes)}
											</td>
											<td className="px-3 py-3 text-xs text-[var(--text-muted)]">
												{new Date(item.createdAt).toLocaleDateString()}
											</td>
											<td className="px-3 py-3">
												{item.status !== "VALIDATED" && (
													<button
														type="button"
														onClick={() => handleValidate(item.id)}
														disabled={validateMutation.isPending}
														className="text-2xs font-medium text-[var(--color-primary)] hover:underline disabled:opacity-50"
													>
														Validar
													</button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
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
