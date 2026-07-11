"use client";

import { Link } from "@tanstack/react-router";
import { Bell, FileSearch, Pin, ShieldCheck, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useFiscalInspector } from "@/context/FiscalInspectorContext";
import { useAgenticLayout } from "@/components/agentic-shell/AgenticLayout/AgenticLayout.context";
import { useAccountingStore } from "@/stores/accounting-store";
import { useArtifactStore } from "@/stores/artifact-store";
import { useDiffApprovalStore } from "@/stores/diff-approval-store";
import { KpiDashboard } from "./KpiDashboard";
import { ReportPreview } from "./ReportPreview";
import { ContextPanel } from "./RightPanel.artifact-panel";
import { DiffView } from "./RightPanel.diff-view";

const PANEL_MODE = {
	INSPECTOR: "inspector",
	ARTIFACTS: "artifacts",
} as const;

type PanelMode = (typeof PANEL_MODE)[keyof typeof PANEL_MODE];

interface FeedItem {
	id: string;
	type: "diff" | "artifact" | "reports" | "kpi";
	label: string;
	timestamp: number;
	content: ReactNode;
}

function FiscalInspectorView() {
	const { activeAction, close } = useFiscalInspector();
	const { workspace } = useAgenticLayout();

	if (!activeAction) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
				<FileSearch size={28} className="text-[var(--text-muted)]" />
				<p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
					Seleccioná una decisión
				</p>
				<p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
					Revisá causa, impacto, evidencia y aprobación desde el centro de
					operaciones.
				</p>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
						Acción fiscal · {activeAction.module}
					</p>
					<h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
						{activeAction.summary}
					</h3>
				</div>
				<button
					type="button"
					onClick={close}
					className="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
					aria-label="Cerrar inspector"
				>
					<X size={16} />
				</button>
			</div>

			<div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold">
				<span className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-[var(--text-secondary)]">
					RUC {activeAction.companyRuc}
				</span>
				<span className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-[var(--text-secondary)]">
					Período {workspace?.period ?? "no seleccionado"}
				</span>
				<span className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-[var(--text-secondary)]">
					{activeAction.status}
				</span>
				<span className="rounded-full bg-[var(--color-danger)]/10 px-2 py-1 text-[var(--color-danger)]">
					Riesgo {activeAction.riskLevel}
				</span>
			</div>

			<section className="mt-5 rounded-xl bg-[var(--surface-2)] p-3">
				<h4 className="text-xs font-semibold text-[var(--text-primary)]">
					Impacto fiscal
				</h4>
				<p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
					{activeAction.impact}
				</p>
			</section>

			{activeAction.agentAnalysis && (
				<section className="mt-3 rounded-xl border border-[var(--border-subtle)] p-3">
					<div className="flex items-center justify-between gap-2">
						<h4 className="text-xs font-semibold text-[var(--text-primary)]">
							Análisis del agente
						</h4>
						<span className="text-[10px] font-semibold text-[var(--color-primary)]">
							Confianza{" "}
							{(activeAction.agentAnalysis.confidence * 100).toFixed(0)}%
						</span>
					</div>
					<p className="mt-2 text-xs text-[var(--text-secondary)]">
						{activeAction.agentAnalysis.rationale}
					</p>
					<p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
						{activeAction.agentAnalysis.proposal}
					</p>
				</section>
			)}

			<section className="mt-3">
				<h4 className="text-xs font-semibold text-[var(--text-primary)]">
					Evidencia
				</h4>
				<div className="mt-2 space-y-2">
					{activeAction.evidence.map((item) => (
						<div
							key={item.id}
							className="rounded-lg border border-[var(--border-subtle)] p-2.5"
						>
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-medium text-[var(--text-primary)]">
									{item.label}
								</span>
								<span className="text-[10px] text-[var(--color-success)]">
									{item.verified ? "Verificada" : "Pendiente"}
								</span>
							</div>
							<p className="mt-1 font-mono text-[10px] text-[var(--text-tertiary)]">
								{item.kind} · {item.hash}
							</p>
						</div>
					))}
				</div>
			</section>

			<section className="mt-3 rounded-xl border border-[var(--color-warning)]/25 bg-[var(--color-warning)]/5 p-3">
				<div className="flex items-center gap-2">
					<ShieldCheck size={14} className="text-[var(--color-warning)]" />
					<h4 className="text-xs font-semibold text-[var(--text-primary)]">
						Aprobación y excepción
					</h4>
				</div>
				<p className="mt-2 text-xs text-[var(--text-secondary)]">
					{activeAction.requiresApproval
						? "Requiere aprobación humana antes de ejecutar."
						: "Puede continuar con el flujo supervisado."}
				</p>
				<p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
					Ruta de reversión: crear una excepción auditada desde la cola de
					revisión.
				</p>
			</section>

			<Link
				to="/review-queue"
				className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--text-inverse)]"
			>
				Abrir cola de revisión
			</Link>
		</div>
	);
}

