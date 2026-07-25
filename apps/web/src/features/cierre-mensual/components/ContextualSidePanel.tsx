import type { CierreMensual } from "@drenyra/domain";
import { Activity, Bot, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TabId = "detalle" | "agentes" | "auditoria";

interface TabConfig {
	id: TabId;
	label: string;
	icon: typeof Bot;
}

const TABS: TabConfig[] = [
	{ id: "detalle", label: "Detalle", icon: FileText },
	{ id: "agentes", label: "Agentes", icon: Bot },
	{ id: "auditoria", label: "Auditoría", icon: Activity },
];

interface ContextualSidePanelProps {
	cierre: CierreMensual;
	activeTab?: TabId;
	onTabChange?: (tab: TabId) => void;
}

function DetalleTab({ cierre }: { cierre: CierreMensual }) {
	const checkedCount = (cierre.checklist ?? []).filter(
		(c: { completado?: boolean }) => c?.completado,
	).length;
	const totalCount = (cierre.checklist ?? []).length;

	return (
		<div className="space-y-4">
			{/* Estado — sin repetir empresa/RUC/periodo (están en header) */}
			<section>
				<h4 className="text-2xs font-bold uppercase tracking-wider text-[var(--text-quaternary)] mb-2">
					Estado
				</h4>
				<div className="space-y-1.5">
					<InfoRow
						label="Checklist"
						value={`${checkedCount}/${totalCount}`}
						highlight
					/>
					<InfoRow label="Riesgo" value={cierre.globalRiskLevel} risk />
				</div>
			</section>

			{/* Hallazgos */}
			<section>
				<h4 className="text-2xs font-bold uppercase tracking-wider text-[var(--text-quaternary)] mb-2">
					Hallazgos
				</h4>
				<div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
					<p className="text-xs text-[var(--text-secondary)] leading-relaxed">
						{cierre.agentAnalysis?.summary ?? "Sin hallazgos registrados."}
					</p>
					{cierre.agentAnalysis && (
						<p className="mt-2 text-2xs font-bold text-[var(--color-info)]">
							{Math.round(cierre.agentAnalysis.confidence * 100)}% confianza ·{" "}
							{cierre.agentAnalysis.discrepancies} discrepancias
						</p>
					)}
				</div>
			</section>

			{/* Impacto */}
			<section>
				<h4 className="text-2xs font-bold uppercase tracking-wider text-[var(--text-quaternary)] mb-2">
					Impacto
				</h4>
				<div className="space-y-1.5">
					<InfoRow label="Monto involucrado" value="S/ 14,820" />
					<InfoRow label="Bloquea" value="Validación IGV" />
				</div>
			</section>

			{/* Evidencia */}
			<section>
				<h4 className="text-2xs font-bold uppercase tracking-wider text-[var(--text-quaternary)] mb-2">
					Evidencia
				</h4>
				<div className="space-y-1.5">
					<RefChip label="SIRE Ventas" source="SUNAT" />
					<RefChip label="XML (3)" source="ERP" />
					<RefChip label="CDR (3)" source="SUNAT" />
				</div>
			</section>

			{/* Relacionados */}
			<section>
				<h4 className="text-2xs font-bold uppercase tracking-wider text-[var(--text-quaternary)] mb-2">
					Relacionados
				</h4>
				<div className="space-y-1.5">
					<InfoRow label="Documentos" value="3" />
					<InfoRow label="Proveedores" value="1" />
					<InfoRow label="Asientos" value="2" />
				</div>
			</section>
		</div>
	);
}

function AgentesTab(_props: { cierre: CierreMensual }) {
	const agentes = [
		{
			name: "Clasificador contable",
			status: "running" as const,
			detail: "142 / 428 comprobantes",
			icon: Bot,
		},
		{
			name: "Validador SUNAT",
			status: "completed" as const,
			detail: "3 inconsistencias encontradas",
			icon: Bot,
		},
		{
			name: "Conciliador bancario",
			status: "waiting" as const,
			detail: "Esperando aprobación",
			icon: Bot,
		},
		{
			name: "Analista IGV",
			status: "idle" as const,
			detail: "En espera de datos",
			icon: Bot,
		},
	];

	return (
		<div className="space-y-3">
			{agentes.map((agente) => (
				<div
					key={agente.name}
					className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3"
				>
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2 min-w-0">
							<agente.icon
								size={14}
								className="shrink-0 text-[var(--color-info)]"
							/>
							<span className="text-xs font-medium text-[var(--text-primary)] truncate">
								{agente.name}
							</span>
						</div>
						<StatusBadge status={agente.status} />
					</div>
					<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
						{agente.detail}
					</p>
				</div>
			))}
		</div>
	);
}

function AuditoriaTab(_props: { cierre: CierreMensual }) {
	const events = [
		{ time: "14:32", agent: "Validador SUNAT", action: "terminó revisión" },
		{ time: "14:21", agent: "Sistema", action: "Se generaron 2 propuestas" },
		{ time: "13:58", agent: "Sistema", action: "Se importaron 428 XML" },
	];

	return (
		<div className="space-y-3">
			{events.map((event, i) => (
				<div key={i} className="flex gap-3">
					<div className="flex flex-col items-center">
						<div className="size-2 rounded-full bg-[var(--color-info)]" />
						{i < events.length - 1 && (
							<div className="mt-1 w-px flex-1 bg-[var(--border-subtle)]" />
						)}
					</div>
					<div className="pb-3">
						<p className="text-2xs font-mono text-[var(--text-quaternary)]">
							{event.time}
						</p>
						<p className="text-xs text-[var(--text-secondary)] mt-0.5">
							<span className="font-medium text-[var(--text-primary)]">
								{event.agent}
							</span>{" "}
							{event.action}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

export function ContextualSidePanel({
	cierre,
	activeTab: externalTab,
	onTabChange,
}: ContextualSidePanelProps) {
	const [internalTab, setInternalTab] = useState<TabId>("detalle");
	const activeTab = externalTab ?? internalTab;

	const handleTabChange = (tab: TabId) => {
		setInternalTab(tab);
		onTabChange?.(tab);
	};

	return (
		<aside className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] overflow-hidden">
			{/* Tabs */}
			<div className="flex border-b border-[var(--border-subtle)]">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => handleTabChange(tab.id)}
							className={cn(
								"flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-2xs font-semibold transition-colors",
								isActive
									? "text-[var(--color-info)] border-b-2 border-[var(--color-info)] bg-[var(--color-info)]/5"
									: "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
							)}
						>
							<Icon size={12} />
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Panel content */}
			<div className="p-4">
				{activeTab === "detalle" && <DetalleTab cierre={cierre} />}
				{activeTab === "agentes" && <AgentesTab cierre={cierre} />}
				{activeTab === "auditoria" && <AuditoriaTab cierre={cierre} />}
			</div>
		</aside>
	);
}

/* ── Co-located helpers ────────────────────────────────────────── */

function StatusBadge({
	status,
}: {
	status: "running" | "completed" | "waiting" | "idle";
}) {
	const cfg = {
		running: {
			label: "En ejecución",
			color: "bg-[var(--color-info)] text-white",
		},
		completed: {
			label: "Finalizado",
			color: "bg-[var(--color-success)] text-white",
		},
		waiting: {
			label: "Esperando",
			color: "bg-[var(--color-warning)] text-white",
		},
		idle: {
			label: "En espera",
			color: "bg-[var(--text-quaternary)] text-white",
		},
	}[status];

	return (
		<span
			className={cn(
				"shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold",
				cfg.color,
			)}
		>
			{cfg.label}
		</span>
	);
}

function InfoRow({
	label,
	value,
	highlight,
	risk,
}: {
	label: string;
	value: string;
	highlight?: boolean;
	risk?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-2">
			<span className="text-2xs text-[var(--text-quaternary)]">{label}</span>
			<span
				className={cn(
					"text-2xs font-semibold",
					highlight && "text-[var(--color-info)]",
					risk && (value === "HIGH" || value === "CRITICAL")
						? "text-[var(--color-danger)]"
						: risk && value === "MEDIUM"
							? "text-[var(--color-warning)]"
							: risk && value === "LOW"
								? "text-[var(--color-success)]"
								: "text-[var(--text-primary)]",
				)}
			>
				{value}
			</span>
		</div>
	);
}

function RefChip({ label, source }: { label: string; source: string }) {
	return (
		<div className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1.5">
			<span className="text-2xs font-medium text-[var(--text-primary)]">
				{label}
			</span>
			<span className="text-[10px] text-[var(--text-quaternary)]">
				{source}
			</span>
		</div>
	);
}
