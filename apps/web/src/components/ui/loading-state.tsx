/**
 * LoadingState
 *
 * Loading state centered with spinner and optional message.
 * Used by DrenyraCommandCenter and other feature components.
 */
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
	message?: string;
}

const DEFAULT_MESSAGE = "Cargando...";

export function LoadingState({ message = DEFAULT_MESSAGE }: LoadingStateProps) {
	return (
		<div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3">
			<Loader2
				size={24}
				className="animate-spin text-[var(--color-text-secondary)]"
			/>
			<p className="text-sm text-[var(--color-text-muted)]">{message}</p>
		</div>
	);
}
