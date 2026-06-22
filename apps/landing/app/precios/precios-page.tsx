"use client";

import { ArrowRight, Check, ChevronDown, Sparkles, X } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { MouseGlow } from "@/components/ui/mouse-glow";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PRECIOS_COPY } from "@/lib/landing/copy/v2/precios";
import { useAnalytics } from "@/lib/use-analytics";
import { cn } from "@/lib/utils";

interface FaqItemProps {
	question: string;
	answer: string;
	isOpen: boolean;
	onToggle: () => void;
}

function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
	return (
		<div className="rounded-xl border border-white/[0.06] overflow-hidden">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-white/[0.02]"
				aria-expanded={isOpen}
			>
				<span className="font-medium text-foreground">{question}</span>
				<ChevronDown
					className={cn(
						"h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200",
						isOpen && "rotate-180",
					)}
					aria-hidden
				/>
			</button>
			{isOpen && (
				<div className="px-6 pb-4 pt-0">
					<p className="text-sm text-muted-foreground leading-relaxed">
						{answer}
					</p>
				</div>
			)}
		</div>
	);
}

export function PreciosPage(): ReactElement {
	const { hero, plans, comparison, faq, enterpriseCTA, toggle, disclaimer } =
		PRECIOS_COPY;
	const [isAnnual, setIsAnnual] = useState(false);
	const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
	const { trackPricingView, trackPricingClick } = useAnalytics();

	useEffect(() => {
		trackPricingView("all");
	}, [trackPricingView]);

	return (
		<>
			{/* ── Hero ─────────────────────────────────────────── */}
			<section className="relative overflow-hidden px-6 py-28 md:py-40">
				<div
					className="pointer-events-none absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage:
							"radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)",
						backgroundSize: "40px 40px",
					}}
					aria-hidden
				/>
				<div
					className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background"
					aria-hidden
				/>
				<MouseGlow
					className="z-[2]"
					opacity={0.04}
					size={700}
					blurRadius={160}
				/>
				<div className="relative z-10 mx-auto max-w-3xl text-center">
					<ScrollReveal>
						<span className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 text-xs font-medium text-white/60">
							<Sparkles className="h-3.5 w-3.5" aria-hidden />
							{hero.tagline}
						</span>
					</ScrollReveal>
					<ScrollReveal delay={0.1}>
						<h1 className="mt-6 text-balance text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.1] tracking-tight">
							{hero.headline}{" "}
							<span className="text-foreground/80">
								{hero.headlineEmphasis}
							</span>
						</h1>
					</ScrollReveal>
					<ScrollReveal delay={0.15}>
						<p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
							{hero.subhead}
						</p>
					</ScrollReveal>
					<ScrollReveal delay={0.2}>
						<div className="mt-6 flex flex-wrap justify-center gap-4">
							<Link
								href={hero.ctaPrimaryHref}
								className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
							>
								{hero.ctaPrimary} <ArrowRight className="h-4 w-4" aria-hidden />
							</Link>
							<Link
								href={hero.ctaSecondaryHref}
								className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
							>
								{hero.ctaSecondary}
							</Link>
						</div>
					</ScrollReveal>
					<ScrollReveal delay={0.25}>
						<div className="mt-8 inline-flex rounded-full border border-white/[0.06] bg-white/[0.02] p-1">
							<button
								type="button"
								onClick={() => setIsAnnual(false)}
								className={cn(
									"rounded-full px-5 py-2 text-sm font-medium transition-all",
									!isAnnual
										? "bg-primary text-primary-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{toggle.monthly}
							</button>
							<button
								type="button"
								onClick={() => setIsAnnual(true)}
								className={cn(
									"rounded-full px-5 py-2 text-sm font-medium transition-all",
									isAnnual
										? "bg-primary text-primary-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{toggle.annual}
							</button>
						</div>
						{isAnnual && (
							<p className="mt-2 text-xs font-medium text-muted-foreground">
								{toggle.saveLabel}
							</p>
						)}
					</ScrollReveal>
				</div>
			</section>

			{/* ── Plans ────────────────────────────────────────── */}
			<section
				className="border-t landing-border py-24 md:py-32"
				aria-labelledby="plans-heading"
			>
				<div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
					<ScrollReveal>
						<h2 id="plans-heading" className="landing-eyebrow text-center">
							Planes
						</h2>
					</ScrollReveal>
					<div className="mt-12 grid gap-6 lg:grid-cols-3">
						{plans.map((plan) => {
							const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
							return (
								<ScrollReveal key={plan.name}>
									<div
										className={cn(
											"relative flex flex-col rounded-2xl border p-6 lg:p-8 h-full transition-all duration-200",
											plan.popular
												? "border-foreground/20 bg-white/[0.02] shadow-sm"
												: "border-white/[0.06] bg-transparent hover:border-white/[0.08]",
										)}
									>
										{plan.popular && (
											<div className="absolute -top-3 left-1/2 -translate-x-1/2">
												<span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
													<Sparkles className="h-3 w-3" /> Más popular
												</span>
											</div>
										)}
										<h3 className="text-xl font-bold text-foreground">
											{plan.name}
										</h3>
										<p className="mt-2 text-sm text-muted-foreground">
											{plan.description}
										</p>
										<div className="mt-6">
											<span className="text-4xl font-bold text-foreground">
												{price}
											</span>
											<span className="text-sm text-muted-foreground">
												/{isAnnual ? "año" : "mes"}
											</span>
										</div>
										<ul className="mt-8 flex-1 space-y-3">
											{plan.features.map((feature) => (
												<li
													key={feature}
													className="flex items-start gap-3 text-sm"
												>
													<Check
														className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
														aria-hidden
													/>
													<span className="text-foreground/70">{feature}</span>
												</li>
											))}
										</ul>
										<Link
											href={plan.href}
											onClick={() => trackPricingClick(plan.name, "plan-card")}
											className={cn(
												"mt-8 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors",
												plan.popular
													? "bg-primary text-primary-foreground hover:bg-primary/90"
													: "border border-white/[0.06] text-foreground hover:bg-white/[0.02]",
											)}
										>
											{plan.cta}
										</Link>
									</div>
								</ScrollReveal>
							);
						})}
					</div>
				</div>
			</section>

			{/* ── Comparison ───────────────────────────────────── */}
			<section
				className="border-t landing-border py-24 md:py-32"
				aria-labelledby="comparison-heading"
			>
				<div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
					<ScrollReveal>
						<p className="landing-eyebrow text-center">{comparison.tagline}</p>
					</ScrollReveal>
					<ScrollReveal delay={0.1}>
						<h2
							id="comparison-heading"
							className="mt-4 text-center text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight text-foreground"
						>
							{comparison.headline}
						</h2>
					</ScrollReveal>
					<div className="mt-10 overflow-x-auto">
						<table className="w-full min-w-[640px]">
							<thead>
								<tr className="border-b border-white/[0.06]">
									<th className="py-4 px-4 text-left text-sm font-medium text-muted-foreground">
										Característica
									</th>
									{comparison.headers.slice(1).map((header) => (
										<th
											key={header}
											className="py-4 px-4 text-center text-sm font-medium text-foreground"
										>
											{header}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{comparison.rows.map((row, i) => (
									<tr
										key={row.feature}
										className={cn(
											"border-b border-white/[0.03]",
											i % 2 === 0 && "bg-white/[0.01]",
										)}
									>
										<td className="py-4 px-4 text-sm font-medium text-foreground/70">
											{row.feature}
										</td>
										{comparison.headers.slice(1).map((header) => {
											const key = header.toLowerCase();
											const value = row[key as keyof typeof row];
											if (typeof value === "boolean") {
												return (
													<td key={key} className="py-4 px-4 text-center">
														{value ? (
															<Check className="h-5 w-5 text-muted-foreground mx-auto" />
														) : (
															<X className="h-5 w-5 text-white/[0.08] mx-auto" />
														)}
													</td>
												);
											}
											return (
												<td
													key={key}
													className="py-4 px-4 text-center text-sm text-foreground/70"
												>
													{value}
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* ── FAQ ──────────────────────────────────────────── */}
			<section
				className="border-t landing-border py-24 md:py-32"
				aria-labelledby="faq-heading"
			>
				<div className="mx-auto max-w-2xl px-6 sm:px-8 lg:px-10">
					<ScrollReveal>
						<p className="landing-eyebrow text-center">{faq.tagline}</p>
					</ScrollReveal>
					<ScrollReveal delay={0.1}>
						<h2
							id="faq-heading"
							className="mt-4 text-center text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight text-foreground"
						>
							Preguntas frecuentes
						</h2>
					</ScrollReveal>
					<div className="mt-10 space-y-3">
						{faq.items.map((item, i) => (
							<ScrollReveal key={item.question} delay={i * 0.06}>
								<FaqItem
									question={item.question}
									answer={item.answer}
									isOpen={openFaqIndex === i}
									onToggle={() =>
										setOpenFaqIndex(openFaqIndex === i ? null : i)
									}
								/>
							</ScrollReveal>
						))}
					</div>
				</div>
			</section>

			{/* ── Enterprise CTA ───────────────────────────────── */}
			<section className="border-t landing-border py-24 md:py-32">
				<div className="mx-auto max-w-xl px-6 text-center">
					<ScrollReveal>
						<p className="font-semibold text-primary">
							{enterpriseCTA.headline}
						</p>
					</ScrollReveal>
					<ScrollReveal delay={0.1}>
						<h2 className="mt-4 text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight text-foreground">
							¿Necesitas una solución personalizada?
						</h2>
					</ScrollReveal>
					<ScrollReveal delay={0.15}>
						<p className="mt-4 text-base leading-relaxed text-muted-foreground">
							{enterpriseCTA.description}
						</p>
					</ScrollReveal>
					<ScrollReveal delay={0.2}>
						<Link
							href={enterpriseCTA.href}
							className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
						>
							{enterpriseCTA.cta} <ArrowRight className="h-4 w-4" aria-hidden />
						</Link>
					</ScrollReveal>
				</div>
			</section>

			{/* ── Disclaimer ───────────────────────────────────── */}
			<section className="border-t landing-border py-12">
				<div className="mx-auto max-w-xl px-6 text-center">
					<p className="text-xs text-muted-foreground/60">{disclaimer.text}</p>
				</div>
			</section>
		</>
	);
}
