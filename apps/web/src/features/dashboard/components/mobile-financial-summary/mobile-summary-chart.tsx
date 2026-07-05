import { MOBILE_SUMMARY_Y_AXIS_LABELS } from "./mobile-summary.constants";

export function MobileSummaryChart() {
	return (
		<div className="relative mt-4 px-6 py-4">
			<div className="mb-8 flex items-center justify-between">
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-2">
						<div className="h-1.5 w-1.5 rounded-full bg-[#5A534D]" />
						<span className="text-2xs font-semibold uppercase tracking-[0.08em] text-[var(--premium-text-secondary)]">
							Proyectado
						</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="h-1.5 w-1.5 rounded-full bg-[#F7F1E8] shadow-[0_0_10px_rgba(255,255,255,0.42)]" />
						<span className="text-2xs font-semibold uppercase tracking-[0.08em] text-[var(--premium-text-primary)]">
							Flujo Real
						</span>
					</div>
				</div>
				<div className="ui-card-surface rounded-lg px-3 py-1">
					<span className="text-2xs font-semibold uppercase tracking-[0.08em] text-[var(--premium-text-secondary)]">
						Live
					</span>
				</div>
			</div>

			<div className="relative h-48 w-full">
				<div className="absolute bottom-0 left-0 top-0 flex flex-col justify-between py-2 text-[8px] font-semibold text-[var(--premium-text-secondary)]">
					{MOBILE_SUMMARY_Y_AXIS_LABELS.map((label) => (
						<span key={label}>{label}</span>
					))}
				</div>

				<svg
					className="absolute inset-0 h-full w-full pl-12"
					viewBox="0 0 100 100"
					preserveAspectRatio="none"
				>
					<defs>
						<filter
							id="premium-line-glow"
							x="-20%"
							y="-20%"
							width="140%"
							height="140%"
						>
							<feDropShadow
								dx="0"
								dy="0"
								stdDeviation="1.8"
								floodColor="rgba(185,122,69,0.35)"
								floodOpacity="0.35"
							/>
						</filter>
					</defs>

					<path
						d="M0,80 C14,74 22,70 34,68 C46,66 56,61 68,58 C78,55 88,52 100,48"
						fill="none"
						stroke="#5A534D"
						strokeWidth="1.5"
						strokeDasharray="4 4"
						strokeLinecap="round"
					/>
					<path
						d="M0,76 C12,70 18,64 30,67 C42,71 50,82 62,56 C72,38 80,30 90,36 C95,39 98,45 100,50"
						fill="none"
						stroke="#F7F1E8"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						filter="url(#premium-line-glow)"
					/>
					<circle cx="100" cy="50" r="1.8" fill="#F7F1E8" />
				</svg>
			</div>
		</div>
	);
}
