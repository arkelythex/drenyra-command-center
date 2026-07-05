"use client";

/**
 * RightPanel — Artifact Feed
 *
 * Muestra en orden cronológico inverso los artifacts generados por el agente
 * durante la conversación actual: aprobaciones, tablas, documentos, gráficos.
 *
 * Si el usuario quiere fijar una vista (ej: dejar el Ledger visible durante
 * el cierre mensual), puede hacerlo con la acción "Anclar".
 *
 * ┌─────────────────────────────────────┐
 * │  Feed de artefactos          [📌]   │
 * ├─────────────────────────────────────┤
 * │  ┌───────────────────────────────┐  │
 * │  │  Conciliación bancaria        │  │
 * │  │  (agente · hace 2min)        │  │
 * │  └───────────────────────────────┘  │
 * │  ┌───────────────────────────────┐  │
 * │  │  Tabla de asientos            │  │
 * │  │  (agente · hace 5min)        │  │
 * │  └───────────────────────────────┘  │
 * │  ┌───────────────────────────────┐  │
 * │  │  Gráfico de flujo de caja     │  │
 * │  │  (agente · hace 10min)       │  │
 * │  └───────────────────────────────┘  │
 * └─────────────────────────────────────┘
 */

import { Bell, Pin } from "lucide-react";
import { useMemo } from "react";
import { useAccountingStore } from "@/stores/accounting-store";
import { useArtifactStore } from "@/stores/artifact-store";
import { useDiffApprovalStore } from "@/stores/diff-approval-store";
import { KpiDashboard } from "./KpiDashboard";
import { ReportPreview } from "./ReportPreview";
import { ContextPanel } from "./RightPanel.artifact-panel";
import { DiffView } from "./RightPanel.diff-view";

// ─── Feed item type ──────────────────────────────────────────────────────────

interface FeedItem {
	id: string;
	type: "diff" | "artifact" | "reports" | "kpi" | "details";
	label: string;
	timestamp: number;
	component: React.ReactNode;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RightPanel() {
	const pinnedArtifacts = useArtifactStore((s) => s.pinnedArtifacts);
	const diffFiles = useDiffApprovalStore((s) => s.diffFiles);
	const financialReports = useAccountingStore((s) => s.financialReports);

	// Build feed items in reverse chronological order
	const feedItems: FeedItem[] = useMemo(() => {
		const items: FeedItem[] = [];

		// Diffs siempre aparecen primero si hay
		if (diffFiles.length > 0) {
			items.push({
				id: "diff-current",
				type: "diff",
				label: `Conciliación (${diffFiles.length})`,
				timestamp: Date.now(),
				component: <DiffView />,
			});
		}

		// Artefactos anclados por el usuario
		for (const artifact of pinnedArtifacts.slice(0, 5)) {
			const meta = artifact as { title?: string; type?: string; kind?: string };
			items.push({
				id: artifact.id,
				type: "artifact",
				label: meta.title ?? meta.kind ?? artifact.id,
				timestamp: Date.now() - pinnedArtifacts.indexOf(artifact) * 1000,
				component: <ContextPanel />,
			});
		}

		// Reportes financieros
		if (financialReports.length > 0) {
			items.push({
				id: "reports",
				type: "reports",
				label: "Reportes",
				timestamp: Date.now() - 5000,
				component: <ReportPreview />,
			});
		}

		// Dashboard KPI como item por defecto
		items.push({
			id: "kpi-dashboard",
			type: "kpi",
			label: "Dashboard KPI",
			timestamp: Date.now() - 10000,
			component: <KpiDashboard />,
		});

		return items.sort((a, b) => b.timestamp - a.timestamp);
	}, [diffFiles.length, pinnedArtifacts, financialReports.length]);

	const hasContent = feedItems.length > 0;

	return (
		<aside className="flex h-full w-[480px] max-xl:w-full max-xl:max-w-[480px] flex-col border-l border-[var(--border-subtle)] bg-[var(--surface-1)]">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/50 px-4 py-2.5">
				<h2 className="text-xs font-semibold text-[var(--text-primary)]">
					Feed de artefactos
				</h2>
			</div>

			{/* Content — chronological feed */}
			<div className="flex-1 overflow-y-auto">
				{hasContent ? (
					<div className="divide-y divide-[var(--border-subtle)]">
						{feedItems.map((item) => (
							<section key={item.id} className="flex flex-col">
								{/* Item header */}
								<div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-2)]/30">
									<h3 className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
										{item.type === "diff" && (
											<span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning)]/10 px-2 py-0.5 text-2xs font-medium text-[var(--color-warning)]">
												{/* icon */}
												{item.label}
											</span>
										)}
										{item.type !== "diff" && item.label}
									</h3>
									<div className="flex items-center gap-1">
										<button
											type="button"
											className="rounded p-1 text-[var(--text-muted)] opacity-0 hover:opacity-100 hover:text-[var(--text-primary)] transition-all"
											title="Anclar artefacto"
											aria-label="Anclar artefacto"
										>
											<Pin size={12} />
										</button>
									</div>
								</div>
								{/* Item content */}
								<div className="px-0">{item.component}</div>
							</section>
						))}
					</div>
				) : (
					<div className="flex h-full flex-col items-center justify-center text-center px-6">
						<Bell size={28} className="text-[var(--text-muted)] mb-3" />
						<p className="text-sm text-[var(--text-muted)]">
							Sin artefactos todavía
						</p>
						<p className="mt-1 text-xs text-[var(--text-muted)]">
							Los resultados del agente aparecen acá automáticamente
						</p>
					</div>
				)}
			</div>
		</aside>
	);
}
