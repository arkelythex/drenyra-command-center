import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	Clock,
	Loader2,
	Plus,
	RefreshCw,
	Search,
} from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { threadsListQueryOptions } from "./query-options";
import type { ThreadSummary } from "./threads.types";

// ─── Status badge mapping ────────────────────────────────────────────────────

const STATUS_BADGE: Record<
	string,
	{
		status: "success" | "warning" | "danger" | "info" | "neutral" | "pending";
		label: string;
	}
> = {
	DRAFT: { status: "neutral", label: "Borrador" },
	ACTIVE: { status: "info", label: "Activo" },
	BLOCKED: { status: "danger", label: "Bloqueado" },
	PENDING_REVIEW: { status: "warning", label: "Revisión pendiente" },
	AWAITING_INFO: { status: "pending", label: "Esperando info" },
	REVIEWED: { status: "success", label: "Revisado" },
	CLOSED: { status: "neutral", label: "Cerrado" },
};

function getStatusBadge(status: string) {
	return STATUS_BADGE[status] ?? { status: "neutral" as const, label: status };
}

// ─── Relative time helper ────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
	const now = Date.now();
	const date = new Date(dateStr).getTime();
	const diffMs = now - date;
	const diffMin = Math.floor(diffMs / 60_000);

	if (diffMin < 1) return "ahora";
	if (diffMin < 60) return `hace ${diffMin} min`;
	const diffHrs = Math.floor(diffMin / 60);
	if (diffHrs < 24) return `hace ${diffHrs} h`;
	const diffDays = Math.floor(diffHrs / 24);
	if (diffDays < 7) return `hace ${diffDays} d`;
	return new Date(dateStr).toLocaleDateString("es-PE", {
		day: "numeric",
		month: "short",
	});
}

// ─── ThreadCard ──────────────────────────────────────────────────────────────

function ThreadCard({ thread }: { thread: ThreadSummary }) {
	const badge = getStatusBadge(thread.status);
	const progress =
		thread.taskCount > 0
			? Math.round((thread.completedTaskCount / thread.taskCount) * 100)
			: 0;

	return (
		<Link
			to="/threads/$threadId"
			params={{ threadId: thread.id }}
			className="block rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 transition-all hover:border-[var(--border-default)] hover:shadow-sm"
		>
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1 space-y-2">
					{/* Title + Status */}
					<div className="flex items-center gap-2">
						<p className="truncate text-sm font-semibold text-[var(--text-primary)]">
							{thread.title}
						</p>
						<StatusBadge status={badge.status} label={badge.label} size="sm" />
					</div>

					{/* Progress bar */}
					{thread.taskCount > 0 && (
						<div className="flex items-center gap-2">
							<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
								<div
									className="h-full rounded-full bg-[var(--color-primary)] transition-all"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<span className="text-2xs text-[var(--text-tertiary)] whitespace-nowrap">
								{thread.completedTaskCount}/{thread.taskCount}
							</span>
						</div>
					)}

					{/* Meta */}
					<div className="flex items-center gap-3 text-2xs text-[var(--text-tertiary)]">
						{thread.agentCount > 0 && (
							<span>
								{thread.agentCount} agente{thread.agentCount !== 1 ? "s" : ""}
							</span>
						)}
						{thread.environment && (
							<span className="capitalize">{thread.environment}</span>
						)}
						{thread.period && <span>{thread.period}</span>}
					</div>
				</div>
			</div>

			{/* Last activity */}
			<div className="mt-3 flex items-center gap-1.5 text-2xs text-[var(--text-tertiary)]">
				<Clock size={10} />
				<span>{relativeTime(thread.lastActivityAt)}</span>
			</div>
		</Link>
	);
}

// ─── Skeleton card ───────────────────────────────────────────────────────────

function SkeletonCard() {
	return (
		<div className="animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-5">
			<div className="mb-3 flex items-center gap-2">
				<div className="h-4 flex-1 rounded bg-[var(--surface-3)]" />
				<div className="h-5 w-20 rounded bg-[var(--surface-3)]" />
			</div>
			<div className="mb-3 h-1.5 rounded-full bg-[var(--surface-3)]" />
			<div className="flex gap-3">
				<div className="h-3 w-16 rounded bg-[var(--surface-3)]" />
				<div className="h-3 w-12 rounded bg-[var(--surface-3)]" />
			</div>
		</div>
	);
}

// ─── ThreadList ──────────────────────────────────────────────────────────────