export function RightPanel() {
	const pinnedArtifacts = useArtifactStore((state) => state.pinnedArtifacts);
	const diffFiles = useDiffApprovalStore((state) => state.diffFiles);
	const financialReports = useAccountingStore(
		(state) => state.financialReports,
	);
	const { activeAction } = useFiscalInspector();
	const [mode, setMode] = useState<PanelMode>(PANEL_MODE.ARTIFACTS);

	useEffect(() => {
		if (activeAction) setMode(PANEL_MODE.INSPECTOR);
	}, [activeAction]);

	const feedItems: FeedItem[] = [];
	if (diffFiles.length > 0) {
		feedItems.push({
			id: "diff-current",
			type: "diff",
			label: `Conciliación (${diffFiles.length})`,
			timestamp: Date.now(),
			content: <DiffView />,
		});
	}
	for (const [index, artifact] of pinnedArtifacts.slice(0, 5).entries()) {
		const metadata = artifact as { title?: string; kind?: string };
		feedItems.push({
			id: artifact.id,
			type: "artifact",
			label: metadata.title ?? metadata.kind ?? artifact.id,
			timestamp: Date.now() - index * 1000,
			content: <ContextPanel />,
		});
	}
	if (financialReports.length > 0) {
		feedItems.push({
			id: "reports",
			type: "reports",
			label: "Reportes",
			timestamp: Date.now() - 5000,
			content: <ReportPreview />,
		});
	}
	feedItems.push({
		id: "kpi-dashboard",
		type: "kpi",
		label: "Indicadores",
		timestamp: Date.now() - 10000,
		content: <KpiDashboard />,
	});
	const orderedFeedItems = [...feedItems].sort(
		(left, right) => right.timestamp - left.timestamp,
	);

	return (
		<aside className="flex h-full w-[480px] max-xl:w-full max-xl:max-w-[480px] flex-col border-l border-[var(--border-subtle)] bg-[var(--surface-1)]">
			<div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/50 px-4 py-2.5">
				<h2 className="text-xs font-semibold text-[var(--text-primary)]">
					{mode === PANEL_MODE.INSPECTOR
						? "Inspector fiscal"
						: "Feed de artefactos"}
				</h2>
				<div className="flex rounded-lg bg-[var(--surface-1)] p-0.5 text-[10px] font-semibold">
					<button
						type="button"
						onClick={() => setMode(PANEL_MODE.INSPECTOR)}
						className={cnMode(mode === PANEL_MODE.INSPECTOR)}
					>
						Inspector
					</button>
					<button
						type="button"
						onClick={() => setMode(PANEL_MODE.ARTIFACTS)}
						className={cnMode(mode === PANEL_MODE.ARTIFACTS)}
					>
						Artefactos
					</button>
				</div>
			</div>
			{mode === PANEL_MODE.INSPECTOR ? (
				<FiscalInspectorView />
			) : (
				<div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
					{orderedFeedItems.map((item) => (
						<section key={item.id}>
							<div className="flex items-center justify-between bg-[var(--surface-2)]/30 px-4 py-2">
								<h3 className="text-xs font-medium text-[var(--text-secondary)]">
									{item.label}
								</h3>
								<button
									type="button"
									className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
									title="Anclar artefacto"
									aria-label="Anclar artefacto"
								>
									<Pin size={12} />
								</button>
							</div>
							<div>{item.content}</div>
						</section>
					))}
					{orderedFeedItems.length === 0 && (
						<div className="flex h-full flex-col items-center justify-center px-6 text-center">
							<Bell size={28} className="text-[var(--text-muted)]" />
							<p className="mt-3 text-sm text-[var(--text-muted)]">
								Sin artefactos todavía
							</p>
						</div>
					)}
				</div>
			)}
		</aside>
	);
}

function cnMode(active: boolean) {
	return active
		? "rounded-md bg-[var(--surface-2)] px-2 py-1 text-[var(--text-primary)]"
		: "rounded-md px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]";
}
