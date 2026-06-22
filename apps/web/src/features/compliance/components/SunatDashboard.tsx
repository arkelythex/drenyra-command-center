/**
 * SunatDashboard — SUNAT Compliance Command Center
 *
 * Displays RUC status, SIRE period validation, upcoming tax deadlines,
 * and recent SUNAT notifications in a glass-and-steel layout.
 */

import {
	AlertCircle,
	Bell,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	FileCheck,
	Hourglass,
	Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import {
	MOCK_NOTIFICATIONS,
	MOCK_RUC,
	MOCK_SIRE_PERIODS,
	MOCK_TAX_CALENDAR,
} from "./SunatDashboard.data";
import { SunatDashboardSkeleton } from "./SunatDashboardSkeleton";
import type {
	CalendarType,
	NotificationType,
	RucStatus,
	SireValidationStatus,
} from "./SunatDashboard.types";

// ─── Style Maps ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<SireValidationStatus, string> = {
	VALIDADO:
		"bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
	PENDIENTE:
		"bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20",
	OBSERVADO:
		"bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20",
};

const STATUS_ICONS: Record<SireValidationStatus, typeof CheckCircle2> = {
	VALIDADO: CheckCircle2,
	PENDIENTE: Hourglass,
	OBSERVADO: AlertCircle,
};

const STATUS_LABELS: Record<SireValidationStatus, string> = {
	VALIDADO: "Validado",
	PENDIENTE: "Pendiente",
	OBSERVADO: "Observado",
};

const RUC_STATUS_STYLES: Record<RucStatus, string> = {
	ACTIVO: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
	SUSPENDIDO: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
};

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
	RESOLUCION: FileCheck,
	CAMBIO: AlertCircle,
	RECORDATORIO: Clock,
};

const CALENDAR_TYPE_STYLES: Record<CalendarType, string> = {
	PLAME: "border-l-[var(--color-info)]",
	IGV: "border-l-[var(--color-warning)]",
	RENTA: "border-l-[var(--color-danger)]",
	DETRACCIONES: "border-l-[var(--color-success)]",
	SIRE: "border-l-[var(--color-primary)]",
};

// ─── Sub-Components ─────────────────────────────────────────────────────────

function SectionHeader({
	icon: Icon,
	title,
}: {
	icon: typeof Shield;
	title: string;
}) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]">
				<Icon size={16} className="text-[var(--text-secondary)]" />
			</div>
			<h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--text-secondary)]">
				{title}
			</h2>
		</div>
	);
}

