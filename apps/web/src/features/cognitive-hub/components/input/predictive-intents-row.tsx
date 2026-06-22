import type { JSX } from "react";
import { cn } from "@/lib/utils";
import { QUICK_COMMANDS, type QuickCommand } from "./quick-commands";

interface PredictiveIntentsRowProps {
	isVisible: boolean;
	onSend: (command: string) => void;
}

export const PredictiveIntentsRow = ({
	isVisible,
	onSend,
}: PredictiveIntentsRowProps): JSX.Element | null => {
	if (!isVisible) return null;

	return (
		<div className="mt-6 flex gap-3 overflow-x-auto no-scrollbar sm:flex-wrap sm:justify-center">
			{QUICK_COMMANDS.map((hint: QuickCommand) => (
				<button
					key={hint.label}
					type="button"
					onClick={() => onSend(hint.command)}
					className={cn(
						"shrink-0 whitespace-nowrap rounded-lg border px-5 py-2.5 text-label font-semibold uppercase tracking-[0.08em] shadow-sm transition-all active:scale-95",
						hint.emphasis === "high"
							? "border-[rgba(var(--premium-info-rgb),0.25)] bg-foreground text-background hover:bg-foreground/92"
							: "border-border/60 bg-card text-foreground hover:border-border hover:bg-muted/60",
					)}
				>
					<span className="inline-flex items-center gap-2.5">
						<hint.icon size={14} strokeWidth={2.5} />
						{hint.label}
					</span>
				</button>
			))}
		</div>
	);
};
