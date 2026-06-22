"use client";

import type { ReactElement } from "react";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { useAnalytics } from "@/lib/use-analytics";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { landingStickyPanelMotion } from "@/lib/landing/motion-presets";

/**
 * Sticky CTA — visible on ALL breakpoints.
 * Mobile: fixed bottom bar, compact single CTA.
 * Desktop (md+): floating side panel, two CTAs.
 */
export function StickyCta(): ReactElement {
	const [isVisible, setIsVisible] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const { trackCtaClick } = useAnalytics();
	const reduceMotion = useReducedMotion();
	const panelMotion = landingStickyPanelMotion(reduceMotion);
	const scrollTicking = useRef(false);

	useEffect(() => {
		const updateMobile = () => setIsMobile(window.innerWidth < 768);
		updateMobile();
		window.addEventListener("resize", updateMobile);
		return () => window.removeEventListener("resize", updateMobile);
	}, []);

	useEffect(() => {
		const handleScroll = (): void => {
			const scrollY = window.scrollY;
			const windowHeight = window.innerHeight;
			const docHeight = document.documentElement.scrollHeight;

			const pastHero = scrollY > 500;
			const nearBottom = scrollY + windowHeight > docHeight - 600;

			setIsVisible(pastHero && !nearBottom);
			scrollTicking.current = false;
		};

		const throttledScrollHandler = (): void => {
			if (!scrollTicking.current) {
				window.requestAnimationFrame(handleScroll);
				scrollTicking.current = true;
			}
		};

		handleScroll();
		window.addEventListener("scroll", throttledScrollHandler, {
			passive: true,
		});
		return () => window.removeEventListener("scroll", throttledScrollHandler);
	}, []);

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={panelMotion.initial}
					animate={panelMotion.animate}
					exit={panelMotion.exit}
					transition={panelMotion.transition}
					className={
						isMobile
							? "fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe-area-or-4"
							: "hidden md:block fixed right-6 top-1/2 -translate-y-1/2 z-40"
					}
				>
					{isMobile ? (
						/* Mobile: compact bottom bar */
						<div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-surface/95 p-3 shadow-xl shadow-black/40 backdrop-blur-sm">
							<div className="min-w-0 flex-1">
								<p className="text-2xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
									Siguiente paso
								</p>
								<p className="mt-0.5 text-sm font-semibold text-foreground line-clamp-1">
									¿Quieres ver cómo se prioriza el riesgo?
								</p>
							</div>
							<Link
								href="/demo"
								onClick={() =>
									trackCtaClick("solicitar_demo", "sticky_cta_mobile")
								}
								className="btn-primary shrink-0 flex h-11 items-center gap-2 px-4 text-xs font-semibold"
							>
								<span>Demo</span>
								<ArrowRight className="w-4 h-4" aria-hidden />
							</Link>
						</div>
					) : (
						/* Desktop: side panel */
						<div className="w-72 rounded-3xl border border-foreground/10 bg-background/65 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
							<p className="text-eyebrow-ds font-medium uppercase tracking-[0.18em] text-muted-foreground">
								Siguiente paso
							</p>
							<p className="mt-2 text-sm font-bold tracking-tight text-foreground">
								¿Quieres ver cómo se prioriza el riesgo en tu operación?
							</p>
							<p className="mt-2 text-xs leading-relaxed landing-body-muted">
								Demo guiada SIRE-first o vista rápida de planes, según tu etapa.
							</p>

							<div className="mt-4 flex flex-col gap-2">
								<Link
									href="/demo"
									onClick={() => trackCtaClick("solicitar_demo", "sticky_cta")}
									className="group flex items-center justify-between gap-2 rounded-2xl bg-primary px-4 py-3 text-label font-black uppercase tracking-[0.16em] text-primary-foreground transition-all hover:opacity-95"
								>
									<span>Solicitar demo</span>
									<ArrowRight
										className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
										aria-hidden
									/>
								</Link>
								<Link
									href="/precios"
									onClick={() => trackCtaClick("ver_pricing", "sticky_cta")}
									className="group flex items-center justify-between gap-2 rounded-2xl border landing-border landing-surface px-4 py-3 text-label font-bold uppercase tracking-[0.16em] text-muted-foreground transition-all duration-300 hover:text-foreground hover:border-border-strong"
								>
									<span>Ver planes</span>
									<ArrowRight
										className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
										aria-hidden
									/>
								</Link>
							</div>
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}