function StatusBadge({
	status,
	label,
}: {
	status: SireValidationStatus;
	label?: string;
}) {
	const Icon = STATUS_ICONS[status];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
				STATUS_STYLES[status],
			)}
		>
			<Icon size={12} strokeWidth={3} />
			{label ?? STATUS_LABELS[status]}
		</span>
	);
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function SunatDashboard() {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => setIsLoading(false), 1400);
		return () => clearTimeout(timer);
	}, []);

	if (isLoading) return <SunatDashboardSkeleton />;

	const now = new Date();
	const syncLabel =
		now.getHours() < 12
			? `Hoy, ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")} AM`
			: `Hoy, ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")} PM`;

	return (
		<div className="mx-auto flex h-full max-w-7xl flex-col gap-8 px-6 py-8">
			{/* ── Header ──────────────────────────────────────────────────────── */}
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-5">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10">
						<Shield size={28} className="text-[var(--color-primary)]" />
					</div>
					<div>
						<h1 className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">
							Dashboard SUNAT
						</h1>
						<p className="mt-1 text-xs font-medium text-[var(--text-tertiary)]">
							Última sincronización: {syncLabel}
						</p>
					</div>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="h-9 rounded-xl text-2xs font-bold uppercase tracking-widest"
				>
					<Clock size={14} />
					Sincronizar
				</Button>
			</div>

			{/* ── RUC Status ─────────────────────────────────────────────────── */}
			<section>
				<div className="mb-4">
					<SectionHeader icon={Building2} title="Estado del RUC" />
				</div>
				<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 p-6 backdrop-blur-sm">
					<div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-3">
							<div className="flex items-center gap-4">
								<span
									className={cn(
										"inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
										RUC_STATUS_STYLES[MOCK_RUC.estado],
									)}
								>
									{MOCK_RUC.estado}
								</span>
							</div>
							<div>
								<p className="font-mono text-lg font-black tabular-nums tracking-tighter text-[var(--text-primary)]">
									{MOCK_RUC.ruc}
								</p>
								<p className="mt-0.5 text-sm font-medium text-[var(--text-secondary)]">
									{MOCK_RUC.razonSocial}
								</p>
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3">
							<Calendar size={14} className="text-[var(--text-tertiary)]" />
							<div>
								<p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
									Última verificación
								</p>
								<p className="text-xs font-semibold text-[var(--text-primary)]">
									{formatDate(MOCK_RUC.ultimaVerificacion)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── SIRE Status ────────────────────────────────────────────────── */}
			<section>
				<div className="mb-4">
					<SectionHeader icon={FileCheck} title="Estado SIRE por Periodo" />
				</div>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
					{MOCK_SIRE_PERIODS.map((period) => {
						const Icon = STATUS_ICONS[period.estado];
						return (
							<div
								key={period.periodo}
								className={cn(
									"group rounded-xl border bg-[var(--surface-1)]/80 p-5 backdrop-blur-sm transition-all hover:shadow-sm",
									period.estado === "VALIDADO" &&
										"border-[var(--color-success)]/20 hover:border-[var(--color-success)]/40",
									period.estado === "PENDIENTE" &&
										"border-[var(--color-warning)]/20 hover:border-[var(--color-warning)]/40",
									period.estado === "OBSERVADO" &&
										"border-[var(--color-danger)]/20 hover:border-[var(--color-danger)]/40",
								)}
							>
								<div className="mb-3 flex items-center justify-between">
									<span className="font-mono text-sm font-bold tabular-nums text-[var(--text-secondary)]">
										{period.periodo}
									</span>
									<Icon
										size={16}
										className={cn(
											period.estado === "VALIDADO" && "text-[var(--color-success)]",
											period.estado === "PENDIENTE" &&
												"text-[var(--color-warning)]",
											period.estado === "OBSERVADO" &&
												"text-[var(--color-danger)]",
										)}
									/>
								</div>
								<StatusBadge status={period.estado} />
								<p className="mt-3 text-[11px] font-medium text-[var(--text-tertiary)]">
									Vence: {formatDate(period.vencimiento)}
								</p>
							</div>
						);
					})}
				</div>
			</section>

			{/* ── Calendar + Notifications ─────────────────────────────────── */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Tax Calendar */}
				<section className="lg:col-span-2">
					<div className="mb-4">
						<SectionHeader icon={Calendar} title="Calendario Tributario" />
					</div>
					<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm">
						{MOCK_TAX_CALENDAR.map((item, index) => (
							<div
								key={item.obligacion}
								className={cn(
									"flex items-center justify-between border-l-4 px-5 py-4 transition-colors hover:bg-[var(--surface-2)]/50",
									CALENDAR_TYPE_STYLES[item.tipo],
									index < MOCK_TAX_CALENDAR.length - 1 &&
										"border-b border-[var(--border-subtle)]",
								)}
							>
								<div className="flex items-center gap-4">
									<div className="text-right">
										<p className="font-mono text-xs font-black tabular-nums tracking-tight text-[var(--text-primary)]">
											{new Intl.DateTimeFormat("es-PE", {
												day: "numeric",
												month: "short",
											}).format(item.fechaVencimiento)}
										</p>
									</div>
									<div>
										<p className="text-sm font-bold text-[var(--text-primary)]">
											{item.obligacion}
										</p>
										<p className="text-xs text-[var(--text-tertiary)]">
											{item.descripcion}
										</p>
									</div>
								</div>
								<span
									className={cn(
										"inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
										item.tipo === "PLAME" &&
											"bg-[var(--color-info)]/10 text-[var(--color-info)]",
										item.tipo === "IGV" &&
											"bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
										item.tipo === "RENTA" &&
											"bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
										item.tipo === "DETRACCIONES" &&
											"bg-[var(--color-success)]/10 text-[var(--color-success)]",
										item.tipo === "SIRE" &&
											"bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
									)}
								>
									{item.tipo}
								</span>
							</div>
						))}
						{MOCK_TAX_CALENDAR.length === 0 && (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<Calendar size={32} className="mb-3 text-[var(--text-tertiary)]/50" />
								<p className="text-sm font-medium text-[var(--text-tertiary)]">
									No hay vencimientos próximos
								</p>
							</div>
						)}
					</div>
				</section>

				{/* Notifications */}
				<section>
					<div className="mb-4">
						<SectionHeader icon={Bell} title="Notificaciones" />
					</div>
					<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm">
						{MOCK_NOTIFICATIONS.map((note) => {
							const Icon = NOTIFICATION_ICONS[note.tipo];
							return (
								<div
									key={note.id}
									className={cn(
										"border-b border-[var(--border-subtle)] px-5 py-4 last:border-b-0",
										!note.leida && "bg-[var(--color-primary)]/[0.02]",
									)}
								>
									<div className="flex items-start gap-3">
										<div
											className={cn(
												"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
												!note.leida
													? "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/8"
													: "border-[var(--border-subtle)] bg-[var(--surface-2)]",
											)}
										>
											<Icon
												size={14}
												className={
													!note.leida
														? "text-[var(--color-primary)]"
														: "text-[var(--text-tertiary)]"
												}
											/>
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-start justify-between gap-2">
												<p
													className={cn(
														"text-sm leading-snug",
														!note.leida
															? "font-bold text-[var(--text-primary)]"
															: "font-medium text-[var(--text-secondary)]",
													)}
												>
													{note.titulo}
												</p>
												{!note.leida && (
													<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
												)}
											</div>
											<p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
												{formatDate(note.fecha)}
											</p>
										</div>
									</div>
								</div>
							);
						})}
						{MOCK_NOTIFICATIONS.length === 0 && (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<Bell size={32} className="mb-3 text-[var(--text-tertiary)]/50" />
								<p className="text-sm font-medium text-[var(--text-tertiary)]">
									Sin notificaciones
								</p>
							</div>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
