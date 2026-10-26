import type { MissionStep } from "@drenyra/mission-domain";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionProgressProps {
	/** Basis points: 0..10000. */
	progress: number;
	steps: MissionStep[];
	currentStep: string;
}

const STEP_ICON = {
	COMPLETED: { icon: CircleCheck, className: "text-success" },
	IN_PROGRESS: {
		icon: Loader2,
		className: "animate-spin text-brand motion-reduce:animate-none",
	},
	FAILED: { icon: CircleAlert, className: "text-destructive" },
} as const;

export function MissionProgress({
	progress,
	steps,
	currentStep,
}: MissionProgressProps) {
	const percent = Math.round(progress / 100);

	return (
		<div className="w-full max-w-2xl space-y-4">
			<div
				role="progressbar"
				aria-label="Avance de la misión"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percent}
				className="h-1.5 overflow-hidden rounded-full bg-muted"
			>
				<div
					className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none"
					style={{ width: `${percent}%` }}
				/>
			</div>

			{steps.length > 0 ? (
				<ol
					aria-label="Pasos de la misión"
					className="divide-y divide-border rounded-xl border border-border bg-card"
				>
					{steps.map((step) => {
						const status = STEP_ICON[step.status as keyof typeof STEP_ICON];
						const Icon = status?.icon;
						return (
							<li
								key={step.id}
								aria-current={step.id === currentStep ? "step" : undefined}
								className="flex items-center gap-3 px-4 py-3"
							>
								{Icon ? (
									<Icon
										aria-hidden="true"
										className={cn("size-4 shrink-0", status.className)}
									/>
								) : (
									<span
										aria-hidden="true"
										className="size-4 shrink-0 rounded-full border-2 border-border"
									/>
								)}
								<span
									className={cn(
										"text-sm",
										step.id === currentStep
											? "font-medium"
											: "text-muted-foreground",
									)}
								>
									{step.name}
								</span>
							</li>
						);
					})}
				</ol>
			) : null}
		</div>
	);
}
