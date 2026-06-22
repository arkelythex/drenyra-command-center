import { AlertCircle, BrainCircuit, RefreshCw } from "lucide-react";
import { useIntelligenceDashboard } from "../hooks/useIntelligence";
import { AnomalyWidget } from "./intelligence-dashboard/AnomalyWidget";
import { CashflowWidget } from "./intelligence-dashboard/CashflowWidget";
import { ComplianceWidget } from "./intelligence-dashboard/ComplianceWidget";
import { DocumentWidget } from "./intelligence-dashboard/DocumentWidget";
import { SupplierWidget } from "./intelligence-dashboard/SupplierWidget";
import { MetricCard, MetricCardSkeleton } from "./widgets/MetricCard";

export function IntelligenceDashboard() {
	const {
		isLoading,
		isError,
		metrics,
		anomalies,
		cashflow,
		obligations,
		supplier,
		documents,
		lastUpdated,
		refetch,
	} = useIntelligenceDashboard();

	return (
		<div className="mx-auto max-w-7xl px-6 py-8">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="p-3 rounded-xl bg-[var(--color-primary)]/10">
							<BrainCircuit className="w-6 h-6 text-[var(--color-primary)]" />
						</div>
						<div>
							<h1 className="n font-black tracking-tight text-foreground leading-none mb-1">
								Inteligencia Fiscal
							</h1>
							<p className="text-sm text-[var(--text-secondary)]">
								Dashboard unificado de los 5 pilares de inteligencia fiscal
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs text-[var(--text-muted)]">
							{lastUpdated &&
								`Actualizado ${new Date(lastUpdated).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`}
						</span>
						<button
							type="button"
							onClick={refetch}
							disabled={isLoading}
							className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
						>
							<RefreshCw
								className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
							/>
							Actualizar
						</button>
					</div>
				</div>
			</div>

			{/* Error state */}
			{isError && (
				<div className="mb-6 p-4 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 flex items-center gap-3">
					<AlertCircle className="w-5 h-5 text-[var(--color-danger)] shrink-0" />
					<p className="text-sm text-[var(--color-danger)]">
						Error al cargar datos de inteligencia. Verifica la conexión con los
						servicios.
					</p>
				</div>
			)}

			{/* Metric cards row */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				{isLoading && !metrics.length
					? [...Array(4)].map((_, i) => (
							<MetricCardSkeleton key={`skeleton-${i}`} />
						))
					: metrics.map((m) => <MetricCard key={m.id} metric={m} />)}
			</div>

			{/* Main grid: 2-column layout */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				{/* Row 1: Anomalies (full width on mobile, left on desktop) */}
				<div className="lg:col-span-1">
					<AnomalyWidget items={anomalies} isLoading={isLoading} />
				</div>
				<div className="lg:col-span-1">
					<ComplianceWidget items={obligations} isLoading={isLoading} />
				</div>
			</div>

			{/* Row 2: Cashflow + Supplier */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<div className="lg:col-span-1">
					<CashflowWidget data={cashflow} isLoading={isLoading} />
				</div>
				<div className="lg:col-span-1">
					<SupplierWidget data={supplier} isLoading={isLoading} />
				</div>
			</div>

			{/* Row 3: Documents */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="lg:col-span-1">
					<DocumentWidget data={documents} isLoading={isLoading} />
				</div>
				<div className="lg:col-span-1">
					{/* Placeholder for future expansion */}
				</div>
			</div>
		</div>
	);
}
