import { Link } from "@tanstack/react-router";
import type { FiscalActionContext } from "@drenyra/domain";
import { useFiscalInspector } from "@/context/FiscalInspectorContext";
import {
	useInboxDashboard,
	type InboxDashboard,
} from "./hooks/useInboxDashboard";
import {
	ArrowRight,
	Bot,
	CheckCircle2,
	CircleAlert,
	Clock3,
	FileCheck2,
	Landmark,
	Layers,
	Loader2,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY = { P0: "P0", P1: "P1", P2: "P2", P3: "P3" } as const;
type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

const CONFIDENCE_BAND = { HIGH: "Alta", MEDIUM: "Media", LOW: "Baja" } as const;
type ConfidenceBand = (typeof CONFIDENCE_BAND)[keyof typeof CONFIDENCE_BAND];

const AGENT_STATUS = {
	RUNNING: "running",
	WAITING: "waiting",
	COMPLETED: "completed",
} as const;
type AgentStatus = (typeof AGENT_STATUS)[keyof typeof AGENT_STATUS];

interface ClosePhase {
	name: string;
	state: "completed" | "active" | "blocked" | "pending";
	evidenceCount: number;
}
interface CloseDecision {
	id: string;
	priority: Priority;
	title: string;
	cause: string;
	impact: string;
	evidence: string;
	deadline: string;
	actionLabel: string;
	to: "/review-queue" | "/cierre-mensual" | "/compliance";
}
interface ApprovalItem {
	id: string;
	title: string;
	type: string;
	confidence: ConfidenceBand;
	evidence: string;
	to: "/review-queue";
}
interface AgentOperation {
	id: string;
	name: string;
	status: AgentStatus;
	operation: string;
	evidence: string;
	finding: string;
	nextStep: string;
}
interface Recommendation {
	id: string;
	title: string;
	confidence: ConfidenceBand;
	reason: string;
	scope: string;
	closeImpact: string;
	to: "/review-queue" | "/inbox";
}
interface ActivityEntry {
	id: string;
	time: string;
	description: string;
	evidence: string;
}
interface CompanyAttention {
	id: string;
	name: string;
	ruc: string;
	riskCause: string;
	blockers: number;
	approvals: number;
	to: "/firm/clients";
}
interface InspectorActionInput {
	id: string;
	title: string;
	impact: string;
	evidence: string;
	riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	requiresApproval: boolean;
	module: FiscalActionContext["module"];
}

const CLOSE_PHASES: ClosePhase[] = [
	{ name: "Importación", state: "completed", evidenceCount: 428 },
	{ name: "Validación", state: "completed", evidenceCount: 428 },
	{ name: "Conciliación", state: "active", evidenceCount: 126 },
	{ name: "Revisión", state: "blocked", evidenceCount: 17 },
	{ name: "Impuestos", state: "pending", evidenceCount: 0 },
	{ name: "Declaración", state: "pending", evidenceCount: 0 },
];

const CLOSE_DECISIONS: CloseDecision[] = [
	{
		id: "sire-mismatch",
		priority: PRIORITY.P0,
		title: "Resolver 3 inconsistencias entre SIRE y comprobantes",
		cause:
			"Los CDR de F001-456, F001-457 y B002-123 no coinciden con el registro de ventas.",
		impact: "Bloquea la validación del IGV y la declaración del período.",
		evidence: "3 XML, 3 CDR y 1 cruce SIRE disponibles.",
		deadline: "Vence hoy · 17:00",
		actionLabel: "Revisar inconsistencias",
		to: "/review-queue",
	},
	{
		id: "bank-match",
		priority: PRIORITY.P1,
		title: "Aprobar 2 conciliaciones bancarias propuestas",
		cause: "Dos movimientos BCP tienen coincidencias de monto y fecha.",
		impact: "Permite completar la fase de conciliación.",
		evidence: "Estados BCP y comprobantes vinculados.",
		deadline: "Hoy",
		actionLabel: "Ver aprobaciones",
		to: "/review-queue",
	},
	{
		id: "expense-review",
		priority: PRIORITY.P2,
		title: "Clasificar 12 gastos con deducibilidad pendiente",
		cause:
			"Los comprobantes no contienen suficiente detalle para la regla tributaria.",
		impact: "Reduce observaciones antes del cierre.",
		evidence: "12 comprobantes con sustento parcial.",
		deadline: "Antes de impuestos",
		actionLabel: "Revisar gastos",
		to: "/compliance",
	},
];

const APPROVALS: ApprovalItem[] = [
	{
		id: "approval-1",
		title: "Conciliación de abono BCP S/ 8,420",
		type: "Conciliación",
		confidence: CONFIDENCE_BAND.HIGH,
		evidence: "Monto exacto, fecha coincidente y factura F001-457.",
		to: "/review-queue",
	},
	{
		id: "approval-2",
		title: "Aplicar detracción a proveedor recurrente",
		type: "Impuestos",
		confidence: CONFIDENCE_BAND.MEDIUM,
		evidence: "Historial del proveedor y regla SPOT.",
		to: "/review-queue",
	},
];

const AGENT_OPERATIONS: AgentOperation[] = [
	{
		id: "agent-classifier",
		name: "Clasificador contable",
		status: AGENT_STATUS.RUNNING,
		operation: "Contrasta 142 compras contra el plan contable y reglas IGV.",
		evidence: "XML, RUC de proveedores y reglas de periodificación.",
		finding: "18 compras requieren cuenta analítica.",
		nextStep: "Enviar 18 propuestas a revisión humana.",
	},
	{
		id: "agent-sunat",
		name: "Validador SUNAT",
		status: AGENT_STATUS.COMPLETED,
		operation: "Validó CDR y estado SUNAT de 428 comprobantes.",
		evidence: "CDR, XML y consulta de estado.",
		finding: "Detectó 3 inconsistencias SIRE.",
		nextStep: "Esperar decisión del contador sobre el P0.",
	},
	{
		id: "agent-bank",
		name: "Conciliador bancario",
		status: AGENT_STATUS.WAITING,
		operation: "Preparó dos coincidencias de banco con respaldo documental.",
		evidence: "Estado BCP, monto y fecha de comprobantes.",
		finding: "Dos propuestas superan el umbral de revisión.",
		nextStep: "Esperar aprobación para registrar la conciliación.",
	},
];

const RECOMMENDATIONS: Recommendation[] = [
	{
		id: "r-classify",
		title: "Clasificar 142 compras antes de impuestos",
		confidence: CONFIDENCE_BAND.HIGH,
		reason:
			"Coincidencia entre XML, patrón histórico y cuenta contable en 124 casos.",
		scope: "142 compras · julio 2026",
		closeImpact: "Reduce la revisión manual y prepara la fase de impuestos.",
		to: "/inbox",
	},
	{
		id: "r-detraccion",
		title: "Revisar detracciones de 3 proveedores",
		confidence: CONFIDENCE_BAND.MEDIUM,
		reason:
			"La regla SPOT coincide, pero el servicio requiere confirmación humana.",
		scope: "S/ 4,200 · 3 proveedores",
		closeImpact: "Evita una observación antes de la declaración.",
		to: "/review-queue",
	},
];

const RECENT_ACTIVITY: ActivityEntry[] = [
	{
		id: "a1",
		time: "Hace 8 min",
		description: "Validador SUNAT terminó la revisión de CDR.",
		evidence: "428 CDR revisados · 3 inconsistencias.",
	},
	{
		id: "a2",
		time: "Hace 19 min",
		description: "Se generaron 2 propuestas de conciliación bancaria.",
		evidence: "BCP · estados y comprobantes vinculados.",
	},
	{
		id: "a3",
		time: "Hace 41 min",
		description: "Se importaron comprobantes del período.",
		evidence: "428 XML aceptados · fuente OSE.",
	},
];

const COMPANIES_REQUIRING_ATTENTION: CompanyAttention[] = [
	{
		id: "c1",
		name: "Drenyra Consulting SAC",
		ruc: "20123456789",
		riskCause: "3 inconsistencias SIRE bloquean la validación de IGV.",
		blockers: 1,
		approvals: 2,
		to: "/firm/clients",
	},
	{
		id: "c2",
		name: "Restaurante Lúcuma SAC",
		ruc: "20987654321",
		riskCause: "Faltan estados bancarios para conciliar junio.",
		blockers: 0,
		approvals: 4,
		to: "/firm/clients",
	},
];

function createInspectorAction(
	input: InspectorActionInput,
): FiscalActionContext {
	const action: FiscalActionContext = {
		traceId: `home-${input.id}`,
		summary: input.title,
		status: "ANALYZED",
		riskLevel: input.riskLevel,
		impact: input.impact,
		proposedBy: "agent",
		requiresApproval: input.requiresApproval,
		module: input.module,
		companyRuc: "20123456789",
		createdAt: "2026-07-10T13:00:00.000Z",
		evidence: [
			{
				id: `${input.id}-evidence`,
				kind: "SIRE",
				label: input.evidence,
				hash: "evidencia-verificada",
				verified: true,
				attachedAt: "2026-07-10T13:00:00.000Z",
			},
		],
	};
	return input.requiresApproval
		? { ...action, requiredApprovers: ["Contador responsable"] }
		: action;
}

function PriorityBadge({ priority }: { priority: Priority }) {
	return (
		<span
			className={cn(
				"rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider",
				priority === PRIORITY.P0 &&
					"border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
				priority === PRIORITY.P1 &&
					"border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
				priority === PRIORITY.P2 &&
					"border-[var(--color-info)]/30 bg-[var(--color-info)]/10 text-[var(--color-info)]",
			)}
		>
			{priority}
		</span>
	);
}

function AgentStatusLabel({ status }: { status: AgentStatus }) {
	let label = "Completado";
	if (status === AGENT_STATUS.RUNNING) label = "En ejecución";
	else if (status === AGENT_STATUS.WAITING) label = "Espera aprobación";
	return (
		<span className="text-[10px] font-semibold text-[var(--text-secondary)]">
			{label}
		</span>
	);
}

function PrimaryDecisionCard({
	decision,
	onInspect,
}: {
	decision: (typeof CLOSE_DECISIONS)[0];
	onInspect: () => void;
}) {
	return (
		<section className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--surface-1)] p-5">
			<div className="flex items-start gap-3">
				<CircleAlert className="mt-0.5 text-[var(--color-danger)]" size={20} />
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<PriorityBadge priority={decision.priority} />
						<span className="text-xs font-semibold text-[var(--color-danger)]">
							{decision.deadline}
						</span>
					</div>
					<h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
						{decision.title}
					</h2>
					<p className="mt-2 text-sm text-[var(--text-secondary)]">
						{decision.cause}
					</p>
					<div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
						<p>
							<strong className="text-[var(--text-primary)]">Impacto: </strong>
							<span className="text-[var(--text-secondary)]">
								{decision.impact}
							</span>
						</p>
						<p>
							<strong className="text-[var(--text-primary)]">
								Evidencia:{" "}
							</strong>
							<span className="text-[var(--text-secondary)]">
								{decision.evidence}
							</span>
						</p>
					</div>
					<div className="mt-4 flex flex-wrap gap-3">
						<button
							type="button"
							onClick={onInspect}
							className="text-sm font-semibold text-[var(--color-primary)]"
						>
							Inspeccionar evidencia
						</button>
						<Link
							to={decision.to}
							className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
						>
							{decision.actionLabel} <ArrowRight size={15} />
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}

