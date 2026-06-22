"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Card } from "@arkelythex/ui";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { V2_LANDING_COPY } from "@/lib/constants/copy";
import { LANDING_STICKY_ALIGNED_SHELL_CLASS } from "@/lib/landing/sticky-cta-layout";
import { LANDING_BODY_MUTED_CLASS } from "@/lib/landing/ui-classes";
import { useAnalytics } from "@/lib/use-analytics";
import { cn } from "@/lib/utils";

type LandingClosingProps = {
	/** Home corporativa: cierre editorial sin funnels de demo o sesión comercial. */
	readonly brandPresentation?: boolean;
};

function BrandClosing(): ReactElement {
	return (
		<section className="border-t landing-border py-24 md:py-32">
			<div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-10">
				<p className="landing-eyebrow">Arkelythex</p>
				<h2 className="mt-8 max-w-2xl text-balance text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground">
					Diseñado en Perú para operaciones fiscales exigentes.
				</h2>
				<nav
					className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3"
					aria-label="Enlaces de cierre"
				>
					<Link
						href="/drenyra"
						className="landing-text-link group inline-flex items-center gap-2 text-sm font-medium text-foreground"
					>
						<span>Drenyra</span>
						<ArrowRight
							className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
							aria-hidden
						/>
					</Link>
					<Link
						href="/api"
						className="landing-text-link inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
					>
						<span>API Docs</span>
						<ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
					</Link>
				</nav>
			</div>
		</section>
	);
}

function ConversionClosing(): ReactElement {
	const { finalCta } = V2_LANDING_COPY;
	const { trackSireFunnelClick } = useAnalytics();

	return (
		<section className="relative overflow-hidden py-24 md:py-32 lg:py-40">
			<div
				className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-overlay"
				aria-hidden
			/>

			<div
				className={cn("relative z-10", LANDING_STICKY_ALIGNED_SHELL_CLASS)}
			>
				<ScrollReveal direction="scale">
					<div className="relative grid gap-10 overflow-hidden rounded-2xl border border-border/30 bg-surface p-8 shadow-xl shadow-[rgba(14,10,8,0.50)] md:p-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:p-14">
						<div
							className="pointer-events-none absolute left-1/2 top-0 h-[200px] w-[600px] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-glass"
							aria-hidden
						/>
						<div className="relative z-10 space-y-8">
							<div className="mx-auto max-w-3xl space-y-5 text-center">
								<div className="flex justify-center">
									<span className="text-sm font-medium uppercase tracking-wider text-section-label">
										Siguiente paso
									</span>
								</div>
								<h2 className="text-balance font-sans text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
									{finalCta.headlineLead}{" "}
									<span className="font-semibold text-gradient-accent">
										{finalCta.headlineAccent}
									</span>
								</h2>
								<p className={`text-base ${LANDING_BODY_MUTED_CLASS}`}>
									{finalCta.proofNote}
								</p>
							</div>

							<div className="flex flex-wrap items-center justify-center gap-3">
								{finalCta.proofChips.map((item) => (
									<span
										key={item}
										className="rounded-full border landing-border landing-surface px-4 py-2 text-label font-bold uppercase tracking-[0.18em] text-muted-foreground"
									>
										{item}
									</span>
								))}
							</div>

							<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
								<Link
									href={finalCta.ctaPrimaryHref}
									onClick={() => trackSireFunnelClick("closing_primary")}
									className="btn-primary group flex h-14 min-w-[220px] items-center justify-center gap-2 px-8 text-base font-semibold transition-all duration-[250ms] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,255,255,0.25),0_12px_32px_-10px_rgba(0,0,0,0.55)]"
								>
									{finalCta.ctaPrimary}
								</Link>
								<Link
									href={finalCta.ctaSecondaryHref}
									className="px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
								>
									{finalCta.ctaSecondary}
								</Link>
							</div>
						</div>

						<div className="relative z-10 space-y-4">
							<Card className="border border-primary/20 bg-surface/90 p-6 shadow-lg shadow-[rgba(14,10,8,0.30)]">
								<p className="siguiente-paso-kicker">
									{finalCta.sessionTitle}
								</p>
								<ul className="mt-4 space-y-3">
									{finalCta.sessionItems.map((item) => (
										<li
											key={item}
											className={`flex gap-3 text-sm ${LANDING_BODY_MUTED_CLASS}`}
										>
											<span
												className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
												aria-hidden
											/>
											<span>{item}</span>
										</li>
									))}
								</ul>
							</Card>

							{finalCta.highlights.map((item, index) => (
								<Card
									key={item.title}
									className="border border-border/40 bg-surface/90 p-6"
								>
									<div className="flex items-start gap-4">
										<span
											className="siguiente-paso-badge tabular-nums"
											aria-hidden
										>
											0{index + 1}
										</span>
										<div className="min-w-0">
											<p className="text-sm font-black tracking-tight text-foreground">
												{item.title}
											</p>
											<p className={`mt-2 text-sm ${LANDING_BODY_MUTED_CLASS}`}>
												{item.detail}
											</p>
										</div>
									</div>
								</Card>
							))}
						</div>
					</div>
				</ScrollReveal>
			</div>
		</section>
	);
}

export function LandingClosing({
	brandPresentation = false,
}: LandingClosingProps): ReactElement {
	return (
		<>
			{brandPresentation ? <BrandClosing /> : <ConversionClosing />}
			<Footer
				stickyAligned={!brandPresentation}
				showConversionBanner={!brandPresentation}
			/>
		</>
	);
}
