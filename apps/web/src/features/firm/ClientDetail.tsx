import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	Banknote,
	BarChart3,
	Clock,
	FileText,
	Receipt,
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
	{ id: "invoices", label: "Comprobantes", icon: Receipt },
	{ id: "banking", label: "Bancos", icon: Banknote },
	{ id: "taxes", label: "Impuestos", icon: ShieldCheck },
	{ id: "reports", label: "Reportes", icon: BarChart3 },
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
						<dt className="text-2xs text-[var(--text-tertiary)]">RUC</dt>
						<dd className="font-mono text-xs font-bold text-[var(--text-primary)]">
							{data.ruc}
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

function InvoicesTab({ ruc, period }: { ruc: string; period: string }) {
	const items = [
		{ label: "Facturas emitidas", count: 428, status: "verified" },
		{ label: "Notas de crédito", count: 12, status: "verified" },
		{ label: "Notas de débito", count: 3, status: "warning" },
		{ label: "Compras registradas", count: 156, status: "verified" },
		{ label: "Pendientes de validación", count: 7, status: "warning" },
	] as const;

	return (
		<div className="space-y-4">
			<p className="text-xs text-[var(--text-tertiary)]">
				Comprobantes del período {period} · RUC {ruc}
			</p>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{items.map((item) => (
					<div
						key={item.label}
						className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
					>
						<div className="flex items-center justify-between gap-2">
							<span className="text-xs font-medium text-[var(--text-primary)]">
								{item.label}
							</span>
							<span
								className={`text-xs font-bold tabular-nums ${item.status === "verified" ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}
							>
								{item.count}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function BankingTab({ ruc, period }: { ruc: string; period: string }) {
	const accounts = [
		{
			bank: "BCP",
			type: "Cuenta corriente",
			number: "191-1234567-0-00",
			balance: 8420,
		},
		{ bank: "Scotiabank", type: "CTE", number: "123-456789", balance: 15300 },
	];

	return (
		<div className="space-y-4">
			<p className="text-xs text-[var(--text-tertiary)]">
				Cuentas bancarias · {period} · RUC {ruc}
			</p>
			<div className="grid gap-3 sm:grid-cols-2">
				{accounts.map((acc) => (
					<div
						key={acc.number}
						className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
					>
						<div className="flex items-center justify-between gap-2">
							<div>
								<p className="text-xs font-semibold text-[var(--text-primary)]">
									{acc.bank}
								</p>
								<p className="text-2xs text-[var(--text-tertiary)]">
									{acc.type} · {acc.number}
								</p>
							</div>
							<p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
								S/ {acc.balance.toLocaleString()}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function TaxesTab(_props: { ruc: string; period: string }) {
	return (
		<div className="grid gap-4 sm:grid-cols-2">
			<section className="rounded-xl border border-[var(--border-subtle)] p-4">
				<h3 className="text-xs font-semibold text-[var(--text-primary)]">
					IGV del período
				</h3>
				<p className="mt-2 text-lg font-bold tabular-nums text-[var(--color-success)]">
					S/ 12,450
				</p>
				<p className="text-2xs text-[var(--text-tertiary)]">
					428 comprobantes · crédito fiscal
				</p>
			</section>
			<section className="rounded-xl border border-[var(--border-subtle)] p-4">
				<h3 className="text-xs font-semibold text-[var(--text-primary)]">
					Renta 3ra categoría
				</h3>
				<p className="mt-2 text-lg font-bold tabular-nums text-[var(--color-warning)]">
					S/ 3,280
				</p>
				<p className="text-2xs text-[var(--text-tertiary)]">Ene–Jul 2026</p>
			</section>
			<section className="rounded-xl border border-[var(--border-subtle)] p-4">
				<h3 className="text-xs font-semibold text-[var(--text-primary)]">
					Detracciones
				</h3>
				<p className="mt-2 text-lg font-bold tabular-nums text-[var(--color-warning)]">
					S/ 4,200
				</p>
				<p className="text-2xs text-[var(--text-tertiary)]">
					3 proveedores con SPOT pendiente
				</p>
			</section>
			<section className="rounded-xl border border-[var(--border-subtle)] p-4">
				<h3 className="text-xs font-semibold text-[var(--text-primary)]">
					SIRE
				</h3>
				<p className="mt-2 text-lg font-bold tabular-nums text-[var(--color-danger)]">
					3 inconsistencias
				</p>
				<p className="text-2xs text-[var(--text-tertiary)]">
					Bloquean validación del período
				</p>
			</section>
		</div>
	);
}

function ReportsTab({ ruc, period }: { ruc: string; period: string }) {
	const items = [
		{ label: "Balance general", to: "/reportes/balance" },
		{ label: "Estado de resultados", to: "/reportes/resultados" },
		{ label: "Flujo de caja", to: "/reportes/flujo" },
		{ label: "Libro diario", to: "/reportes/libro-diario" },
	];

	return (
		<div className="space-y-4">
			<p className="text-xs text-[var(--text-tertiary)]">
				Reportes · {period} · RUC {ruc}
			</p>
			<div className="grid gap-3 sm:grid-cols-2">
				{items.map((item) => (
					<a
						key={item.label}
						href={item.to}
						className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 transition-colors hover:bg-[var(--surface-2)]"
					>
						<span className="text-xs font-medium text-[var(--text-primary)]">
							{item.label}
						</span>
						<span className="text-2xs text-[var(--color-primary)]">
							Abrir →
						</span>
					</a>
				))}
			</div>
		</div>
	);
}

function EvidenceTab({ ruc }: { ruc: string }) {
	return (
		<div className="space-y-4">
			<p className="text-xs text-[var(--text-tertiary)]">
				Vault de evidencia — RUC {ruc}
			</p>
			<div className="grid gap-3 sm:grid-cols-3">
				{["CDR", "XML", "PDF", "SIRE", "UBL", "Reportes"].map((type) => (
					<div
						key={type}
						className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 text-center"
					>
						<p className="text-xs font-semibold text-[var(--text-primary)]">
							{type}
						</p>
						<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
							Docs vinculados
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

function HistoryTab() {
	const events = [
		{
			time: "Hoy 09:15",
			event: "Conciliación bancaria generada",
			source: "Agente conciliador",
		},
		{
			time: "Ayer 16:40",
			event: "3 comprobantes validados por SUNAT",
			source: "Validador SUNAT",
		},
		{ time: "Ayer 11:20", event: "Detracción aplicada", source: "Sistema" },
		{ time: "24 jun", event: "Cierre mensual iniciado", source: "Contador" },
	];

	return (
		<div className="space-y-3">
			<p className="text-xs text-[var(--text-tertiary)]">
				Historial de actividad fiscal
			</p>
			{events.map((item) => (
				<div
					key={`${item.time}-${item.event}`}
					className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3"
				>
					<div className="min-w-0 flex-1">
						<p className="text-xs font-medium text-[var(--text-primary)]">
							{item.event}
						</p>
						<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
							{item.time} · {item.source}
						</p>
					</div>
				</div>
			))}
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

	const activePeriod = data.activePeriod ?? "";

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

			<div className="flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)]">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors -mb-px ${
								isActive
									? "border-[var(--color-primary)] text-[var(--text-primary)]"
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
			{activeTab === "invoices" && (
				<InvoicesTab ruc={data.ruc} period={activePeriod} />
			)}
			{activeTab === "banking" && (
				<BankingTab ruc={data.ruc} period={activePeriod} />
			)}
			{activeTab === "taxes" && (
				<TaxesTab ruc={data.ruc} period={activePeriod} />
			)}
			{activeTab === "reports" && (
				<ReportsTab ruc={data.ruc} period={activePeriod} />
			)}
			{activeTab === "evidence" && <EvidenceTab ruc={data.ruc} />}
			{activeTab === "history" && <HistoryTab />}
		</div>
	);
}

function BackLink() {
	return (
		<a
			href="/firm/clients"
			className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
		>
			<ArrowLeft size={14} /> Volver a empresas
		</a>
	);
}
