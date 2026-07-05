/**
 * ErrorState
 *
 * Error display with icon, message, and optional retry button.
 * Used by DrenyraCommandCenter and other feature components.
 */
import { AlertCircle } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
	message?: string;
	actionLabel?: string;
	onAction?: () => void;
}

const DEFAULT_MESSAGE = "Ocurrió un error inesperado.";

/**
 * ErrorState — error display with contextual action button.
 *
 * La acción no siempre es "Reintentar". Para errores de validación
 * (ej: periodo no seleccionado), la acción correcta puede ser
 * "Seleccionar periodo". Usá `actionLabel` + `onAction` en vez de
 * `onRetry` para errores no recuperables automáticamente.
 */
export function ErrorState({
	message = DEFAULT_MESSAGE,
	actionLabel,
	onAction,
}: ErrorStateProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--color-danger-border)]/20 bg-[var(--color-danger-bg)]/10 p-6 text-center">
			<AlertCircle size={24} className="text-[var(--color-danger-text)]" />
			<p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
			{onAction && (
				<Button variant="secondary" size="sm" onClick={onAction}>
					{actionLabel ?? "Reintentar"}
				</Button>
			)}
		</div>
	);
}
