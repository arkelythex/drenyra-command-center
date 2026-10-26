import type { AccountingMissionStatus } from "@drenyra/mission-domain";
import { FileEdit, Play, RotateCcw } from "lucide-react";

interface MissionActionsProps {
	status: AccountingMissionStatus;
	isReady: boolean;
	isAwaiting: boolean;
	isFinished: boolean;
	onStart: () => void;
	onReset: () => void;
	onRequestRevision: () => void;
}

export function MissionActions({
	status,
	isReady,
	isAwaiting,
	isFinished,
	onStart,
	onReset,
	onRequestRevision,
}: MissionActionsProps) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{isReady && !isAwaiting && (
				<button
					type="button"
					onClick={onStart}
					className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
				>
					<Play aria-hidden="true" size={16} />
					Iniciar misión
				</button>
			)}

			{status === ("REJECTED" as AccountingMissionStatus) && (
				<button
					type="button"
					onClick={onRequestRevision}
					className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
				>
					<FileEdit aria-hidden="true" size={16} />
					Solicitar revisión
				</button>
			)}

			{isFinished && (
				<button
					type="button"
					onClick={onReset}
					className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
				>
					<RotateCcw aria-hidden="true" size={16} />
					Nueva misión
				</button>
			)}

			{status === ("FAILED" as AccountingMissionStatus) && (
				<button
					type="button"
					onClick={onStart}
					className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
				>
					<RotateCcw aria-hidden="true" size={16} />
					Reintentar
				</button>
			)}
		</div>
	);
}
