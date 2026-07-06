import {
	AlertTriangle,
	Clock,
	Database,
	DollarSign,
	FileText,
} from "lucide-react";
import { type AgentSession, useAgentsWindow } from "../agents-window.store";

interface AgentCardProps {
	session: AgentSession;
	onSelect?: () => void;
}

const RISK_COLORS: Record<string, string> = {
	low: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
	medium: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
	high: "bg-[var(--color-error)]/10 text-[var(--color-error)]",
	critical: "bg-[var(--color-error)]/20 text-[var(--color-error)] font-bold",
};

function formatDuration(ms: number): string {
	const sec = Math.floor(ms / 1000);
	const min = Math.floor(sec / 60);
	const s = sec % 60;
	return `${min}m ${s}s`;
}

function formatTokens(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

/**
 * AgentCard — card de sesión de agente vivo.
 * Muestra: nombre, progreso, estado, riesgo, tiempo, costo, acciones.
 */
export function AgentCard({ session, onSelect }: AgentCardProps) {
	const selectSession = useAgentsWindow((s) => s.selectSession);

	return (
		<button
			type="button"
			onClick={() => {
				if (onSelect) onSelect();
				else selectSession(session.id);
			}}
			className="flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 text-left transition-all hover:border-[var(--color-primary)] hover:shadow-sm"
		>
			{/* Header: name + status */}
			<div className="flex items-start justify-between">
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-[var(--text-primary)]">
						{session.agentName}
					</p>
					<p className="truncate text-[10px] text-[var(--text-muted)]">
						{session.clientName} · {session.period}
					</p>
				</div>
				<div
					className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${RISK_COLORS[session.risk]}`}
				>
					<AlertTriangle size={10} />
					{session.risk === "low"
						? "Bajo"
						: session.risk === "medium"
							? "Medio"
							: session.risk === "high"
								? "Alto"
								: "Crítico"}
				</div>
			</div>

			{/* Progress bar */}
			<div>
				<div className="mb-1 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
					<span className="truncate">{session.phase}</span>
					<span>{session.progress}%</span>
				</div>
				<div className="h-1.5 w-full rounded-full bg-[var(--surface-3)]">
					<div
						className="h-full rounded-full bg-[var(--color-primary)] transition-all"
						style={{ width: `${session.progress}%` }}
					/>
				</div>
			</div>

			{/* Metrics row */}
			<div className="flex flex-wrap gap-2 text-[10px] text-[var(--text-muted)]">
				<span className="flex items-center gap-1">
					<Clock size={10} />
					{formatDuration(session.elapsedMs)}
				</span>
				<span className="flex items-center gap-1">
					<DollarSign size={10} />
					{formatTokens(session.tokensUsed)} tokens
				</span>
				{session.changesProposed > 0 && (
					<span className="flex items-center gap-1">
						<FileText size={10} />+{session.changesProposed} cambios
					</span>
				)}
				{session.evidenceCollected > 0 && (
					<span className="flex items-center gap-1">
						<Database size={10} />
						{session.evidenceCollected} docs
					</span>
				)}
			</div>

			{/* Action needed badge */}
			{session.requiresAction && (
				<div className="flex items-center gap-1 rounded-md bg-[var(--color-primary)]/10 px-2 py-1 text-[9px] font-medium text-[var(--color-primary)]">
					<AlertTriangle size={10} />
					Requiere acción
				</div>
			)}
		</button>
	);
}
