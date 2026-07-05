"use client";

import {
	ArrowRight,
	Menu,
	RefreshCw,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSidebarLayout } from "@/stores/sidebar-layout.store";
import { type ComplianceTab, useCompliance } from "../hooks/useCompliance";
import { ComplianceActionCenter } from "./compliance-view/ComplianceActionCenter";
import { ComplianceSidebar } from "./compliance-view/ComplianceSidebar";
import {
	COMPLIANCE_ACTIONS,
	COMPLIANCE_ACTIVITY,
	TAB_CONFIG,
} from "./compliance-view/data";
import { RoadmapMvpPanel } from "./RoadmapMvpPanel";

const SireManagementTab = lazy(async () =>
	import("./tabs/SireManagementTab").then((module) => ({
		default: module.SireManagementTab,
	})),
);
const RucRegistryTab = lazy(async () =>
	import("./tabs/RucRegistryTab").then((module) => ({
		default: module.RucRegistryTab,
	})),
);
const CpeValidatorTab = lazy(async () =>
	import("./tabs/CpeValidatorTab").then((module) => ({
		default: module.CpeValidatorTab,
	})),
);
const DetraccionesTab = lazy(async () =>
	import("./tabs/DetraccionesTab").then((module) => ({
		default: module.DetraccionesTab,
	})),
);
const RiskMapTab = lazy(async () =>
	import("./tabs/RiskMapTab").then((module) => ({
		default: module.RiskMapTab,
	})),
);

