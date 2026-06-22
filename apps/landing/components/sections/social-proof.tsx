"use client";

import type { ReactElement } from "react";
import {
	Shield,
	FileCheck,
	RefreshCw,
	TrendingDown,
	Zap,
	CheckCircle,
	Lock,
	Server,
} from "lucide-react";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { BRAND_HOME_COPY } from "@/lib/landing/copy/brand-home";
import { LANDING_EYEBROW_CLASS } from "@/lib/landing/ui-classes";

const PROOF_ICONS = {
  shield: Shield,
  "file-check": FileCheck,
  "refresh-cw": RefreshCw,
} as const;

const METRIC_ICONS = {
	"trending-down": TrendingDown,
	zap: Zap,
	"check-circle": CheckCircle,
} as const;

const SIGNAL_ICONS = {
	shield: Shield,
	lock: Lock,
	server: Server,
} as const;

function MetricCard({
	value,
	label,
	iconKey,
	index,
}: {
	value: string;
	label: string;
	iconKey: keyof typeof METRIC_ICONS;
	index: number;
}): ReactElement {
	const Icon = METRIC_ICONS[iconKey];

	// Parse numeric value for AnimatedCounter
	const numericMatch = value.match(/([\d.]+)/);
	const target = numericMatch ? parseFloat(numericMatch[1]) : 0;
	const prefix = value.startsWith("S/") ? "S/ " : "";
	const suffix = value.replace(/[\d.]+/, "").trim();
	const decimals = value.includes(".") ? 1 : 0;

	const isValid = target > 0 || value !== "0";

	return (
		<ScrollReveal delay={index * 0.08} direction="up">
			<div className="group flex flex-col items-center text-center">
				<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-foreground/[0.06] transition-all group-hover:-translate-y-0.5 group-hover:bg-foreground/[0.09]">
					<Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
				</div>
				{isValid ? (
					<AnimatedCounter
						target={target}
						prefix={prefix}
						suffix={suffix}
						decimals={decimals}
						label={label}
						className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-[-0.04em] text-foreground"
					/>
				) : (
					<span className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-[-0.04em] text-foreground">
						--
					</span>
				)}
				<span className="mt-1 text-xs text-section-label">{label}</span>
			</div>
		</ScrollReveal>
	);
}

export function SocialProof(): ReactElement {
	const { socialProof } = BRAND_HOME_COPY;

	return (
		<section
			id="por-que-arkelythex"
			className="scroll-mt-28 py-32 md:py-40"
			aria-label="Por qué Arkelythex"
		>
			<div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-10">
				{/* Header */}
			<ScrollReveal>
					<div className="mb-16">
						<p className={`${LANDING_EYEBROW_CLASS} mb-4`}>{socialProof.eyebrow}</p>
						<h2 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.1] tracking-tight text-foreground text-balance">
							{socialProof.tagline}
						</h2>
					</div>
				</ScrollReveal>

				{/* Impact Metrics — clean row */}
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:gap-8">
					{socialProof.metrics.map((metric, index) => (
						<MetricCard
							key={metric.label}
							value={metric.value}
							label={metric.label}
							iconKey={metric.icon}
							index={index}
						/>
					))}
				</div>

				{/* Signals + Feature Trust — unified compact grid */}
				<div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{socialProof.signals.map((signal, index) => {
						const Icon = SIGNAL_ICONS[signal.icon];
						return (
							<ScrollReveal key={signal.title} delay={index * 0.06} direction="up">
								<div className="flex items-start gap-4 rounded-lg border border-white/[0.06] bg-white/[0.01] p-5 transition-all hover:-translate-y-0.5 hover:bg-white/[0.02] oled-spotlight-border">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.04]">
										<Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
									</div>
									<div>
										<h3 className="text-sm font-semibold text-foreground">{signal.title}</h3>
										<p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{signal.description}</p>
									</div>
								</div>
							</ScrollReveal>
						);
					})}
					{socialProof.items.map((item, index) => {
						const Icon = PROOF_ICONS[item.icon];
						return (
							<ScrollReveal key={item.title} delay={(socialProof.signals.length + index) * 0.06} direction="up">
								<div className="flex items-start gap-4 rounded-lg border border-white/[0.06] bg-white/[0.01] p-5 transition-all hover:-translate-y-0.5 hover:bg-white/[0.02] oled-spotlight-border">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.04]">
										<Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
									</div>
									<div>
										<h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
										<p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
									</div>
								</div>
							</ScrollReveal>
						);
					})}
				</div>
			</div>
		</section>
	);
}
