import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Clock } from "lucide-react";

interface ClientDetailData {
	id: string;
	name: string;
	ruc: string;
	slug: string;
	status: string;
	healthScore: number | null;
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

export function ClientDetail({ clientId }: { clientId: string }) {
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["firm", "client", clientId],
		queryFn: () => fetchClient(clientId),
		enabled: Boolean(clientId),
	});

	if (isLoading) {
		return (
			<div className="space-y-6">
				<a
					href="/firm/clients"
					className="inline-flex items-center gap-1.5 text-2xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
				>
					<ArrowLeft size={14} />
					Volver a clientes
				</a>
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
			<div className="space-y-6">
				<a
					href="/firm/clients"
					className="inline-flex items-center gap-1.5 text-2xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
				>
					<ArrowLeft size={14} />
					Volver a clientes
				</a>
				<div className="flex items-center justify-center py-12">
					<div className="text-center space-y-2">
						<AlertTriangle
							size={24}
							className="mx-auto text-[var(--color-danger)]"
						/>
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
			<div className="space-y-6">
				<a
					href="/firm/clients"
					className="inline-flex items-center gap-1.5 text-2xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
				>
					<ArrowLeft size={14} />
					Volver a clientes
				</a>
				<div className="flex items-center justify-center py-12">
					<p className="text-xs text-[var(--text-tertiary)]">
						Cliente no encontrado
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<a
				href="/firm/clients"
				className="inline-flex items-center gap-1.5 text-2xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
			>
				<ArrowLeft size={14} />
				Volver a clientes
			</a>

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
						<div className="flex justify-between">
							<dt className="text-2xs text-[var(--text-tertiary)]">
								Última actualización
							</dt>
							<dd className="text-xs font-bold text-[var(--text-primary)]">
								{new Date(data.updatedAt).toLocaleDateString()}
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
			</div>
		</div>
	);
}
