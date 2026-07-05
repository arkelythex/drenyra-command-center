import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { STREAMING_STEPS } from "../ChatContextPanel.data";

export function StreamingStatus() {
	return (
		<div className="animate-in fade-in duration-500">
			<div className="space-y-3">
				<div className="flex items-center gap-2 text-xs font-bold text-[var(--color-success)]">
					<Loader2 size={14} className="animate-spin" aria-hidden="true" />
					Agente trabajando
				</div>
				<div className="space-y-2">
					{STREAMING_STEPS.map((step, i) => (
						<div
							key={i}
							className={cn(
								"flex items-center gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2",
								i === 0 ? "opacity-100" : "opacity-50",
							)}
						>
							<Loader2
								size={12}
								aria-hidden="true"
								className={cn(
									"animate-spin",
									i === 0
										? "text-[var(--color-success)]"
										: "text-[var(--text-tertiary)]",
								)}
							/>
							<span className="text-2xs text-[var(--text-secondary)]">
								{step}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
