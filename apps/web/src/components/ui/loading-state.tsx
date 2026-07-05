import { Loader2 } from "lucide-react";

interface LoadingStateProps {
	message?: string;
	size?: "sm" | "md" | "lg";
}

const LOADING_SIZES = {
	sm: { icon: 16, spacing: "gap-2 p-4" },
	md: { icon: 24, spacing: "gap-3 p-6" },
	lg: { icon: 32, spacing: "gap-4 p-8" },
} as const;

export function LoadingState({
	message = "Cargando...",
	size = "md",
}: LoadingStateProps) {
	const s = LOADING_SIZES[size];
	return (
		<div
			className={`flex flex-col items-center justify-center ${s.spacing} text-center`}
		>
			<Loader2
				size={s.icon}
				className="animate-spin text-[var(--color-accent-cyan)]"
			/>
			<p className="text-sm text-[var(--color-text-tertiary)]">{message}</p>
		</div>
	);
}
