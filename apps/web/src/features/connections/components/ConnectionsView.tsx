import {
	Search,
	Globe,
	Zap,
	RefreshCw,
	Plus,
	Link2,
	CheckCircle2,
	Sparkles,
	Blocks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SettingsShell } from "@/features/settings/components/SettingsShell";
import { useConnections } from "../hooks/useConnections";
import { IntegrationCard } from "./IntegrationCard";
import { OseReadinessCard } from "./OseReadinessCard";
import { useOseReadiness } from "../hooks/useOseReadiness";

export const ConnectionsView = () => {
	const {
		activeView,
		setActiveView,
		searchQuery,
		setSearchQuery,
		filteredIntegrations,
		connectedCount,
		totalCount,
		availableCount,
	} = useConnections();
	const oseReadinessQuery = useOseReadiness();

	const viewOptions = [
		{ id: "all" as const, label: "Catálogo global", icon: Globe },
		{ id: "my" as const, label: "Mis herramientas", icon: Zap },
	];

	return (
		<SettingsShell
			title="Integraciones"
			description="Conecta banca, facturación SUNAT, pagos y más servicios."
			icon={Blocks}
		>
			<div className="space-y-12">
				{/* === METRICS & VIEW TOGGLE === */}
				<section className="space-y-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div className="flex items-center p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
							{viewOptions.map((v) => {
								const Icon = v.icon;
								const isActive = activeView === v.id;
								return (
									<button
										key={v.id}
										onClick={() => setActiveView(v.id)}
										className={cn(
											"flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
											isActive
												? "bg-white dark:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] shadow-sm ring-1 ring-black/5 dark:ring-white/5"
												: "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
										)}
									>
										<Icon size={14} strokeWidth={2} />
										{v.label}
									</button>
								);
							})}
						</div>

						<div className="relative w-full sm:w-64">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
							<input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Buscar integraciones"
								aria-label="Buscar conexión"
								className="w-full h-9 rounded-xl border border-[var(--color-stroke-1)] bg-[var(--color-surface-1)] pl-9 pr-3 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] outline-none transition-colors focus:border-[var(--color-info)]/40 focus:ring-1 focus:ring-[var(--color-info)]/20"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						{[
							{
								label: "Total",
								value: totalCount,
								icon: Link2,
								color: "text-[var(--color-text-secondary)]",
								bg: "bg-[var(--color-surface-2)]",
							},
							{
								label: "Conectadas",
								value: connectedCount,
								icon: CheckCircle2,
								color: "text-[var(--color-success)]",
								bg: "bg-[var(--color-success)]/8",
							},
							{
								label: "Disponibles",
								value: availableCount,
								icon: Sparkles,
								color: "text-[var(--color-info)]",
								bg: "bg-[var(--color-info)]/8",
							},
						].map((metric) => {
							const Icon = metric.icon;
							return (
								<div
									key={metric.label}
									className="rounded-2xl border border-[var(--color-stroke-1)] bg-[var(--color-surface-2)]/50 p-4 flex items-center gap-3 backdrop-blur-sm"
								>
									<span
										className={cn("rounded-xl p-2.5", metric.bg, metric.color)}
									>
										<Icon size={15} strokeWidth={1.5} />
									</span>
									<div>
										<p className="text-3xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
											{metric.label}
										</p>
										<p className="text-lg font-bold text-[var(--color-text-primary)]">
											{metric.value}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</section>

				{/* === OSE READINESS === */}
				<section className="border-t border-[var(--color-stroke-1)] pt-12 space-y-6">
					<div className="space-y-1">
						<h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-info)]">
							Estado OSE
						</h2>
						<p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
							Proveedor de Servicios Electrónicos para facturación ante SUNAT.
						</p>
					</div>
					<OseReadinessCard
						readiness={oseReadinessQuery.data}
						isLoading={oseReadinessQuery.isLoading}
						isError={oseReadinessQuery.isError}
					/>
				</section>

				{/* === INTEGRATIONS GRID === */}
				<section className="border-t border-[var(--color-stroke-1)] pt-12 space-y-6">
					<div className="space-y-1">
						<h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-info)]">
							{activeView === "all" ? "Catálogo global" : "Mis herramientas"}
						</h2>
						<p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
							{activeView === "all"
								? `${filteredIntegrations.length} integraciones disponibles.`
								: `${filteredIntegrations.length} herramientas conectadas.`}
						</p>
					</div>

					{filteredIntegrations.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-[var(--color-stroke-2)] py-12 text-center space-y-2">
							<p className="text-xs font-bold text-[var(--color-text-primary)]">
								No hay integraciones para este filtro
							</p>
							<p className="text-xs text-[var(--color-text-muted)]">
								Probá con otro término o cambiá a "Catálogo global".
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
							{filteredIntegrations.map((app) => (
								<IntegrationCard key={app.id} app={app} />
							))}

							<div className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-stroke-2)] bg-[var(--color-surface-2)]/50 text-center transition-all duration-200 hover:border-[var(--color-info)]/30 hover:bg-[var(--color-info)]/4">
								<div className="space-y-3 p-8">
									<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-stroke-1)] bg-[var(--color-surface-3)] text-[var(--color-text-muted)] transition-colors duration-200 group-hover:text-[var(--color-info)]">
										<Plus size={22} strokeWidth={1.5} />
									</div>
									<h4 className="text-xs font-bold text-[var(--color-text-primary)]">
										Solicitar integración
									</h4>
									<p className="text-xs leading-relaxed text-[var(--color-text-muted)] max-w-[200px]">
										¿Te falta una herramienta? Envianos tu solicitud.
									</p>
								</div>
							</div>
						</div>
					)}
				</section>

				{/* === SYNC === */}
				<section className="border-t border-[var(--color-stroke-1)] pt-12 space-y-6">
					<div className="space-y-1">
						<h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-info)]">
							Sincronización
						</h2>
						<p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
							Estado de sincronización en tiempo real con servicios externos.
						</p>
					</div>
					<div className="rounded-2xl border border-[var(--color-stroke-1)] bg-[var(--color-surface-2)]/50 p-5 backdrop-blur-sm">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-start gap-3">
								<span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface-3)] text-[var(--color-text-secondary)]">
									<RefreshCw size={16} strokeWidth={1.5} />
								</span>
								<div>
									<h3 className="text-xs font-bold text-[var(--color-text-primary)]">
										Sincronización continua
									</h3>
									<p className="mt-0.5 text-xs text-[var(--color-text-muted)] leading-relaxed">
										Última sincronización hace 2 minutos. Estado general:
										estable.
									</p>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-8 px-3 text-2xs font-bold"
							>
								Forzar sincronización
							</Button>
						</div>
					</div>
				</section>
			</div>
		</SettingsShell>
	);
};
