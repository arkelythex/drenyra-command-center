import { DRENYRA_SUBAGENTS } from "@drenyra/domain";
import { BarChart3, Calculator, FileSearch, ShieldCheck } from "lucide-react";
import { getUserDisplayName } from "@/lib/api";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { cn } from "@/lib/utils";
import { useAccountingJobRuns } from "../../hooks/useAccountingJobRuns";
import { useAccountingJobsCatalog } from "../../hooks/useAccountingJobsCatalog";
import type { HubEmptyStateProps } from "./hub-empty-state/hub-empty-state.types";
import { L1RiskCard } from "./hub-empty-state/l1-risk-card";
import { OperationalContext } from "./hub-empty-state/operational-context";

export const HubEmptyState = ({
	autonomyLevel,
	hasPendingApproval,
	isSwarmStreaming,
	isDiscrepancyComposerOpen,
	isSuggestionAccepted,
	discrepancyScenario,
	discrepancyCommitStatus,
	undoSecondsLeft,
	showResolvedEvents,
	onAutonomyLevelChange,
	onReviewDiscrepancy,
	onCloseComposer,
	onAcceptSuggestion,
	onToggleResolvedEvents,
	onSelectResolvedEvent,
	onRunQuickAction,
}: HubEmptyStateProps) => {
	const _firstName = getUserDisplayName().split(/\s+/)[0] ?? "Operaciones";
	const { companyContext } = useActiveCompanyContext();
	const { runs } = useAccountingJobRuns(10);
	const { data: accountingJobsCatalog } = useAccountingJobsCatalog(
		companyContext.countryCode,
	);
	const _representativeRun =
		runs.find((run) => run.controlPlane?.representativePath) ?? null;
	const currentHour = new Date().getHours();
	const _greeting =
		currentHour < 12
			? "Buenos días"
			: currentHour < 19
				? "Buenas tardes"
				: "Buenas noches";

	const _ABSTRACTED_TOOLS = [
		{
			id: "audit",
			label: "Auditoría",
			command: "Ejecutar análisis de auditoría",
			icon: FileSearch,
			provider: "Drenyra Core",
		},
		{
			id: "cashflow",
			label: "Flujo de Caja",
			command: "Proyectar flujo de caja del mes",
			icon: BarChart3,
			provider: "Drenyra Finance",
		},
		{
			id: "taxation",
			label: "Tributación",
			command: "Revisar estado de impuestos",
			icon: Calculator,
			provider: "Drenyra Tax",
		},
		{
			id: "compliance",
			label: "Cumplimiento",
			command: "Revisar cumplimiento SUNAT",
			icon: ShieldCheck,
			provider: "Drenyra Regulatory",
		},
	];

	const runsAwaiting = runs.filter((r) => r.status === "AWAITING_APPROVAL");
	const _runsBackground = runs.filter(
		(r) => r.status === "RUNNING" || r.status === "QUEUED",
	);
	const hasSupervisionTasks =
		runsAwaiting.length > 0 || discrepancyScenario !== null;
	const _drenyraSubagents = DRENYRA_SUBAGENTS.map(
		(a) => a.name,
	) as unknown as readonly [
		"Eviden",
		"Vigila",
		"Traza",
		"Regula",
		"Revela",
		"Funde",
		"Reporta",
		"Archiva",
	];

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center space-y-12 py-12 text-center @container">
			{/* Welcome Heading: Reducido y enfocado */}
			<div className="space-y-4">
				<h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
					¿Qué construiremos hoy en{" "}
					<span className="text-[var(--accent)]">Drenyra Workspace</span>?
				</h1>
				<p className="mx-auto max-w-lg text-lg font-medium text-secondary">
					Tu centro de comando fiscal está listo. Selecciona un expediente o
					inicia una nueva misión.
				</p>
			</div>

			{/* Status Banner: Mantenemos el aviso de infraestructura pero más compacto */}
			<div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] shadow-sm ">
				<div className="flex items-center justify-between px-6 py-4 text-left">
					<div className="flex items-center gap-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-subtle text-success">
							<ShieldCheck size={20} />
						</div>
						<div>
							<p className="text-sm font-bold text-primary">
								Compliance Engine Activo
							</p>
							<p className="text-xs text-secondary font-black uppercase tracking-widest opacity-60">
								UBL 2.1 Verified · Shadow SUNAT
							</p>
						</div>
					</div>
					<button
						type="button"
						className="rounded-lg bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95"
					>
						Status
					</button>
				</div>
			</div>

			{/* Hidden original complex components for logic preservation */}
			<div className="hidden">
				<L1RiskCard
					isOpen={isDiscrepancyComposerOpen}
					scenario={discrepancyScenario}
					onReviewDiscrepancy={onReviewDiscrepancy}
				/>
				<OperationalContext
					autonomyLevel={autonomyLevel}
					hasPendingApproval={hasPendingApproval || hasSupervisionTasks}
					scenario={discrepancyScenario}
					onAutonomyLevelChange={onAutonomyLevelChange}
					onToggleResolvedEvents={onToggleResolvedEvents}
				/>
			</div>
		</div>
	);
};

interface OperationalAlertCardProps {
	icon: React.ComponentType<{ className?: string; size?: number }>;
	title: string;
	count: string | number;
	label: string;
	tone: "warning" | "danger" | "info";
	onClick: () => void;
}

function _OperationalAlertCard({
	icon: Icon,
	title,
	count,
	label,
	tone,
	onClick,
}: OperationalAlertCardProps) {
	const toneClasses = {
		warning: "text-amber-500 border-amber-500/20 bg-amber-500/5",
		danger: "text-red-500 border-red-500/20 bg-red-500/5",
		info: "text-info border-info-subtle bg-info-subtle",
	};

	return (
		<button
			type="button"
			onClick={onClick}
			className="group flex flex-col gap-4 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 text-left transition-all hover:border-[var(--border-prominent)] hover:shadow-lg"
		>
			<div className="flex items-center justify-between">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/10 text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
					<Icon size={20} strokeWidth={1.5} />
				</div>
				<span
					className={cn("text-lg font-black tracking-tight", toneClasses[tone])}
				>
					{count}
				</span>
			</div>
			<div>
				<p className="text-sm font-bold text-primary">{title}</p>
				<p className="text-xs text-muted font-medium">{label}</p>
			</div>
		</button>
	);
}