export function ThreadList() {
	const navigate = useNavigate();
	const { companyContext } = useActiveCompanyContext();
	const _companyId = companyContext?.companyId ?? "";

	// ── Filters ────────────────────────────────────────────────────────────
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string | "ALL">("ALL");
	const [periodFilter, setPeriodFilter] = useState("");

	// Keep typing responsive while the query and list filtering catch up.
	const deferredSearch = useDeferredValue(search);

	const { data, isLoading, isError, error, refetch } = useQuery(
		threadsListQueryOptions({
			...(statusFilter !== "ALL" && { status: statusFilter }),
			...(periodFilter && { period: periodFilter }),
			...(deferredSearch && { search: deferredSearch }),
			limit: 50,
		}),
	);

	const threads = data?.data ?? [];

	// Filter from the deferred value so expensive list work does not block typing.
	const normalizedDeferredSearch = deferredSearch.toLowerCase();
	const filtered = deferredSearch
		? threads.filter(
				(t) =>
					t.title.toLowerCase().includes(normalizedDeferredSearch) ||
					t.tags?.some((tag) =>
						tag.toLowerCase().includes(normalizedDeferredSearch),
					),
			)
		: threads;

	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[900px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between gap-4">
						<div>
							<h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
								Threads
							</h1>
							<p className="text-xs text-[var(--text-tertiary)]">
								Threads de trabajo fiscal activos y cerrados
							</p>
						</div>
						<Button
							variant="primary"
							size="sm"
							onClick={() => navigate({ to: "/threads/new" })}
						>
							<Plus size={14} className="mr-1.5" />
							Nuevo thread
						</Button>
					</div>

					{/* Search + Filters */}
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="relative flex-1">
							<Search
								size={14}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
							/>
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Buscar threads..."
								className="pl-9"
							/>
						</div>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-primary)] sm:w-44"
						>
							<option value="ALL">Todos los estados</option>
							<option value="ACTIVE">Activos</option>
							<option value="PENDING_REVIEW">Revisión pendiente</option>
							<option value="AWAITING_INFO">Esperando info</option>
							<option value="BLOCKED">Bloqueados</option>
							<option value="CLOSED">Cerrados</option>
							<option value="DRAFT">Borradores</option>
						</select>
						<Input
							value={periodFilter}
							onChange={(e) => setPeriodFilter(e.target.value)}
							placeholder="Período (2026-06)"
							className="sm:w-36"
						/>
					</div>

					{/* Content */}
					{isLoading && (
						<div className="space-y-3">
							{[1, 2, 3, 4, 5].map((i) => (
								<SkeletonCard key={i} />
							))}
						</div>
					)}

					{isError && (
						<div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-danger-border)]/20 bg-[var(--color-danger-bg)]/10 p-8 text-center">
							<AlertCircle
								size={24}
								className="text-[var(--color-danger-text)]"
							/>
							<p className="text-sm text-[var(--text-secondary)]">
								{error instanceof Error
									? error.message
									: "Error al cargar threads"}
							</p>
							<Button variant="secondary" size="sm" onClick={() => refetch()}>
								<RefreshCw size={14} className="mr-1.5" />
								Reintentar
							</Button>
						</div>
					)}

					{!isLoading && !isError && filtered.length === 0 && (
						<div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--border-subtle)] p-12 text-center">
							{search || statusFilter !== "ALL" || periodFilter ? (
								<>
									<Search size={24} className="text-[var(--text-tertiary)]" />
									<div>
										<p className="text-sm font-medium text-[var(--text-primary)]">
											Sin resultados
										</p>
										<p className="text-xs text-[var(--text-tertiary)]">
											Intenta con otros filtros
										</p>
									</div>
									<Button
										variant="secondary"
										size="sm"
										onClick={() => {
											setSearch("");
											setStatusFilter("ALL");
											setPeriodFilter("");
										}}
									>
										Limpiar filtros
									</Button>
								</>
							) : (
								<>
									<Loader2 size={24} className="text-[var(--text-tertiary)]" />
									<div>
										<p className="text-sm font-medium text-[var(--text-primary)]">
											No hay threads aún
										</p>
										<p className="text-xs text-[var(--text-tertiary)]">
											Crea tu primer thread para empezar a trabajar
										</p>
									</div>
									<Button
										variant="primary"
										size="sm"
										onClick={() => navigate({ to: "/threads/new" })}
									>
										<Plus size={14} className="mr-1.5" />
										Crear thread
									</Button>
								</>
							)}
						</div>
					)}

					{!isLoading && !isError && filtered.length > 0 && (
						<div className="space-y-3">
							{filtered.map((thread) => (
								<ThreadCard key={thread.id} thread={thread} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
