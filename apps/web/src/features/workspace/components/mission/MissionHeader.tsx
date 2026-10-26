import type { AccountingMissionStatus } from "@drenyra/mission-domain";
import { CircleAlert, FileText, Loader2 } from "lucide-react";

interface MissionHeaderProps {
	status: AccountingMissionStatus;
	isMockMode: boolean;
	elapsedMs: number;
}

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Borrador",
	QUEUED: "En cola",
	RUNNING: "Ejecutando misión…",
	BLOCKED: "Misión bloqueada",
	AWAITING_APPROVAL: "Esperando aprobación",
	APPROVED: "Aprobada",
	REJECTED: "Rechazada",
	REVISION_REQUESTED: "Revisión solicitada",
	COMPLETED: "Completada",
	FAILED: "Fallida",
	UNKNOWN: "Estado desconocido",
};

const ATTENTION = new Set(["BLOCKED", "AWAITING_APPROVAL"]);

export function MissionHeader({
	status,
	isMockMode,
	elapsedMs,
}: MissionHeaderProps) {
	const key = status as string;
	const elapsedSec = Math.floor(elapsedMs / 1000);

	return (
		<div role="status" className="flex items-center gap-2 text-sm">
			{key === "RUNNING" ? (
				<Loader2
					aria-hidden="true"
					className="size-4 animate-spin text-brand motion-reduce:animate-none"
				/>
			) : null}
			{ATTENTION.has(key) ? (
				<CircleAlert aria-hidden="true" className="size-4 text-warning" />
			) : null}
			{key === "DRAFT" ? (
				<FileText aria-hidden="true" className="size-4 text-muted-foreground" />
			) : null}
			{isMockMode ? (
				<span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-xs font-medium text-warning">
					SIMULACIÓN
				</span>
			) : null}
			<span className="font-medium text-foreground">
				{STATUS_LABELS[key] ?? key}
			</span>
			{elapsedMs > 0 ? (
				<span className="font-mono text-xs tabular-nums text-muted-foreground">
					{elapsedSec}s
				</span>
			) : null}
		</div>
	);
}