export function ComplianceView(): JSX.Element {
	const {
		activeTab,
		setActiveTab,
		isSyncing,
		lastSync,
		runGlobalSync,
		syncStats,
	} = useCompliance();
	const { setIsMobileOpen } = useSidebarLayout();

	const ActiveTabComponent = {
		sire: SireManagementTab,
		ruc: RucRegistryTab,
		cpe: CpeValidatorTab,
		detracciones: DetraccionesTab,
		risk: RiskMapTab,
	}[activeTab];

	return (
		<div className="flex h-full flex-col overflow-hidden bg-background font-sans text-foreground">
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 2xl:px-8">
					<section className="ui-hero-surface rounded-[28px] p-5 sm:p-6">
						<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
							<div className="min-w-0 space-y-4">
								<div className="flex items-center gap-3">
									<Button
										onClick={() => setIsMobileOpen(true)}
										variant="outline"
										size="icon"
										aria-label="Menú"
										className="h-9 w-9 shrink-0 rounded-xl border-border/60 bg-background hover:bg-muted/35 lg:hidden"
									>
										<Menu className="h-4 w-4 text-muted-foreground" />
									</Button>

									<div className="ui-intelligence-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-label font-semibold uppercase tracking-[0.18em]">
										<ShieldCheck className="h-3.5 w-3.5 text-info" />
										Compliance workspace
									</div>
								</div>

								<div className="space-y-2">
									<p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
										Compliance score
									</p>
									<div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-5">
										<div>
											<h1 className="font-mono text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
												{syncStats.complianceScore}%
											</h1>
											<p className="mt-2 text-sm font-medium text-success">
												RUC coverage {syncStats.rucCoverage} · CPE integrity{" "}
												{syncStats.cpeIntegrity}
											</p>
										</div>

										<div className="grid gap-3 sm:grid-cols-3">
											<MetricPill
												label="Alertas"
												value={String(syncStats.riskAlerts)}
											/>
											<MetricPill
												label="SIRE match"
												value={String(syncStats.sireMatches)}
											/>
											<MetricPill
												label="Detracciones"
												value={String(syncStats.pendingDetractions)}
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="flex shrink-0 flex-wrap gap-3">
								<Button
									variant="outline"
									onClick={() => void runGlobalSync()}
									disabled={isSyncing}
								>
									<RefreshCw
										className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")}
									/>
									{isSyncing ? "Sincronizando..." : "Sincronizar SUNAT"}
								</Button>
								<Button
									onClick={() => setActiveTab("risk")}
									className="min-w-[220px] justify-between"
								>
									Resolver 12 alertas
									<ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</div>
						</div>

						<div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/70 px-4 py-3">
							<p className="text-label font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
								Ultima sincronizacion
							</p>
							<p className="mt-1 text-sm text-[var(--text-secondary)]">
								{lastSync.toLocaleString("es-PE", {
									hour: "2-digit",
									minute: "2-digit",
									day: "2-digit",
									month: "short",
								})}{" "}
								· Proxima auditoria {syncStats.nextScheduled}
							</p>
						</div>
					</section>

					<Card className="ui-intelligence-surface">
						<CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
							<div className="flex min-w-0 gap-4">
								<div className="ui-intelligence-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
									<Sparkles className="h-5 w-5" />
								</div>

								<div className="min-w-0 space-y-2">
									<p className="text-label font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
										Intelligence layer
									</p>
									<div className="space-y-1">
										<h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)] sm:text-lg">
											Prioriza el padron RUC antes de aceptar propuestas
											regulatorias.
										</h2>
										<p className="max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
											Hay un tercero no habido y comprobantes asociados con
											incidente. Resolver esa cadena reduce rechazo SUNAT y
											evita aprobar con soporte incompleto.
										</p>
									</div>
									<div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
										<span className="chip px-2.5 py-1">Confidence 93%</span>
										<span className="chip chip-warning px-2.5 py-1">
											Bloqueo con impacto alto
										</span>
									</div>
								</div>
							</div>

							<div className="flex shrink-0 flex-wrap gap-3">
								<Button onClick={() => setActiveTab("ruc")}>
									Abrir padron RUC
								</Button>
								<Button variant="outline" onClick={() => setActiveTab("cpe")}>
									Revisar CPE
								</Button>
							</div>
						</CardContent>
					</Card>

					<RoadmapMvpPanel />

					<section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
						<ComplianceActionCenter
							actions={COMPLIANCE_ACTIONS}
							onSelectTab={setActiveTab}
						/>
						<ComplianceSidebar
							activity={COMPLIANCE_ACTIVITY}
							syncStats={syncStats}
						/>
					</section>

					<Card className="border-[var(--border-subtle)] bg-[var(--surface-1)]">
						<CardHeader className="border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
							<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
								<div>
									<CardTitle>Superficie de evidencia</CardTitle>
									<CardDescription>
										Cada modulo profundiza la decision seleccionada sin perder
										el contexto operativo.
									</CardDescription>
								</div>

								<div className="flex flex-wrap gap-2">
									{(Object.keys(TAB_CONFIG) as ComplianceTab[]).map((tabId) => {
										const tab = TAB_CONFIG[tabId];

										return (
											<Button
												key={tabId}
												variant={activeTab === tabId ? "default" : "outline"}
												size="sm"
												onClick={() => setActiveTab(tabId)}
												className="rounded-xl"
											>
												<tab.icon className="mr-2 h-4 w-4" />
												{tab.label}
											</Button>
										);
									})}
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-5 sm:p-6">
							<div className="mb-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/65 p-4">
								<p className="text-label font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
									Modulo activo
								</p>
								<p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
									{TAB_CONFIG[activeTab].label}
								</p>
								<p className="mt-1 text-sm text-[var(--text-secondary)]">
									{TAB_CONFIG[activeTab].description}
								</p>
							</div>

							<Suspense fallback={<ComplianceTabSkeleton tab={activeTab} />}>
								<ActiveTabComponent />
							</Suspense>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

function MetricPill({
	label,
	value,
}: {
	label: string;
	value: string;
}): JSX.Element {
	return (
		<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/80 px-4 py-3">
			<p className="text-label uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
				{label}
			</p>
			<p className="mt-2 font-mono text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
				{value}
			</p>
		</div>
	);
}

function ComplianceTabSkeleton({ tab }: { tab: ComplianceTab }): JSX.Element {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="h-3 w-28 rounded-full bg-muted/60" />
				<div className="h-8 w-56 rounded-xl bg-muted/45" />
			</div>
			<div className="grid gap-3 md:grid-cols-3">
				{Array.from({ length: 3 }).map((_, index) => (
					<div
						key={`${tab}-kpi-${index}`}
						className="h-24 rounded-2xl border border-border/50 bg-muted/25"
					/>
				))}
			</div>
			<div className="h-64 rounded-2xl border border-border/50 bg-muted/20" />
		</div>
	);
}
