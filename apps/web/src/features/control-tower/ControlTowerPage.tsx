import { Building2, Inbox, ShieldAlert } from "lucide-react";
import { AgentSessionsSection } from "./components/AgentSessionsSection";
import { useControlTower } from "./hooks/useControlTower";

function riskColor(level: string): string {
	switch (level) {
		case "CRITICAL":
			return "var(--color-danger)";
		case "HIGH":
			return "var(--color-warning)";
		case "MEDIUM":
			return "var(--color-info)";
		default:
			return "var(--color-success)";
	}
}

export function CentroDeOperacionesPage() {
	const { data, isLoading, isError } = useControlTower();

	if (isLoading) {
		return (
			<div className="flex-1 p-10 text-xs text-[var(--text-tertiary)]">
				Cargando Control Tower…
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div className="flex-1 p-10 text-xs text-[var(--color-danger)]">
				No se pudo cargar el portafolio multi-RUC.
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-10 space-y-8">
				<header className="space-y-2">
					<div className="flex items-center gap-2">
						<Building2 size={22} className="text-[var(--color-info)]" />
						<h1 className="text-2xl font-bold tracking-tight">Control Tower</h1>
					</div>
					<p className="text-xs text-[var(--text-tertiary)] max-w-2xl">
						Vista firma multi-RUC — salud fiscal, documentos pendientes y
						obligaciones por empresa. Período {data.period}.
					</p>
				</header>

				<AgentSessionsSection />

				{data.buzonSol.status !== "AUTH_READY" && (
					<div className="rounded-2xl border border-dashed border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 p-4 flex items-start gap-3">
						<Inbox size={18} className="text-[var(--color-warning)] mt-0.5" />
						<div className="flex-1">
							<p className="text-xs font-semibold text-[var(--text-secondary)]">
								Buzón SOL no está conectado
							</p>
							<p className="text-2xs text-[var(--text-tertiary)] mt-1">
								Conectá SUNAT para sincronizar notificaciones y obligaciones
								automáticamente.
							</p>
							<button
								type="button"
								className="mt-2 text-2xs font-medium text-[var(--color-primary)] hover:underline"
							>
								Configurar conexión
							</button>
						</div>
					</div>
				)}

				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{data.companies.map((company) => (
						<article
							key={company.companyId}
							className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 space-y-4"
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<h2 className="text-sm font-bold text-[var(--text-primary)]">
										{company.businessName}
									</h2>
									<p className="text-2xs text-[var(--text-tertiary)]">
										RUC {company.ruc}
									</p>
								</div>
								<span
									className="text-xs font-bold tabular-nums"
									style={{ color: riskColor(company.globalRiskLevel) }}
								>
									{company.healthScore}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-3 text-2xs">
								<div>
									<p className="text-[var(--text-tertiary)]">Docs pendientes</p>
									<p className="font-bold text-[var(--text-primary)]">
										{company.pendingDocuments}
									</p>
								</div>
								<div>
									<p className="text-[var(--text-tertiary)]">
										Expedientes abiertos
									</p>
									<p className="font-bold text-[var(--text-primary)]">
										{company.pendingExpedientes}
									</p>
								</div>
								<div>
									<p className="text-[var(--text-tertiary)]">Obligaciones</p>
									<p className="font-bold text-[var(--text-primary)]">
										{company.obligationsDue}
									</p>
								</div>
								<div>
									<p className="text-[var(--text-tertiary)]">Próximo venc.</p>
									<p className="font-bold text-[var(--text-primary)]">
										{company.nextDeadline ?? "—"}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2 text-2xs text-[var(--text-tertiary)]">
								<ShieldAlert
									size={14}
									style={{ color: riskColor(company.globalRiskLevel) }}
								/>
								Riesgo {company.globalRiskLevel}
							</div>
						</article>
					))}
				</div>
			</div>
		</div>
	);
}
