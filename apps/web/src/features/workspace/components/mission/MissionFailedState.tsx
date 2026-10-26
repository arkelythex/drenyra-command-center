import { Plus, RotateCcw, TriangleAlert } from "lucide-react";

const CONNECTION_ERROR =
	/could not proxy|unavailable|failed to fetch|network|econnrefused|\b50[234]\b/i;

/** Maps a raw mission error to copy a person can act on; the raw text stays available as details. */
export function describeMissionError(error: string | null | undefined) {
	if (error && CONNECTION_ERROR.test(error)) {
		return {
			description:
				"No pudimos conectar con el servidor de Drenyra. Revisa tu conexión y vuelve a intentarlo; tus datos no se modificaron.",
		};
	}
	return {
		description:
			"Ocurrió un error inesperado al ejecutar la misión. Puedes reintentarla o empezar una nueva.",
	};
}

interface MissionFailedStateProps {
	error: string | null | undefined;
	onRetry: () => void;
	/** Omitted when the caller cannot start a fresh mission; the action is then hidden. */
	onReset?: (() => void) | undefined;
}

export function MissionFailedState({
	error,
	onRetry,
	onReset,
}: MissionFailedStateProps) {
	const { description } = describeMissionError(error);

	return (
		<section
			aria-labelledby="mission-failed-title"
			className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-6 text-card-foreground"
		>
			<div className="space-y-2">
				<TriangleAlert aria-hidden="true" className="size-6 text-destructive" />
				<h2
					id="mission-failed-title"
					className="text-lg font-medium tracking-tight"
				>
					La misión no pudo completarse
				</h2>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>
			</div>

			<div className="flex flex-col gap-2 sm:flex-row">
				<button
					type="button"
					onClick={onRetry}
					className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
				>
					<RotateCcw aria-hidden="true" className="size-4" />
					Reintentar
				</button>
				{onReset && (
					<button
						type="button"
						onClick={onReset}
						className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
					>
						<Plus aria-hidden="true" className="size-4" />
						Nueva misión
					</button>
				)}
			</div>

			{error && (
				<details className="group text-sm">
					<summary className="flex min-h-11 cursor-pointer items-center text-muted-foreground hover:text-foreground">
						Detalles técnicos
					</summary>
					<p className="mt-2 break-words rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
						{error}
					</p>
				</details>
			)}
		</section>
	);
}
