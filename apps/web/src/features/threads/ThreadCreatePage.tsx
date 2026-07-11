import type {
	ThreadEnvironment,
	ThreadPriority,
} from "@drenyra/domain/entities/thread";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ChevronDown,
	ChevronUp,
	Loader2,
	Plus,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { EnvironmentSelector } from "./EnvironmentSelector";
import { QuickActionButton } from "./QuickActionButton";
import { threadKeys } from "./query-keys";
import { quickActionsQueryOptions } from "./query-options";
import * as threadsApi from "./threads.api";
import type { QuickAction } from "./threads.types";

// ─── Quick-action icon resolver (matches quick-actions.service.ts) ────────────

function quickActionToPayload(action: QuickAction, companyId: string) {
	return {
		companyId,
		title: action.template.title,
		priority: action.template.priority as ThreadPriority,
		tags: action.template.tags,
		environment: "sandbox" as ThreadEnvironment,
		tasks: action.template.tasks.map((t) => ({
			title: t.title,
			order: t.order,
		})),
	};
}

// ─── Priority labels ─────────────────────────────────────────────────────────

const PRIORITIES: { value: ThreadPriority; label: string }[] = [
	{ value: "LOW", label: "Baja" },
	{ value: "MEDIUM", label: "Media" },
	{ value: "HIGH", label: "Alta" },
	{ value: "URGENT", label: "Urgente" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export function ThreadCreatePage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext?.companyId ?? "";

	// ── State ──────────────────────────────────────────────────────────────
	const [environment, setEnvironment] = useState<ThreadEnvironment>("sandbox");
	const [showManualForm, setShowManualForm] = useState(false);
	const [title, setTitle] = useState("");
	const [period, setPeriod] = useState("");
	const [priority, setPriority] = useState<ThreadPriority>("MEDIUM");

	// ── Quick Actions query ────────────────────────────────────────────────
	const {
		data: quickActions,
		isLoading: quickActionsLoading,
		isError: quickActionsError,
		refetch: refetchQuickActions,
	} = useQuery(quickActionsQueryOptions(companyId));

	// ── Create mutation ────────────────────────────────────────────────────
	const createMutation = useMutation({
		mutationFn: (payload: Parameters<typeof threadsApi.createThread>[0]) =>
			threadsApi.createThread(payload),
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
			navigate({ to: "/threads/$threadId", params: { threadId: result.id } });
		},
	});

	const handleQuickAction = useCallback(
		(action: QuickAction) => {
			if (!companyId) return;
			createMutation.mutate(quickActionToPayload(action, companyId));
		},
		[companyId, createMutation],
	);

	const handleManualCreate = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!companyId || !title.trim()) return;
			createMutation.mutate({
				companyId,
				title: title.trim(),
				period: period || undefined,
				priority,
				environment,
				tasks: [{ title: "Tarea inicial", order: 1 }],
			});
		},
		[companyId, title, period, priority, environment, createMutation],
	);

	// ── Guard: no company context ──────────────────────────────────────────
	if (!companyId) {
		return (
			<div className="flex h-full items-center justify-center p-8">
				<div className="flex flex-col items-center gap-3 text-center">
					<AlertCircle size={24} className="text-[var(--text-tertiary)]" />
					<p className="text-sm text-[var(--text-secondary)]">
						Selecciona una compañía para crear un thread
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[800px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-8">
					{/* Header */}
					<header className="space-y-2">
						<h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
							Let&apos;s close
						</h1>
						<p className="text-sm text-[var(--text-tertiary)]">
							Inicia un thread de trabajo fiscal — elige una acción rápida o
							crea un thread manual
						</p>
					</header>

					{/* Environment selector */}
					<section>
						<EnvironmentSelector
							value={environment}
							onChange={setEnvironment}
						/>
					</section>

					{/* Quick Actions grid */}
					<section className="space-y-4">
						<h2 className="text-sm font-semibold text-[var(--text-secondary)]">
							Acciones rápidas
						</h2>

						{quickActionsLoading && (
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								{[1, 2, 3, 4].map((i) => (
									<div
										key={i}
										className="animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-5"
									>
										<div className="mb-3 size-10 rounded-xl bg-[var(--surface-3)]" />
										<div className="mb-2 h-4 w-3/4 rounded bg-[var(--surface-3)]" />
										<div className="h-3 w-full rounded bg-[var(--surface-3)]" />
									</div>
								))}
							</div>
						)}

						{quickActionsError && (
							<div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-danger-border)]/20 bg-[var(--color-danger-bg)]/10 p-6 text-center">
								<AlertCircle
									size={24}
									className="text-[var(--color-danger-text)]"
								/>
								<p className="text-sm text-[var(--text-secondary)]">
									No se pudieron cargar las acciones rápidas
								</p>
								<Button
									variant="secondary"
									size="sm"
									onClick={() => refetchQuickActions()}
								>
									Reintentar
								</Button>
							</div>
						)}

						{!quickActionsLoading &&
							!quickActionsError &&
							quickActions &&
							quickActions.length === 0 && (
								<div className="rounded-2xl border border-[var(--border-subtle)] p-6 text-center">
									<p className="text-sm text-[var(--text-tertiary)]">
										No hay acciones rápidas disponibles
									</p>
								</div>
							)}

						{!quickActionsLoading &&
							!quickActionsError &&
							quickActions &&
							quickActions.length > 0 && (
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									{quickActions.map((action) => (
										<QuickActionButton
											key={action.id}
											action={action}
											onClick={() => handleQuickAction(action)}
											disabled={createMutation.isPending}
										/>
									))}
								</div>
							)}
					</section>

					{/* Divider */}
					<div className="flex items-center gap-3">
						<div className="flex-1 border-t border-[var(--border-subtle)]" />
						<span className="text-xs text-[var(--text-tertiary)]">o</span>
						<div className="flex-1 border-t border-[var(--border-subtle)]" />
					</div>

					{/* Manual creation form */}
					<section>
						<button
							type="button"
							onClick={() => setShowManualForm(!showManualForm)}
							className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 text-left transition-all hover:border-[var(--border-default)]"
						>
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-xl bg-[var(--surface-2)]">
									<Plus size={18} className="text-[var(--text-tertiary)]" />
								</div>
								<div>
									<p className="text-sm font-semibold text-[var(--text-primary)]">
										Crear thread manual
									</p>
									<p className="text-xs text-[var(--text-tertiary)]">
										Define los detalles del thread paso a paso
									</p>
								</div>
							</div>
							{showManualForm ? (
								<ChevronUp size={18} className="text-[var(--text-tertiary)]" />
							) : (
								<ChevronDown
									size={18}
									className="text-[var(--text-tertiary)]"
								/>
							)}
						</button>

						{showManualForm && (
							<form
								onSubmit={handleManualCreate}
								className="mt-3 space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-5"
							>
								<div className="space-y-2">
									<Label htmlFor="thread-title">Título</Label>
									<Input
										id="thread-title"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="Ej: Cierre mensual junio 2026"
										required
										maxLength={200}
									/>
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="thread-period">Período</Label>
										<Input
											id="thread-period"
											value={period}
											onChange={(e) => setPeriod(e.target.value)}
											placeholder="2026-06"
											pattern="^\d{4}-(0[1-9]|1[0-2])$"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="thread-priority">Prioridad</Label>
										<select
											id="thread-priority"
											value={priority}
											onChange={(e) =>
												setPriority(e.target.value as ThreadPriority)
											}
											className="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
										>
											{PRIORITIES.map((p) => (
												<option key={p.value} value={p.value}>
													{p.label}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="flex justify-end gap-3 pt-2">
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onClick={() => setShowManualForm(false)}
									>
										Cancelar
									</Button>
									<Button
										type="submit"
										size="sm"
										disabled={!title.trim() || createMutation.isPending}
									>
										{createMutation.isPending ? (
											<>
												<Loader2 size={14} className="mr-2 animate-spin" />
												Creando...
											</>
										) : (
											"Crear thread"
										)}
									</Button>
								</div>

								{createMutation.isError && (
									<p className="text-xs text-[var(--color-danger-text)]">
										{createMutation.error instanceof Error
											? createMutation.error.message
											: "Error al crear el thread"}
									</p>
								)}
							</form>
						)}
					</section>

					{/* Create mutation loading overlay */}
					{createMutation.isPending && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 ">
							<div className="rounded-2xl bg-[var(--surface-1)] p-8 text-center shadow-xl">
								<Loader2
									size={32}
									className="mx-auto animate-spin text-[var(--color-primary)]"
								/>
								<p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
									Creando thread...
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
