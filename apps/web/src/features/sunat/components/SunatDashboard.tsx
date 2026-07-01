/**
 * SunatDashboard — Full-page SUNAT compliance status dashboard.
 *
 * Displays KPI cards, invoice status table, tax calendar, and SUNAT summary.
 * Uses demo data for frontend visualization; ready to wire to real API.
 */

"use client";

import {
	AlertCircle,
	AlertTriangle,
	ArrowUpDown,
	Building2,
	Calendar,
	CheckCircle2,
	ChevronDown,
	FileText,
	Info,
	ShieldCheck,
	Users,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { OseStatusBadge } from "@/features/invoices/components/OseStatusBadge";
import { cn, formatDate, n } from "@/lib/utils";
import { KpiCard, KpiCardSkeleton } from "./KpiCard";
import { ObligationStatusBadge } from "./ObligationStatusBadge";
import { DEMO_INVOICES, PERIODS, TAX_OBLIGATIONS } from "./SunatDashboard.data";
import type { Period, SortDir, SortKey } from "./SunatDashboard.types";
import { sortInvoices } from "./SunatDashboard.types";
import { TableSkeleton } from "./TableSkeleton";

// ─── Main Component ─────────────────────────────────────────────────────────

export function SunatDashboard() {
	const [period, setPeriod] = useState<Period>("2026-04");
	const [periodOpen, setPeriodOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sortKey, setSortKey] = useState<SortKey>("fechaEmision");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	// ── Derived data ──────────────────────────────────────────────────────

	const totalInvoices = 1250;
	const pendingCount = 42;
	const observacionesCount = 8;

	const sortedInvoices = sortInvoices(DEMO_INVOICES, sortKey, sortDir);

	// ── Handlers ──────────────────────────────────────────────────────────

	function handleSort(key: SortKey) {
		if (sortKey === key) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir("asc");
		}
	}

	function handleRetry() {
		setError(null);
		setIsLoading(true);
		setTimeout(() => {
			setIsLoading(false);
		}, 1500);
	}

	function SortIcon({ columnKey }: { columnKey: SortKey }) {
		if (sortKey !== columnKey) {
			return (
				<ArrowUpDown size={12} className="opacity-40" aria-hidden="true" />
			);
		}
		return (
			<span className="text-[var(--premium-info)]" aria-hidden="true">
				{sortDir === "asc" ? " ↑" : " ↓"}
			</span>
		);
	}

	// ── Render ────────────────────────────────────────────────────────────

	if (error) {
		return (
			<div className="mx-auto max-w-7xl px-6 py-8">
				<div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-16">
					<AlertCircle
						size={48}
						className="mb-4 text-[var(--premium-danger)]"
						aria-hidden="true"
					/>
					<h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
						No se pudieron cargar los datos SUNAT
					</h2>
					<p className="mb-6 text-sm text-[var(--text-secondary)]">{error}</p>
					<button
						type="button"
						onClick={handleRetry}
						className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
					>
						Reintentar
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-7xl px-6 py-8">
			{/* ── Header ──────────────────────────────────────────────────── */}
			<div className="mb-8 flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-none">
						Estado SUNAT
					</h1>
					<p className="mt-1.5 text-sm text-[var(--text-secondary)]">
						Monitoreo de cumplimiento fiscal y estado de comprobantes
					</p>
				</div>

				{/* Period Selector */}
				<div className="relative">
					<button
						type="button"
						onClick={() => setPeriodOpen((o) => !o)}
						className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
						aria-expanded={periodOpen}
						aria-haspopup="listbox"
					>
						{PERIODS.find((p) => p.value === period)?.label ?? period}
						<ChevronDown
							size={14}
							className={cn(
								"text-[var(--text-muted)] transition-transform",
								periodOpen && "rotate-180",
							)}
							aria-hidden="true"
						/>
					</button>

					{periodOpen && (
						<>
							{/* Backdrop to close */}
							{/* biome-ignore lint/a11y/noStaticElementInteractions: dismiss overlay */}
							<div
								className="fixed inset-0 z-10"
								onClick={() => setPeriodOpen(false)}
								role="presentation"
								tabIndex={-1}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										setPeriodOpen(false);
									}
								}}
							/>
							<div
								className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] shadow-lg"
								role="listbox"
								aria-label="Seleccionar periodo"
							>
								{PERIODS.map((p) => (
									<button
										key={p.value}
										type="button"
										role="option"
										aria-selected={period === p.value}
										onClick={() => {
											setPeriod(p.value);
											setPeriodOpen(false);
										}}
										className={cn(
											"w-full px-4 py-2.5 text-left text-sm transition-colors",
											period === p.value
												? "bg-[var(--premium-info)]/10 text-[var(--premium-info)] font-medium"
												: "text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
										)}
									>
										{p.label}
									</button>
								))}
							</div>
						</>
					)}
				</div>
			</div>

			{/* ── KPI Row ────────────────────────────────────────────────── */}
			<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{isLoading ? (
					<>
						<KpiCardSkeleton />
						<KpiCardSkeleton />
						<KpiCardSkeleton />
						<KpiCardSkeleton />
					</>
				) : (
					<>
						<KpiCard
							icon={CheckCircle2}
							label="RUC Activo"
							value="20551234567"
							tone="success"
						/>
						<KpiCard
							icon={Info}
							label="Facturas Enviadas"
							value={totalInvoices.toLocaleString("es-PE")}
							tone="info"
						/>
						<KpiCard
							icon={AlertTriangle}
							label="Pendientes SUNAT"
							value={pendingCount.toLocaleString("es-PE")}
							tone="warning"
						/>
						<KpiCard
							icon={AlertCircle}
							label="Observaciones"
							value={observacionesCount.toLocaleString("es-PE")}
							tone="danger"
						/>
					</>
				)}
			</div>

			{/* ── Main Content (2 columns) ──────────────────────────────── */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* ── Left Column: Invoices Table ────────────────────────── */}
				<div className="lg:col-span-2">
					<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden">
						<div className="border-b border-[var(--border-subtle)] px-6 py-4">
							<h2 className="text-sm font-semibold text-[var(--text-primary)]">
								Comprobantes por estado SUNAT
							</h2>
						</div>

						{isLoading ? (
							<table className="w-full">
								<thead>
									<tr className="border-b border-[var(--border-subtle)]">
										{[
											"Serie-Número",
											"Tipo",
											"Cliente",
											"Monto",
											"Fecha Emisión",
											"Estado",
										].map((h) => (
											<th
												key={h}
												className="px-6 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									<TableSkeleton rows={6} />
								</tbody>
							</table>
						) : sortedInvoices.length === 0 ? (
							<div className="flex flex-col items-center py-16">
								<FileText
									size={40}
									className="mb-3 text-[var(--text-muted)]"
									aria-hidden="true"
								/>
								<p className="text-sm text-[var(--text-secondary)]">
									No hay comprobantes para el periodo seleccionado
								</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-[var(--border-subtle)]">
											{[
												{
													key: "serieNumero" as SortKey,
													label: "Serie-Número",
												},
												{ key: "tipo" as SortKey, label: "Tipo" },
												{ key: "cliente" as SortKey, label: "Cliente" },
												{ key: "monto" as SortKey, label: "Monto" },
												{
													key: "fechaEmision" as SortKey,
													label: "Fecha Emisión",
												},
												{ key: "estado" as SortKey, label: "Estado" },
											].map((col) => (
												<th
													key={col.key}
													className="px-6 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
												>
													<button
														type="button"
														onClick={() => handleSort(col.key)}
														className="inline-flex items-center gap-1 transition-colors hover:text-[var(--text-primary)]"
													>
														{col.label}
														<SortIcon columnKey={col.key} />
													</button>
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{sortedInvoices.map((inv) => (
											<tr
												key={inv.id}
												className="border-b border-[var(--border-subtle)]/50 transition-colors hover:bg-[var(--surface-2)]/40 last:border-b-0"
											>
												<td className="px-6 py-4 font-mono text-xs tabular-nums text-[var(--text-primary)]">
													{inv.serieNumero}
												</td>
												<td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
													{inv.tipo}
												</td>
												<td className="max-w-[200px] truncate px-6 py-4 text-sm text-[var(--text-primary)]">
													{inv.cliente}
												</td>
												<td className="px-6 py-4 text-right font-mono text-sm tabular-nums text-[var(--text-primary)]">
													{n(inv.monto)}
												</td>
												<td className="px-6 py-4 text-sm text-[var(--text-secondary)] whitespace-nowrap">
													{formatDate(inv.fechaEmision)}
												</td>
												<td className="px-6 py-4">
													<OseStatusBadge status={inv.estado} />
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>

				{/* ── Right Column ────────────────────────────────────────── */}
				<div className="flex flex-col gap-6">
					{/* Tax Calendar */}
					<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
						<div className="border-b border-[var(--border-subtle)] px-5 py-4">
							<div className="flex items-center gap-2">
								<Calendar
									size={16}
									className="text-[var(--premium-info)]"
									aria-hidden="true"
								/>
								<h2 className="text-sm font-semibold text-[var(--text-primary)]">
									Calendario Tributario
								</h2>
							</div>
						</div>

						{isLoading ? (
							<div className="space-y-3 p-5">
								{Array.from({ length: 4 }, (_, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: static loading skeleton
									<div key={i} className="space-y-2">
										<div className="h-3 w-40 animate-pulse rounded bg-[var(--surface-2)]" />
										<div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-2)]" />
									</div>
								))}
							</div>
						) : (
							<div className="divide-y divide-[var(--border-subtle)]/50">
								{TAX_OBLIGATIONS.map((obl) => (
									<div
										key={obl.id}
										className="flex items-center justify-between px-5 py-3.5"
									>
										<div className="min-w-0 flex-1 pr-3">
											<p className="truncate text-sm font-medium text-[var(--text-primary)]">
												{obl.label}
											</p>
											<p className="mt-0.5 text-xs text-[var(--text-muted)]">
												Vence: {formatDate(obl.fechaVencimiento)}
											</p>
										</div>
										<ObligationStatusBadge status={obl.status} />
									</div>
								))}
							</div>
						)}
					</div>

					{/* SUNAT Summary */}
					<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
						<div className="border-b border-[var(--border-subtle)] px-5 py-4">
							<div className="flex items-center gap-2">
								<Building2
									size={16}
									className="text-[var(--premium-info)]"
									aria-hidden="true"
								/>
								<h2 className="text-sm font-semibold text-[var(--text-primary)]">
									Resumen SUNAT
								</h2>
							</div>
						</div>

						{isLoading ? (
							<div className="space-y-3 p-5">
								{Array.from({ length: 5 }, (_, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: static loading skeleton
									<div key={i} className="flex items-center justify-between">
										<div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-2)]" />
										<div className="h-3 w-28 animate-pulse rounded bg-[var(--surface-2)]" />
									</div>
								))}
							</div>
						) : (
							<div className="space-y-0">
								{[
									{ label: "RUC", value: "20551234567", icon: Building2 },
									{ label: "Estado", value: "ACTIVO", icon: ShieldCheck },
									{ label: "Contribuyente", value: "Habido", icon: Users },
									{ label: "Deuda coactiva", value: "No", icon: XCircle },
								].map((row) => {
									const Icon = row.icon;
									const isPositive =
										row.value === "ACTIVO" ||
										row.value === "Habido" ||
										row.value === "No";
									return (
										<div
											key={row.label}
											className="flex items-center justify-between border-b border-[var(--border-subtle)]/50 px-5 py-3.5 last:border-b-0"
										>
											<div className="flex items-center gap-2">
												<Icon
													size={14}
													className={cn(
														"text-[var(--text-muted)]",
														isPositive && "text-[var(--premium-success)]",
													)}
													aria-hidden="true"
												/>
												<span className="text-sm text-[var(--text-secondary)]">
													{row.label}
												</span>
											</div>
											<span
												className={cn(
													"font-mono text-sm tabular-nums",
													isPositive
														? "font-medium text-[var(--premium-success)]"
														: "text-[var(--text-primary)]",
												)}
											>
												{row.value}
											</span>
										</div>
									);
								})}
								<div className="border-t border-[var(--border-subtle)]/50 px-5 py-3">
									<p className="text-2xs text-[var(--text-muted)]">
										Última actualización: {formatDate(new Date())}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