function InboxRenderer({
	isLoading,
	companyName,
	companyRuc,
	period,
	dashboard,
	approvals,
	primaryDecision,
	secondaryDecisions,
	agentOperations,
	recommendations,
	recentActivity,
	companyAttention,
	closePhases,
	open,
}: {
	isLoading: boolean;
	companyName: string;
	companyRuc: string;
	period: string;
	dashboard: InboxDashboard | undefined;
	approvals: ApprovalItem[];
	primaryDecision: (typeof CLOSE_DECISIONS)[0];
	secondaryDecisions: typeof CLOSE_DECISIONS;
	agentOperations: AgentOperation[];
	recommendations: Recommendation[];
	recentActivity: ActivityEntry[];
	companyAttention: CompanyAttention[];
	closePhases: ClosePhase[];
	open: ReturnType<typeof useFiscalInspector>["open"];
}) {
	return (
		<div className="flex-1 overflow-y-auto bg-[var(--bg-canvas)]">
			<main className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
				<header className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
							Centro de operaciones · cierre mensual
						</p>
						<h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
							{isLoading ? "Cargando…" : companyName}
						</h1>
						<p className="mt-1 text-sm text-[var(--text-secondary)]">
							RUC {companyRuc} · {period} ·{" "}
							{isLoading
								? "…"
								: (dashboard?.closeStatus ?? "Cierre en revisión")}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2 text-xs">
						<span className="rounded-full bg-[var(--color-danger)]/10 px-3 py-1.5 font-semibold text-[var(--color-danger)]">
							{dashboard?.blockerCount ?? 1} bloqueo P0
						</span>
						<span className="rounded-full bg-[var(--color-warning)]/10 px-3 py-1.5 font-semibold text-[var(--color-warning)]">
							{approvals.length} aprobaciones pendientes
						</span>
					</div>
				</header>

				<section className="grid gap-4 lg:grid-cols-12">
					<div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5 lg:col-span-8">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
									Estado del cierre
								</p>
								<p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
									{isLoading
										? "Cargando…"
										: (dashboard?.closeStatus ?? "Requiere decisión contable")}
								</p>
								<p className="mt-1 text-sm text-[var(--text-secondary)]">
									{isLoading
										? ""
										: (dashboard?.primaryDecision?.impact ??
											"La declaración no puede continuar hasta resolver el bloqueo P0.")}
								</p>
							</div>
							<Link
								to="/cierre-mensual"
								className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)]"
							>
								Continuar cierre <ArrowRight size={16} />
							</Link>
						</div>
						<div className="mt-5 grid gap-2 sm:grid-cols-3">
							{closePhases.map((phase) => (
								<div
									key={phase.name}
									className="rounded-lg bg-[var(--surface-2)] px-3 py-2"
								>
									<div className="flex items-center justify-between gap-2">
										<span className="text-xs font-medium text-[var(--text-primary)]">
											{phase.name}
										</span>
										<span className="text-[10px] text-[var(--text-tertiary)]">
											{phase.evidenceCount} evidencias
										</span>
									</div>
									<p className="mt-1 text-[10px] font-semibold text-[var(--text-secondary)]">
										{phase.state === "completed" && "Completada"}
										{phase.state === "active" && "En curso"}
										{phase.state === "blocked" && "Bloqueada"}
										{phase.state === "pending" && "Pendiente"}
									</p>
								</div>
							))}
						</div>
					</div>

					<section className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5 lg:col-span-4">
						<div className="flex items-center gap-2">
							<ShieldCheck size={16} className="text-[var(--color-warning)]" />
							<h2 className="font-semibold text-[var(--text-primary)]">
								Pendiente de tu aprobación
							</h2>
						</div>
						<div className="mt-3 space-y-3">
							{approvals.map((approval) => (
								<Link
									key={approval.id}
									to={approval.to}
									className="block rounded-xl bg-[var(--surface-2)] p-3 transition-colors hover:bg-[var(--bg-muted)]"
								>
									<div className="flex justify-between gap-2">
										<p className="text-xs font-semibold text-[var(--text-primary)]">
											{approval.title}
										</p>
										<span className="shrink-0 text-[10px] font-semibold text-[var(--color-primary)]">
											{approval.confidence}
										</span>
									</div>
									<p className="mt-1 text-[11px] text-[var(--text-secondary)]">
										{approval.type} · {approval.evidence}
									</p>
								</Link>
							))}
						</div>
					</section>
				</section>

				<section className="grid gap-4 lg:grid-cols-12">
					<div className="space-y-4 lg:col-span-8">
						<PrimaryDecisionCard
							decision={primaryDecision}
							onInspect={() =>
								open(
									createInspectorAction({
										id: primaryDecision.id,
										title: primaryDecision.title,
										impact: primaryDecision.impact,
										evidence: primaryDecision.evidence,
										riskLevel: "CRITICAL",
										requiresApproval: true,
										module: "sire",
									}),
								)
							}
						/>
						<div className="grid gap-3 md:grid-cols-2">
							{secondaryDecisions.map((decision) => (
								<Link
									key={decision.id}
									to={decision.to}
									className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--border-default)]"
								>
									<div className="flex items-center justify-between gap-2">
										<PriorityBadge priority={decision.priority} />
										<span className="text-[10px] text-[var(--text-tertiary)]">
											{decision.deadline}
										</span>
									</div>
									<p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
										{decision.title}
									</p>
									<p className="mt-1 text-xs text-[var(--text-secondary)]">
										{decision.impact}
									</p>
								</Link>
							))}
						</div>
					</div>

					<section className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5 lg:col-span-4">
						<div className="flex items-center gap-2">
							<Bot size={16} className="text-[var(--color-info)]" />
							<h2 className="font-semibold text-[var(--text-primary)]">
								Agentes en operación
							</h2>
						</div>
						<div className="mt-4 space-y-4">
							{agentOperations.map((agent) => (
								<div
									key={agent.id}
									className="border-l-2 border-[var(--border-default)] pl-3"
								>
									<div className="flex justify-between gap-2">
										<p className="text-xs font-semibold text-[var(--text-primary)]">
											{agent.name}
										</p>
										<AgentStatusLabel status={agent.status} />
									</div>
									<p className="mt-1 text-xs text-[var(--text-secondary)]">
										{agent.operation}
									</p>
									<p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
										<strong>Hallazgo: </strong>
										{agent.finding}
									</p>
									<p className="mt-1 text-[11px] text-[var(--color-primary)]">
										Siguiente: {agent.nextStep}
									</p>
								</div>
							))}
						</div>
					</section>
				</section>

				<section className="grid gap-4 lg:grid-cols-12">
					<div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5 lg:col-span-8">
						<div className="flex items-center gap-2">
							<Sparkles size={16} className="text-[var(--color-primary)]" />
							<h2 className="font-semibold text-[var(--text-primary)]">
								Recomendaciones explicables
							</h2>
						</div>
						<div className="mt-4 grid gap-3 md:grid-cols-2">
							{recommendations.map((recommendation) => (
								<Link
									key={recommendation.id}
									to={recommendation.to}
									onClick={(event) => {
										event.preventDefault();
										open(
											createInspectorAction({
												id: recommendation.id,
												title: recommendation.title,
												impact: recommendation.closeImpact,
												evidence: recommendation.reason,
												riskLevel:
													recommendation.confidence === CONFIDENCE_BAND.HIGH
														? "MEDIUM"
														: "HIGH",
												requiresApproval:
													recommendation.confidence !== CONFIDENCE_BAND.HIGH,
												module: "compras",
											}),
										);
									}}
									className="rounded-xl bg-[var(--surface-2)] p-4 transition-colors hover:bg-[var(--bg-muted)]"
								>
									<div className="flex justify-between gap-2">
										<p className="text-sm font-semibold text-[var(--text-primary)]">
											{recommendation.title}
										</p>
										<span className="shrink-0 text-xs font-semibold text-[var(--color-primary)]">
											Confianza {recommendation.confidence}
										</span>
									</div>
									<p className="mt-2 text-xs text-[var(--text-secondary)]">
										{recommendation.reason}
									</p>
									<p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
										{recommendation.scope} · {recommendation.closeImpact}
									</p>
								</Link>
							))}
						</div>
					</div>
					<section className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5 lg:col-span-4">
						<div className="flex items-center gap-2">
							<Clock3 size={16} className="text-[var(--text-secondary)]" />
							<h2 className="font-semibold text-[var(--text-primary)]">
								Actividad auditable
							</h2>
						</div>
						<ol className="mt-4 space-y-3">
							{recentActivity.map((activity) => (
								<li key={activity.id} className="flex gap-3">
									<FileCheck2
										size={14}
										className="mt-0.5 shrink-0 text-[var(--color-success)]"
									/>
									<div>
										<p className="text-xs text-[var(--text-primary)]">
											{activity.description}
										</p>
										<p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
											{activity.time} · {activity.evidence}
										</p>
									</div>
								</li>
							))}
						</ol>
					</section>
				</section>

				<section className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
					<div className="flex items-center gap-2">
						<Landmark size={16} className="text-[var(--text-secondary)]" />
						<h2 className="font-semibold text-[var(--text-primary)]">
							Empresas que requieren atención
						</h2>
					</div>
					<div className="mt-4 grid gap-3 md:grid-cols-2">
						{companyAttention.map((company) => (
							<Link
								key={company.id}
								to={company.to}
								className="rounded-xl bg-[var(--surface-2)] p-4 transition-colors hover:bg-[var(--bg-muted)]"
							>
								<div className="flex justify-between gap-3">
									<p className="text-sm font-semibold text-[var(--text-primary)]">
										{company.name}
									</p>
									<span className="text-xs text-[var(--text-tertiary)]">
										RUC {company.ruc}
									</span>
								</div>
								<p className="mt-2 text-xs text-[var(--text-secondary)]">
									{company.riskCause}
								</p>
								<p className="mt-3 text-[11px] text-[var(--text-tertiary)]">
									{company.blockers} bloqueos · {company.approvals} aprobaciones
									pendientes
								</p>
							</Link>
						))}
					</div>
				</section>
			</main>
		</div>
	);
}

