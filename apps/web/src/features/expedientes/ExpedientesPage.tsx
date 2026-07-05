import type { ExpedienteFiscal, ExpedienteKind } from "@drenyra/domain";
import { FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Route } from "@/routes/cumplimiento/expedientes";
import { ExpedienteCard } from "./components/ExpedienteCard";
import { ExpedienteDetail } from "./components/ExpedienteDetail";
import { ExpedienteFilters } from "./components/ExpedienteFilters";
import { useExpedientes } from "./hooks/useExpedientes";

export function ExpedientesPage() {
	const { periodo, kind: kindFromSearch, q } = Route.useSearch();
	const [searchQuery, setSearchQuery] = useState(q ?? "");
	const [selectedKind, setSelectedKind] = useState<ExpedienteKind | "ALL">(
		kindFromSearch ?? "ALL",
	);
	const [selectedExpediente, setSelectedExpediente] =
		useState<ExpedienteFiscal | null>(null);

	useEffect(() => {
		if (q) setSearchQuery(q);
	}, [q]);

	useEffect(() => {
		if (kindFromSearch) setSelectedKind(kindFromSearch);
	}, [kindFromSearch]);

	const {
		data: expedientes = [],
		isLoading,
		isError,
	} = useExpedientes({
		kind: selectedKind === "ALL" ? undefined : selectedKind,
		periodo,
	});

	const normalized = searchQuery.trim().toLowerCase();

	const filtered = expedientes.filter((e) => {
		const matchesSearch =
			!normalized ||
			e.titulo.toLowerCase().includes(normalized) ||
			e.companyName.toLowerCase().includes(normalized);
		const matchesKind = selectedKind === "ALL" || e.kind === selectedKind;
		return matchesSearch && matchesKind;
	});

	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-8">
					{/* Header */}
					<header className="space-y-4">
						<div className="flex items-center gap-2">
							<FolderOpen
								size={22}
								className="text-[var(--color-info)]"
								strokeWidth={1.5}
							/>
							<h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
								Expedientes Fiscales
							</h1>
						</div>
						<p className="text-xs text-[var(--text-tertiary)] max-w-2xl">
							Dossiers verificables que agrupan documentos, evidencia, análisis
							de agentes y aprobaciones por período fiscal.
							{periodo ? (
								<span className="ml-1 font-semibold text-[var(--text-secondary)]">
									Filtro activo: {periodo}
								</span>
							) : null}
						</p>
					</header>

					{/* Filters + Search */}
					<ExpedienteFilters
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						selectedKind={selectedKind}
						onKindChange={setSelectedKind}
					/>

					{/* Content: List + Detail */}
					<div className="grid gap-6 lg:grid-cols-[1fr_420px]">
						{/* Expediente List */}
						<div className="space-y-2">
							{isLoading ? (
								<div className="rounded-2xl border border-[var(--border-subtle)] py-12 text-center text-xs text-[var(--text-tertiary)]">
									Cargando expedientes…
								</div>
							) : isError ? (
								<div className="rounded-2xl border border-[var(--border-subtle)] py-12 text-center text-xs text-[var(--color-danger)]">
									No se pudieron cargar los expedientes.
								</div>
							) : filtered.length === 0 ? (
								<div className="rounded-2xl border border-[var(--border-subtle)] py-12 text-center">
									<FolderOpen
										size={32}
										className="mx-auto text-[var(--text-disabled)]"
									/>
									<p className="mt-3 text-xs font-bold text-[var(--text-tertiary)]">
										Sin expedientes
									</p>
									<p className="mt-1 text-2xs text-[var(--text-disabled)]">
										Creá tu primer expediente fiscal para empezar.
									</p>
								</div>
							) : (
								filtered.map((exp) => (
									<ExpedienteCard
										key={exp.id}
										expediente={exp}
										isSelected={selectedExpediente?.id === exp.id}
										onSelect={setSelectedExpediente}
									/>
								))
							)}
						</div>

						{/* Detail Panel */}
						{selectedExpediente ? (
							<ExpedienteDetail expediente={selectedExpediente} />
						) : (
							<div className="hidden lg:flex items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/50 p-10">
								<div className="text-center space-y-2">
									<FolderOpen
										size={28}
										className="mx-auto text-[var(--text-disabled)]"
									/>
									<p className="text-xs font-bold text-[var(--text-tertiary)]">
										Seleccioná un expediente
									</p>
									<p className="text-2xs text-[var(--text-disabled)]">
										El detalle aparecerá aquí.
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
