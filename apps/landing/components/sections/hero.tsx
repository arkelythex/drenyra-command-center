"use client";

import type { ReactElement } from "react";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

import { ArkelythexMark } from "@/components/brand/arkelythex-mark";
import { BrandSurfaceScene } from "@/components/landing/brand/brand-surface-scene";
import { HeroScrollCue } from "@/components/landing/hero-scroll-cue";
import {
	HeroRevealText,
	HeroStaggerContainer,
	HeroStaggerItem,
	HeroEyebrowReveal,
} from "@/components/ui/hero-reveal";
import { MouseGlow } from "@/components/ui/mouse-glow";
import { BRAND_HOME_COPY } from "@/lib/landing/copy/brand-home";
import {
	LANDING_EYEBROW_CLASS,
	LANDING_LINK_CLASS,
} from "@/lib/landing/ui-classes";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useAnalytics } from "@/lib/use-analytics";

export function LandingHero(): ReactElement {
	const { hero } = BRAND_HOME_COPY;
	const { trackSireFunnelClick } = useAnalytics();
	const reduceMotion = useReducedMotion();
	const sectionRef = useRef<HTMLElement>(null);

	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start start", "end start"],
	});

	const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
	const bgOpacity = useTransform(scrollYProgress, [0, 0.6], [0.3, 0]);
	const contentY = useTransform(scrollYProgress, [0, 0.4], [0, 20]);

	return (
		<section
			ref={sectionRef}
			id="producto"
			className="landing-hero relative min-h-[100svh] overflow-hidden"
			aria-label="Arkelythex: propuesta de valor"
		>
			<motion.div
				className="absolute inset-0 min-h-[58vh] md:min-h-[65vh]"
				style={{
					scale: reduceMotion ? 1 : bgScale,
					opacity: reduceMotion ? undefined : bgOpacity,
				}}
			>
				<BrandSurfaceScene kind="hero" className="h-full min-h-full" priority />
			</motion.div>

			<div
				className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/20 via-background/50 to-background"
				aria-hidden
			/>

			<MouseGlow className="z-[2]" opacity={0.06} size={800} blurRadius={160} />

			{/* Warm ambient radial gradient behind hero text */}
			<div
				className="pointer-events-none absolute inset-0 z-[3]"
				aria-hidden
				style={{
					background:
						"radial-gradient(ellipse 60% 50% at 30% 70%, rgba(250, 250, 248, 0.03) 0%, transparent 70%)",
				}}
			/>

			<motion.div
				className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-end px-6 pb-24 pt-32 sm:px-8 md:min-h-[100svh] md:pb-28 md:pt-40 lg:px-10"
				style={{ y: reduceMotion ? 0 : contentY }}
			>
				<div className="mt-auto md:max-w-2xl">
					<HeroStaggerContainer delay={0.2}>
						<HeroStaggerItem>
							<HeroEyebrowReveal className="mb-8 flex items-center gap-4" delay={0.1}>
								<ArkelythexMark className="text-foreground" size={44} />
								<p className={LANDING_EYEBROW_CLASS}>{hero.eyebrow}</p>
							</HeroEyebrowReveal>
						</HeroStaggerItem>

						<HeroStaggerItem>
							<HeroRevealText
								text={hero.headline}
								className="text-balance text-hero-ds font-semibold leading-[0.98] tracking-[-0.045em] text-foreground"
								delay={0.3}
								wordDelay={0.1}
							/>
						</HeroStaggerItem>

						<HeroStaggerItem>
							<p className="mt-5 max-w-prose text-base text-muted-foreground sm:text-lg">
								{hero.subheadline}
							</p>
						</HeroStaggerItem>

						<HeroStaggerItem>
							<nav
								className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3"
								aria-label="Acciones principales"
							>
								<Link
									href={hero.ctaPrimaryHref}
									onClick={() => trackSireFunnelClick("hero_primary")}
									className={`${LANDING_LINK_CLASS} group`}
								>
									<span>{hero.ctaPrimary}</span>
									<ArrowRight
										className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
										aria-hidden
									/>
								</Link>
								<Link
									href={hero.ctaSecondaryHref}
									className={`${LANDING_LINK_CLASS} group text-muted-foreground hover:text-foreground`}
								>
									<span>{hero.ctaSecondary}</span>
									<ArrowRight
										className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5"
										aria-hidden
									/>
								</Link>
							</nav>
						</HeroStaggerItem>
					</HeroStaggerContainer>
				</div>
			</motion.div>

			<HeroScrollCue />
		</section>
	);
}
