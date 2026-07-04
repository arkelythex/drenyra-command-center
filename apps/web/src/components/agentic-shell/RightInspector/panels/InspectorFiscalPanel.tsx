"use client";

import { Activity, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface InspectorFiscalPanelProps {
	id: string;
	title: string;
}

interface FiscalHealthScore {
	overall: number;
	categories: {
		sunatSync: number;
		igvCompliance: number;
		discrepancyRate: number;
		deadlineProximity: number;
	};
	activeExceptions: number;
	projectedIGV: { base: number; tax: number; total: number };
	lastSyncDate: string | null;
	nextDeadline: string | null;
}

function getHealthColor(score: number): string {
	if (score >= 80) return "var(--color-success)";
	if (score >= 50) return "var(--color-warning)";
	return "var(--color-danger)";
}

function getHealthLabel(score: number): string {
	if (score >= 80) return "Bajo";
	if (score >= 50) return "Medio";
	return "Alto";
}

export function InspectorFiscalPanel({
	id: _id,
	title: _title,
}: InspectorFiscalPanelProps) {
	const [health, setHealth] = useState<FiscalHealthScore | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchHealth() {
			try {
				const res = await fetch("/api/fiscal-agent/health", {
					headers: {
						"X-Organization-Id": "1",
						"X-Company-Id": "default",
					},
				});
				if (res.ok) {
					const data = await res.json();
					setHealth(data.data);
				}
			} catch {
				// Fallback to defaults on error
			} finally {
				setLoading(false);
			}
		}
		fetchHealth();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<RefreshCw className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	const score = health?.overall ?? 85;
	const color = getHealthColor(score);
	const label = getHealthLabel(score);

	return (
		<div className="space-y-4 p-4">
			{/* Health score gauge */}
			<div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4 text-center">
				<div
					className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
					style={{ backgroundColor: color }}
				>
					{score}
				</div>
				<div className="text-sm font-medium" style={{ color }}>
					Riesgo: {label}
				</div>
				<div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
					<div className="rounded bg-[var(--surface-3)] p-1.5">
						<div className="text-[var(--text-muted)]">SUNAT</div>
						<div
							style={{
								color: getHealthColor(health?.categories.sunatSync ?? 100),
							}}
						>
							{health?.categories.sunatSync ?? 100}%
						</div>
					</div>
					<div className="rounded bg-[var(--surface-3)] p-1.5">
						<div className="text-[var(--text-muted)]">IGV</div>
						<div
							style={{
								color: getHealthColor(health?.categories.igvCompliance ?? 85),
							}}
						>
							{health?.categories.igvCompliance ?? 85}%
						</div>
					</div>
					<div className="rounded bg-[var(--surface-3)] p-1.5">
						<div className="text-[var(--text-muted)]">Discrep.</div>
						<div
							style={{
								color: getHealthColor(health?.categories.discrepancyRate ?? 90),
							}}
						>
							{health?.categories.discrepancyRate ?? 90}%
						</div>
					</div>
					<div className="rounded bg-[var(--surface-3)] p-1.5">
						<div className="text-[var(--text-muted)]">Vencim.</div>
						<div
							style={{
								color: getHealthColor(
									health?.categories.deadlineProximity ?? 100,
								),
							}}
						>
							{health?.categories.deadlineProximity ?? 100}%
						</div>
					</div>
				</div>
			</div>

			{/* Exceptions */}
			<section>
				<h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
					<AlertTriangle size={12} />
					Excepciones activas
				</h4>
				<div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
					{health && health.activeExceptions > 0 ? (
						<p className="text-xs text-[var(--color-warning)]">
							{health.activeExceptions} excepciones requieren revisión
						</p>
					) : (
						<div className="flex items-center gap-2 text-xs text-[var(--color-success)]">
							<CheckCircle size={12} />
							Sin excepciones pendientes
						</div>
					)}
				</div>
			</section>

			{/* Next steps */}
			<section>
				<h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
					<Activity size={12} />
					Próximos pasos
				</h4>
				<div className="space-y-1.5">
					<div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2">
						<div className="flex-1">
							<div className="text-xs text-[var(--text-primary)]">
								Ejecutar nightly run
							</div>
							<div className="text-[10px] text-[var(--text-muted)]">
								{health?.lastSyncDate
									? `Último sync: ${new Date(health.lastSyncDate).toLocaleDateString()}`
									: "Sin sync previo"}
							</div>
						</div>
						<span className="text-[10px] text-[var(--text-muted)]">
							{health?.nextDeadline ?? "Próximo: 15 del mes"}
						</span>
					</div>
				</div>
			</section>
		</div>
	);
}
