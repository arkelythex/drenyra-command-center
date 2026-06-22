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
	onRetry?: () => void;
}

const DEFAULT_MESSAGE = "Ocurrió un error al cargar los datos.";

export function ErrorState({
	message = DEFAULT_MESSAGE,
	onRetry,
}: ErrorStateProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--color-danger-border)]/20 bg-[var(--color-danger-bg)]/10 p-6 text-center">
			<AlertCircle
				size={24}
				className="text-[var(--color-danger-text)]"
			/>
			<p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
			{onRetry && (
				<Button
					variant="secondary"
					size="sm"
					onClick={onRetry}
				>
					Reintentar
				</Button>
			)}
		</div>
	);
}
