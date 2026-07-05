import { cn } from "@/lib/utils";

interface MobileSummaryTimelineScoreProps {
	months: string[];
	scoreValue: number;
	scoreMax: number;
	scoreLabel: string;
}

export function MobileSummaryTimelineScore({
	months,
	scoreValue,
	scoreMax,
	scoreLabel,
}: MobileSummaryTimelineScoreProps) {
	const progress = Math.min(Math.max(scoreValue / scoreMax, 0), 1);
	const circumference = 2 * Math.PI * 78;

	return (
		<div className="space-y-12 px-6 py-10 pb-32">
			<div className="ui-card-surface-strong flex items-center justify-between rounded-[1.6rem] p-3">
				{months.map((month, index) => (
					<div
						key={`${month}-${index}`}
						className={cn(
							"flex h-8 w-8 items-center justify-center rounded-xl text-2xs font-semibold uppercase tracking-[0.08em] transition-all",
							index === 11
								? "ui-segmented-control-active"
								: "text-[var(--premium-text-secondary)] hover:text-[var(--premium-text-primary)]",
						)}
					>
						{month}
					</div>
				))}
			</div>

			<div className="flex flex-col items-center">
				<div className="relative flex h-48 w-48 items-center justify-center">
					<div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(var(--premium-info-rgb),0.18),rgba(2,4,6,0)_66%)]" />
					<svg
						className="h-48 w-48 -rotate-90"
						viewBox="0 0 192 192"
						aria-hidden="true"
					>
						<defs>
							<linearGradient
								id="premium-score-gradient"
								x1="0%"
								y1="0%"
								x2="100%"
								y2="0%"
							>
								<stop offset="0%" stopColor="#DCCDBE" />
								<stop offset="38%" stopColor="#B97A45" />
								<stop offset="100%" stopColor="#E7C97A" />
							</linearGradient>
						</defs>

						<circle
							cx="96"
							cy="96"
							r="78"
							fill="none"
							stroke="#0E0A08"
							strokeWidth="12"
						/>
						<circle
							cx="96"
							cy="96"
							r="78"
							fill="none"
							stroke="url(#premium-score-gradient)"
							strokeWidth="12"
							strokeLinecap="round"
							strokeDasharray={circumference}
							strokeDashoffset={circumference * (1 - progress)}
							style={{
								filter:
									"drop-shadow(0 0 12px rgba(var(--premium-info-rgb),0.42))",
								transition:
									"stroke-dashoffset 650ms cubic-bezier(0.16, 1, 0.3, 1)",
							}}
						/>
					</svg>

					<div className="absolute inset-[34px] rounded-full bg-[#0E0A08] shadow-[inset_0_3px_12px_rgba(255,255,255,0.08),inset_0_-14px_20px_rgba(0,0,0,0.58)]" />
					<div className="relative flex flex-col items-center">
						<span className="text-6xl font-semibold tracking-[-0.02em] text-[var(--premium-text-primary)]">
							{scoreValue}
						</span>
						<div className="ui-card-surface mt-2 rounded-full px-4 py-1">
							<span className="text-2xs font-semibold uppercase tracking-[0.08em] text-[var(--premium-action-cyan)]">
								{scoreLabel}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
