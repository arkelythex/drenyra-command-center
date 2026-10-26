import { CircleCheck, CircleX, Play, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";

interface MissionUnknownStateProps {
	onReconcile: (resolution: string, reason: string) => void;
	isSubmitting: boolean;
}

const actionClass =
	"flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50";

/**
 * The server could not confirm what happened. A person resolves it explicitly,
 * and the written reason goes to the audit trail, so it is mandatory.
 */
export function MissionUnknownState({
	onReconcile,
	isSubmitting,
}: MissionUnknownStateProps) {
	const [reason, setReason] = useState("");
	const reasonId = useId();
	const trimmed = reason.trim();
	const disabled = isSubmitting || trimmed === "";
	const resolve = (resolution: string) => onReconcile(resolution, trimmed);

	return (
		<section className="w-full max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5">
			<div className="space-y-1">
				<h3 className="flex items-center gap-2 text-base font-medium tracking-tight">
					<TriangleAlert aria-hidden="true" className="size-4 text-warning" />
					Estado desconocido
				</h3>
				<p className="text-sm text-muted-foreground">
					No se pudo confirmar el estado de la misión. Elige cómo resolver:
				</p>
			</div>

			<div className="space-y-2">
				<label htmlFor={reasonId} className="text-sm font-medium">
					Motivo de la resolución
				</label>
				<textarea
					id={reasonId}
					value={reason}
					onChange={(event) => setReason(event.target.value)}
					placeholder="Obligatorio para registrar la decisión"
					rows={2}
					className="w-full resize-none rounded-lg border border-input bg-background p-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
				/>
			</div>

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					disabled={disabled}
					onClick={() => resolve("RUNNING")}
					className={`${actionClass} bg-brand text-brand-foreground hover:bg-brand/90`}
				>
					<Play aria-hidden="true" className="size-4" />
					Reanudar
				</button>
				<button
					type="button"
					disabled={disabled}
					onClick={() => resolve("COMPLETED")}
					className={`${actionClass} border border-border hover:bg-muted`}
				>
					<CircleCheck aria-hidden="true" className="size-4 text-success" />
					Marcar como completada
				</button>
				<button
					type="button"
					disabled={disabled}
					onClick={() => resolve("FAILED")}
					className={`${actionClass} border border-destructive/40 text-destructive hover:bg-destructive/10`}
				>
					<CircleX aria-hidden="true" className="size-4" />
					Marcar como fallida
				</button>
			</div>
		</section>
	);
}
