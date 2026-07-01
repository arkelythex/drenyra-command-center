import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

interface AlertItem {
	severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	message: string;
	companyId?: string;
	createdAt: string;
}

interface AlertsResponse {
	alerts: AlertItem[];
	total: number;
}

async function fetchAlerts(
	limit: number,
	offset: number,
): Promise<AlertsResponse> {
	const params = new URLSearchParams({
		limit: String(limit),
		offset: String(offset),
	});
	const res = await fetch(`/api/firm/alerts?${params.toString()}`, {
		credentials: "include",
	});
	const json = await res.json();
	if (!json.success) throw new Error(json.error ?? "Failed to load alerts");
	return json.data;
}

const SEVERITY_CONFIG: Record<
	string,
	{ bg: string; text: string; label: string }
> = {
	CRITICAL: {
		bg: "var(--color-danger)",
		text: "var(--color-danger)",
		label: "Crítico",
	},
	HIGH: {
		bg: "var(--color-warning)",
		text: "var(--color-warning)",
		label: "Alto",
	},
	MEDIUM: {
		bg: "var(--color-info)",
		text: "var(--color-info)",
		label: "Medio",
	},
	LOW: {
		bg: "var(--color-success)",
		text: "var(--color-success)",
		label: "Bajo",
	},
};

export function AlertsPanel({ limit = 10 }: { limit?: number }) {
	const { data, isLoading, isError } = useQuery({
		queryKey: ["firm", "alerts", limit, 0],
		queryFn: () => fetchAlerts(limit, 0),
	});

	return (
		<section className="space-y-3">
			<div className="flex items-center gap-2">
				<AlertTriangle size={16} className="text-[var(--color-warning)]" />
				<h2 className="text-sm font-bold text-[var(--text-primary)]">
					Alertas
				</h2>
				{data && data.total > 0 && (
					<span className="rounded-full bg-[var(--color-danger)] px-1.5 py-0.5 text-3xs font-bold text-white">
						{data.total}
					</span>
				)}
			</div>

			{isLoading && (
				<p className="text-2xs text-[var(--text-tertiary)] py-4 text-center">
					Cargando alertas...
				</p>
			)}

			{isError && (
				<p className="text-2xs text-[var(--color-danger)] py-4 text-center">
					Error al cargar alertas
				</p>
			)}

			{data && data.alerts.length === 0 && (
				<p className="text-2xs text-[var(--text-tertiary)] py-4 text-center">
					Sin alertas pendientes
				</p>
			)}

			{data && data.alerts.length > 0 && (
				<div className="space-y-2">
					{data.alerts.map((alert, i) => {
						const config =
							SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.LOW;
						return (
							<div
								key={i}
								className="flex items-start gap-2.5 rounded-xl border border-[var(--border-subtle)] p-3"
							>
								<span
									className="mt-0.5 inline-block size-2 shrink-0 rounded-full"
									style={{ backgroundColor: config.bg }}
								/>
								<div className="flex-1 min-w-0">
									<p className="text-xs text-[var(--text-primary)] leading-relaxed">
										{alert.message}
									</p>
									<div className="flex items-center gap-2 mt-1">
										<span
											className="text-2xs font-bold"
											style={{ color: config.text }}
										>
											{config.label}
										</span>
										<span className="text-2xs text-[var(--text-tertiary)]">
											{new Date(alert.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}