export function AccountingInbox() {
	const { open } = useFiscalInspector();
	const { data: dashboard, isLoading } = useInboxDashboard();

	const primaryDecision = dashboard?.primaryDecision ?? CLOSE_DECISIONS[0];
	const secondaryDecisions =
		dashboard?.secondaryDecisions ?? CLOSE_DECISIONS.slice(1);
	const approvals = dashboard?.approvals ?? APPROVALS;
	const agentOperations = dashboard?.agents ?? AGENT_OPERATIONS;
	const recommendations = dashboard?.recommendations ?? RECOMMENDATIONS;
	const recentActivity = dashboard?.recentActivity ?? RECENT_ACTIVITY;
	const companyAttention =
		dashboard?.companiesAttention ?? COMPANIES_REQUIRING_ATTENTION;
	const closePhases = dashboard?.phaseProgress ?? CLOSE_PHASES;
	if (!primaryDecision) return null;

	return (
		<InboxRenderer
			isLoading={isLoading}
			companyName={dashboard?.companyName ?? "Drenyra Consulting SAC"}
			companyRuc={dashboard?.companyRuc ?? "20123456789"}
			period={dashboard?.period ?? "Julio 2026"}
			dashboard={dashboard}
			approvals={approvals}
			primaryDecision={primaryDecision}
			secondaryDecisions={secondaryDecisions}
			agentOperations={agentOperations}
			recommendations={recommendations}
			recentActivity={recentActivity}
			companyAttention={companyAttention}
			closePhases={closePhases}
			open={open}
		/>
	);
}
