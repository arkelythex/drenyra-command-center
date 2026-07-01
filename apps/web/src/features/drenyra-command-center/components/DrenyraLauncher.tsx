/**
 * DrenyraLauncher
 *
 * Codex-inspired launcher screen for Drenyra fiscal command center.
 * Shows a centered prompt area, quick action cards, and recent cases.
 * Navigate to workspace, chat, or specific views.
 */

import {
	ArrowRight,
	Bot,
	BrainCircuit,
	CheckCircle,
	Clock,
	FileText,
	Search,
	Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrenyraLauncherProps {
	onNavigate: (
		destination: "workspace" | "chat" | "approvals" | "audit",
	) => void;
	onOpenCase: (caseId: string) => void;
}

const quickActions = [
	{
		id: "new-case" as const,
		icon: FileText,
		title: "Nuevo Caso Fiscal",
		description: "Crear un caso para seguimiento",
		destination: "workspace" as const,
	},
	{
		id: "chat" as const,
		icon: Bot,
		title: "Consultar Agente",
		description: "Interactuar con un agente Drenyra",
		destination: "chat" as const,
	},
	{
		id: "approvals" as const,
		icon: CheckCircle,
		title: "Revisar Aprobaciones",
		description: "Aprobar decisiones pendientes",
		destination: "workspace" as const,
	},
	{
		id: "audit" as const,
		icon: Shield,
		title: "Panel de Auditoría",
		description: "Ver trazabilidad fiscal",
		destination: "workspace" as const,
	},
];

const recentCases = [
	{
		id: "case-001",
		title: "Discrepancia IGV Q1 2026",
		status: "pending" as const,
		risk: "Alto",
	},
	{
		id: "case-002",
		title: "Detracción no registrada — Factura F001-12345",
		status: "completed" as const,
		risk: "Medio",
	},
	{
		id: "case-003",
		title: "Validación SIRE — Exportaciones",
		status: "in_progress" as const,
		risk: "Bajo",
	},
];

function StatusBadge({
	status,
}: {
	status: "pending" | "completed" | "in_progress";
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
				status === "pending" &&
					"bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
				status === "completed" &&
					"bg-[var(--color-success)]/10 text-[var(--color-success)]",
				status === "in_progress" &&
					"bg-[var(--color-info)]/10 text-[var(--color-info)]",
			)}
		>
			{status === "pending" && "Pendiente"}
			{status === "completed" && "Completado"}
			{status === "in_progress" && "En Progreso"}
		</span>
	);
}

function RiskLabel({ level }: { level: string }) {
	return (
		<span className="text-xs font-medium text-[var(--text-tertiary)]">
			Riesgo: {level}
		</span>
	);
}

export function DrenyraLauncher({
	onNavigate,
	onOpenCase,
}: DrenyraLauncherProps) {
	return (
		<div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
			{/* Header / Brand */}
			<div className="mb-12 flex flex-col items-center gap-4">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-1)]/80  border border-[var(--border-subtle)]">
					<BrainCircuit className="h-8 w-8 text-[var(--color-primary)]" />
				</div>
				<h1 className="text-[var(--text-display-sm)] font-black tracking-tight text-[var(--text-primary)] leading-none max-sm:text-[var(--text-3xl)]">
					Centro de Comando Fiscal Drenyra
				</h1>
			</div>

			{/* Prompt Section */}
			<div className="mb-16 flex flex-col items-center gap-4">
				<p className="text-lg text-[var(--text-secondary)]">
					¿Qué necesitás hacer en Drenyra?
				</p>
				<div className="flex w-full max-w-2xl items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 transition-colors focus-within:border-[var(--border-default)]">
					<Search className="h-5 w-5 text-[var(--text-tertiary)] shrink-0" />
					<input
						type="text"
						placeholder="Describí tu consulta fiscal..."
						className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none text-sm"
						aria-label="Comando Drenyra"
					/>
					<kbd className="hidden rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2 py-0.5 text-xs text-[var(--text-tertiary)] sm:inline-block">
						⌘K
					</kbd>
				</div>
			</div>

			{/* Quick Actions Grid */}
			<div className="mb-16">
				<h2 className="mb-4 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
					Acciones Rápidas
				</h2>
				<div className="grid gap-4 sm:grid-cols-2">
					{quickActions.map((action) => (
						<button
							key={action.id}
							type="button"
							onClick={() => onNavigate(action.destination)}
							className="group flex items-start gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80  p-5 text-left transition-all hover:border-[var(--border-default)] hover:bg-[var(--surface-1)]"
						>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
								<action.icon className="h-5 w-5 text-[var(--text-primary)]" />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold text-[var(--text-primary)]">
									{action.title}
								</h3>
								<p className="mt-0.5 text-sm text-[var(--text-secondary)]">
									{action.description}
								</p>
							</div>
							<ArrowRight className="mt-1 h-4 w-4 text-[var(--text-tertiary)] transition-transform group-hover:translate-x-0.5" />
						</button>
					))}
				</div>
			</div>

			{/* Recent Cases */}
			<div>
				<div className="mb-4 flex items-center gap-2">
					<Clock className="h-4 w-4 text-[var(--text-secondary)]" />
					<h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
						Casos Recientes
					</h2>
				</div>
				<div className="grid gap-3 sm:grid-cols-3">
					{recentCases.map((c) => (
						<button
							key={c.id}
							type="button"
							onClick={() => onOpenCase(c.id)}
							className="group flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80  p-4 text-left transition-all hover:border-[var(--border-default)]"
						>
							<div className="flex items-center justify-between gap-2">
								<StatusBadge status={c.status} />
								<RiskLabel level={c.risk} />
							</div>
							<p className="text-sm font-medium text-[var(--text-primary)] leading-snug">
								{c.title}
							</p>
							<ArrowRight className="h-3.5 w-3.5 self-end text-[var(--text-tertiary)] transition-transform group-hover:translate-x-0.5" />
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
