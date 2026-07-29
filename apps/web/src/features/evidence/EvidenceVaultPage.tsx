import { Button } from "@/components/ui/button";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { useState } from "react";
import { EvidenceSearchBar } from "./components/EvidenceSearchBar";
import { EvidenceTable } from "./components/EvidenceTable";
import { EvidenceUploadZone } from "./components/EvidenceUploadZone";
import { type EvidenceFilters, useEvidenceList } from "./hooks/useEvidence";

const PAGE_SIZE = 25;

export function EvidenceVaultPage() {
	const { availableCompanies, companyContext, fiscalPeriod } = useActiveCompanyContext();
	const [filters, setFilters] = useState<EvidenceFilters>({
		companyId: companyContext.companyId ?? undefined,
		period: fiscalPeriod ?? undefined,
		limit: PAGE_SIZE,
		offset: 0,
	});
	const evidence = useEvidenceList(filters);

	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-6">
					<header><h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Bóveda de evidencia</h1><p className="mt-1 text-sm text-[var(--text-tertiary)]">Buscá, verificá y trazá los documentos de respaldo.</p></header>
					<EvidenceUploadZone />
					<EvidenceSearchBar filters={filters} onFiltersChange={setFilters} companies={availableCompanies} />
					{evidence.isPending && <div className="rounded-2xl border border-[var(--border-subtle)] p-12 text-center text-sm text-[var(--text-tertiary)]">Cargando evidencia...</div>}
					{evidence.isError && <div className="rounded-2xl border border-[var(--border-subtle)] p-12 text-center"><p className="text-sm font-semibold text-[var(--text-primary)]">No se pudo cargar la evidencia</p><p className="mt-1 text-xs text-[var(--text-tertiary)]">{evidence.error.message}</p><Button className="mt-4" variant="outline" onClick={() => evidence.refetch()}>Reintentar</Button></div>}
					{evidence.data && evidence.data.data.length === 0 && <div className="rounded-2xl border border-[var(--border-subtle)] p-12 text-center"><p className="text-sm font-semibold text-[var(--text-primary)]">Sin evidencia registrada</p><p className="mt-1 text-xs text-[var(--text-tertiary)]">Los documentos cargados aparecerán aquí.</p></div>}
					{evidence.data && evidence.data.data.length > 0 && <EvidenceTable items={evidence.data.data} total={evidence.data.total} limit={filters.limit ?? PAGE_SIZE} offset={filters.offset ?? 0} onPageChange={(offset) => setFilters({ ...filters, offset })} />}
				</div>
			</div>
		</div>
	);
}
