import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Building2, ShieldCheck, Users } from "lucide-react";

interface FirmMetrics {
	totalClients: number;
	activeClients: number;
	pendingReviews: number;
	complianceScore: number;
}

interface AlertItem {
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	message: string;
	createdAt: string;
}

interface DashboardData {
	organizationId: string;
	organizationName: string;
	organizationRuc: string;
	metrics: FirmMetrics;
	recentActivity: string[];
	alerts: AlertItem[];
}

async function fetchDashboard(): Promise<DashboardData> {
	const res = await fetch("/api/firm/dashboard", { credentials: "include" });
	const json = await res.json();
	if (!json.success) throw new Error(json.error ?? "Failed to load dashboard");
	return json.data;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
	CRITICAL: { bg: "var(--color-danger)", text: "var(--color-danger)" },
	HIGH: { bg: "var(--color-warning)", text: "var(--color-warning)" },
	MEDIUM: { bg: "var(--color-info)", text: "var(--color-info)" },
	LOW: { bg: "var(--color-success)", text: "var(--color-success)" },
};

const SEVERITY_LABELS: Record<string, string> = {
	CRITICAL: "Crítico",
	HIGH: "Alto",
	MEDIUM: "Medio",
	LOW: "Bajo",
};

function KpiCard({
	icon: Icon,
	label,
	value,
	color,
}: {
	icon: typeof Building2;
	label: string;
	value: string | number;
	color: string;
}) {
	return (
		<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 space-y-3">
			<div className="flex items-center gap-2">
				<Icon size={16} style={{ color }} />
				<span className="text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
					{label}
				</span>
			</div>
			<p className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
				{value}
			</p>
		</div>
	);
}

export function FirmDashboard() {
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["firm", "dashboard"],
		queryFn: fetchDashboard,
	});

	if (isLoading) {
		return (
			<div className="flex-1 p-10 flex items-center justify-center">
				<p className="text-xs text-[var(--text-tertiary)]">
					Cargando dashboard...
				</p>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex-1 p-10 flex items-center justify-center">
				<div className="text-center space-y-2">
					<AlertTriangle
						size={24}
						className="mx-auto text-[var(--color-danger)]"
					/>
					<p className="text-xs font-bold text-[var(--color-danger)]">
						Error al cargar el dashboard
					</p>
					<p className="text-2xs text-[var(--text-tertiary)]">
						{error instanceof Error ? error.message : "Intente nuevamente"}
					</p>
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex-1 p-10 flex items-center justify-center">
				<p className="text-xs text-[var(--text-tertiary)]">
					No hay datos disponibles
				</p>
			</div>
		);
	}

	const { metrics } = data;

	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<div className="flex items-center gap-2">
					<Building2 size={22} className="text-[var(--color-info)]" />
					<h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
						Dashboard de Firma
					</h1>
				</div>
				<p className="text-xs text-[var(--text-tertiary)]">
					{data.organizationName} — RUC {data.organizationRuc}
				</p>
			</header>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<KpiCard
					icon={Building2}
					label="Total Clientes"
					value={metrics.totalClients}
					color="var(--color-info)"
				/>
				<KpiCard
					icon={Users}
					label="Clientes Activos"
					value={metrics.activeClients}
					color="var(--color-success)"
				/>
				<KpiCard
					icon={AlertTriangle}
					label="Revisiones Pendientes"
					value={metrics.pendingReviews}
					color="var(--color-warning)"
				/>
				<KpiCard
					icon={ShieldCheck}
					label="Cumplimiento"
					value={`${metrics.complianceScore}%`}
					color="var(--color-primary)"
				/>
			</div>

			{data.alerts.length > 0 && (
				<section className="space-y-3">
					<h2 className="text-sm font-bold text-[var(--text-primary)]">
						Alertas Recientes
					</h2>
					<div className="space-y-2">
						{data.alerts.map((alert, i) => {
							const style =
								SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.LOW;
							return (
								<div
									key={i}
									className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] p-3"
								>
									<span
										className="mt-0.5 inline-block size-2 shrink-0 rounded-full"
										style={{ backgroundColor: style.bg }}
									/>
									<div className="flex-1 min-w-0">
										<p className="text-xs text-[var(--text-primary)]">
											{alert.message}
										</p>
										<p className="text-2xs text-[var(--text-tertiary)] mt-1">
											{SEVERITY_LABELS[alert.severity] ?? alert.severity} ·{" "}
											{new Date(alert.createdAt).toLocaleDateString()}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			)}
		</div>
	);
}
