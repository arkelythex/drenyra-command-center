import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";

interface SettingsFooterActionsProps {
	isSaving: boolean;
	error: Error | null;
}

/** Auto-save status: every change is persisted immediately, so there is nothing to "Save". */
export function SettingsFooterActions({
	isSaving,
	error,
}: SettingsFooterActionsProps) {
	return (
		<p
			role="status"
			aria-live="polite"
			className="flex items-center gap-2 text-sm text-muted-foreground"
		>
			{isSaving ? (
				<>
					<Loader2
						aria-hidden="true"
						className="size-4 animate-spin motion-reduce:animate-none"
					/>
					Guardando cambios…
				</>
			) : error ? (
				<span className="flex items-center gap-2 text-destructive">
					<CircleAlert aria-hidden="true" className="size-4" />
					No se pudo guardar el último cambio. Revisa tu conexión e inténtalo de
					nuevo.
				</span>
			) : (
				<>
					<CircleCheck aria-hidden="true" className="size-4" />
					Los cambios se guardan automáticamente.
				</>
			)}
		</p>
	);
}
