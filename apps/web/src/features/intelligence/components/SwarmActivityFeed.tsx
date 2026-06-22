import { AlertTriangle, CheckCircle2, Cpu, ScanLine } from "lucide-react";
import { useSwarmStore } from "@/features/intelligence/stores/useSwarmStore";
import { cn } from "@/lib/utils";
import { ActivityCard } from "./ActivityCard";

const statusByLevel = {
	info: "active",
	success: "success",
	warning: "active",
	error: "error",
} as const;

const iconByLevel = {
	info: ScanLine,
	success: CheckCircle2,
	warning: AlertTriangle,
	error: AlertTriangle,
} as const;

function formatTime(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "--:--";
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface SwarmActivityFeedProps {
	className?: string;
	emptyMessage?: string;
}

export function SwarmActivityFeed({
	className,
	emptyMessage = "Esperando actividad del agente en esta misión.",
}: SwarmActivityFeedProps) {
	const activeRunId = useSwarmStore((state) => state.activeRunId);
	const runsById = useSwarmStore((state) => state.runsById);
	const activeRun = activeRunId ? runsById[activeRunId] : null;
	const logs = activeRun ? [...activeRun.logs].reverse() : [];

	return (
		<div
			className={cn(
				"custom-scrollbar flex h-full flex-col gap-3 overflow-y-auto p-4",
				className,
			)}
		>
			<header className="mb-1 flex items-center justify-between">
				<h3 className="text-2xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
					Registro de actividad
				</h3>
				<Cpu size={12} className="text-primary/40" />
			</header>

			{logs.length === 0 ? (
				<div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
					{emptyMessage}
				</div>
			) : (
				<div className="space-y-3">
					{logs.map((log) => (
						<ActivityCard
							key={log.id}
							agentName={log.agentName ?? "Sistema"}
							message={log.message}
							icon={iconByLevel[log.level]}
							status={statusByLevel[log.level]}
							timestamp={formatTime(log.timestamp)}
						/>
					))}
				</div>
			)}
		</div>
	);
}
