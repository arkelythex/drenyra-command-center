import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	Clock,
	ExternalLink,
	FileText,
	Layers,
	ScrollText,
	ShieldCheck,
	Users,
} from "lucide-react";
import { useState } from "react";

interface ClientDetailData {
	id: string;
	name: string;
	ruc: string;
	slug: string;
	status: string;
	healthScore: number | null;
	regime?: string;
	activePeriod?: string;
	completion?: number;
	riskLevel?: "low" | "medium" | "high" | "critical";
	settings: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

async function fetchClient(id: string): Promise<ClientDetailData> {
	const res = await fetch(`/api/firm/clients/${id}`, {
		credentials: "include",
	});
	const json = await res.json();
	if (!json.success) throw new Error(json.error ?? "Failed to load client");
	return json.data;
}

const STATUS_LABELS: Record<string, string> = {
	ACTIVE: "Activo",
	SUSPENDED: "Suspendido",
	INACTIVE: "Inactivo",
};

function healthColor(score: number | null): string {
	if (score === null) return "var(--text-tertiary)";
	if (score >= 70) return "var(--color-success)";
	if (score >= 40) return "var(--color-warning)";
	return "var(--color-danger)";
}

function healthLabel(score: number | null): string {
	if (score === null) return "Sin datos";
	if (score >= 70) return "Saludable";
	if (score >= 40) return "En observación";
	return "Crítico";
}

const RISK_COLORS: Record<string, string> = {
	low: "var(--color-success)",
	medium: "var(--color-warning)",
	high: "var(--color-danger)",
	critical: "var(--color-danger)",
};

const TABS = [
	{ id: "summary", label: "Resumen", icon: Users },
	{ id: "missions", label: "Misiones", icon: Layers },
	{ id: "evidence", label: "Evidencia", icon: FileText },
	{ id: "history", label: "Historial", icon: ScrollText },
] as const;

type TabId = (typeof TABS)[number]["id"];

function SummaryTab({ data }: { data: ClientDetailData }) {
	return (
		<div className="grid gap-4 sm:grid-cols-2">
			<section className="rounded-2xl border border-[var(--border-subtle)] p-5 space-y-4">
				<h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
					Información General
				</h2>
				<dl className="space-y-3">
					<div className="flex justify-between">
						<dt className="text-2xs text-[var(--text-tertiary)]">Estado</dt>
						<dd className="text-xs font-bold text-[var(--text-primary)]">
							{STATUS_LABELS[data.status] ?? data.status}
						</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-2xs text-[var(--text-tertiary)]">Régimen</dt>
						<dd className="text-xs font-bold text-[var(--text-primary)]">
							{data.regime ?? "—"}
						</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-2xs text-[var(--text-tertiary)]">
							Periodo activo
						</dt>
						<dd className="text-xs font-bold text-[var(--text-primary)]">
							{data.activePeriod ?? "—"}
						</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-2xs text-[var(--text-tertiary)]">Slug</dt>
						<dd className="text-xs font-bold text-[var(--text-primary)]">
							{data.slug}
						</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-2xs text-[var(--text-tertiary)]">Creado</dt>
						<dd className="text-xs font-bold text-[var(--text-primary)]">
							{new Date(data.createdAt).toLocaleDateString()}
						</dd>
					</div>
				</dl>
			</section>

			<section className="rounded-2xl border border-[var(--border-subtle)] p-5 space-y-4">
				<h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
					Health Score
				</h2>
				<div className="flex flex-col items-center gap-2 py-4">
					<p
						className="text-4xl font-bold tabular-nums"
						style={{ color: healthColor(data.healthScore) }}
					>
						{data.healthScore ?? "—"}
					</p>
					<p
						className="text-xs font-bold"
						style={{ color: healthColor(data.healthScore) }}
					>
						{healthLabel(data.healthScore)}
					</p>
				</div>
			</section>

			{data.completion !== undefined && (
				<section className="rounded-2xl border border-[var(--border-subtle)] p-5 space-y-4">
					<h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
						Avance contable
					</h2>
					<div className="flex flex-col items-center gap-2 py-2">
						<div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
							<div
								className="h-full rounded-full transition-all"
								style={{
									width: `${data.completion}%`,
									backgroundColor:
										data.completion >= 80
											? "var(--color-success)"
											: data.completion >= 40
												? "var(--color-warning)"
												: "var(--color-danger)",
								}}
							/>
						</div>
						<p className="text-xs font-bold text-[var(--text-primary)]">
							{data.completion}% completo
						</p>
					</div>
				</section>
			)}

			{data.riskLevel && (
				<section className="rounded-2xl border border-[var(--border-subtle)] p-5 space-y-4">
					<h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
						Riesgo
					</h2>
					<div className="flex flex-col items-center gap-2 py-4">
						<ShieldCheck
							size={32}
							style={{
								color: RISK_COLORS[data.riskLevel] ?? "var(--text-tertiary)",
							}}
						/>
						<p
							className="text-xs font-bold capitalize"
							style={{
								color: RISK_COLORS[data.riskLevel] ?? "var(--text-tertiary)",
							}}
						>
							{data.riskLevel === "critical" ? "Crítico" : data.riskLevel}
						</p>
					</div>
				</section>
			)}
		</div>
	);
}

function MissionsTab({ clientId }: { clientId: string }) {
	return (
		<div className="space-y-4">
			<p className="text-xs text-[var(--text-tertiary)]">
				Misiones activas para este cliente.
			</p>
			<a
				href="/cierre-mensual"
				className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
			>
				<Layers size={16} />
				Ir al cierre mensual
				<ExternalLink size={12} className="text-[var(--text-tertiary)]" />
			</a>
		</div>
	);
}

function EvidenceTab({ clientId }: { clientId: string }) {
	return (
		<div className="space-y-4">
			<p className="text-xs text-[var(--text-tertiary)]">
				Documentos y evidencia para este cliente.
			</p>
			<a
				href="/evidence"
				className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
			>
				<FileText size={16} />
				Ver vault de evidencia
				<ExternalLink size={12} className="text-[var(--text-tertiary)]" />
			</a>
		</div>
	);
}

function HistoryTab({ clientId }: { clientId: string }) {
	return (
		<div className="space-y-4">
			<p className="text-xs text-[var(--text-tertiary)]">
				Historial de actividad del agente para este cliente.
			</p>
		</div>
	);
}

export function ClientDetail({ clientId }: { clientId: string }) {
	const [activeTab, setActiveTab] = useState<TabId>("summary");
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["firm", "client", clientId],
		queryFn: () => fetchClient(clientId),
		enabled: Boolean(clientId),
	});

	if (isLoading) {
		return (
			<div className="space-y-6 p-4 sm:p-6">
				<BackLink />
				<div className="flex items-center justify-center py-12">
					<Clock
						size={24}
						className="text-[var(--text-tertiary)] animate-pulse"
					/>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="space-y-6 p-4 sm:p-6">
				<BackLink />
				<div className="flex items-center justify-center py-12">
					<div className="text-center space-y-2">
						<p className="text-xs font-bold text-[var(--color-danger)]">
							Error al cargar el cliente
						</p>
						<p className="text-2xs text-[var(--text-tertiary)]">
							{error instanceof Error ? error.message : "Intente nuevamente"}
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="space-y-6 p-4 sm:p-6">
				<BackLink />
				<div className="flex items-center justify-center py-12">
					<p className="text-xs text-[var(--text-tertiary)]">
						Cliente no encontrado
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4 sm:p-6">
			<BackLink />

			<header className="space-y-2">
				<div className="flex items-center gap-3">
					<h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
						{data.name}
					</h1>
					<span
						className="inline-block rounded-full px-2 py-0.5 text-2xs font-bold"
						style={{
							backgroundColor: `${healthColor(data.healthScore)}20`,
							color: healthColor(data.healthScore),
						}}
					>
						{healthLabel(data.healthScore)}
					</span>
				</div>
				<p className="text-xs text-[var(--text-tertiary)] font-mono">
					RUC {data.ruc}
				</p>
			</header>

			{/* Tabs */}
			<div className="flex gap-1 border-b border-[var(--border-subtle)]">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
								isActive
									? "border-[var(--color-accent)] text-[var(--text-primary)]"
									: "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
							}`}
						>
							<Icon size={14} />
							{tab.label}
						</button>
					);
				})}
			</div>

			{activeTab === "summary" && <SummaryTab data={data} />}
			{activeTab === "missions" && <MissionsTab clientId={clientId} />}
			{activeTab === "evidence" && <EvidenceTab clientId={clientId} />}
			{activeTab === "history" && <HistoryTab clientId={clientId} />}
		</div>
	);
}

function BackLink() {
	return (
		<a
			href="/firm/clients"
			className="inline-flex items-center gap-1.5 text-2xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
		>
			<ArrowLeft size={14} />
			Volver a clientes
		</a>
	);
}
