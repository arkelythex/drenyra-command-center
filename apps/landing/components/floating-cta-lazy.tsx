"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { landingFloatBarMotion } from "@/lib/landing/motion-presets";
import { useAnalytics } from "@/lib/use-analytics";

function FloatingCTA(): ReactElement | null {
	const [isVisible, setIsVisible] = useState(false);
	const [isDismissed, setIsDismissed] = useState(false);
	const [isCompactViewport, setIsCompactViewport] = useState(false);
	const { trackCtaClick } = useAnalytics();
	const pathname = usePathname();
	const prefersReducedMotion = useReducedMotion();
	const floatMotion = landingFloatBarMotion(prefersReducedMotion);

	useEffect(() => {
		const evaluateViewport = () => {
			setIsCompactViewport(window.innerHeight < 760);
		};

		evaluateViewport();
		window.addEventListener("resize", evaluateViewport);

		const handleScroll = () => {
			const revealThreshold = isCompactViewport
				? window.innerHeight * 0.5
				: window.innerHeight * 0.7;
			if (!isDismissed && window.scrollY > revealThreshold) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			window.removeEventListener("resize", evaluateViewport);
			window.removeEventListener("scroll", handleScroll);
		};
	}, [isCompactViewport, isDismissed]);

	const handleDismiss = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDismissed(true);
		setIsVisible(false);
	};

	if (isDismissed || pathname === "/") return null;

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={floatMotion.initial}
					animate={floatMotion.animate}
					exit={floatMotion.exit}
					transition={floatMotion.transition}
					className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
				>
					<div className="rounded-2xl border border-border/20 bg-secondary/5 p-3.5 shadow-2xl shadow-black/50">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
									Siguiente paso
								</p>
								<p className="mt-1 text-sm font-semibold text-foreground">
									Comienza con SIRE hoy
								</p>
								{!isCompactViewport ? (
									<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
										Piloto guiado de alto impacto o vista rápida de pricing.
									</p>
								) : null}
							</div>
							<button
								type="button"
								onClick={handleDismiss}
								className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10"
								aria-label="Cerrar"
							>
								<X className="h-4 w-4" aria-hidden />
							</button>
						</div>

						<div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
							<Link
								href="/demo"
								onClick={() => trackCtaClick("solicitar_demo", "floating_cta")}
								className="btn-primary min-h-11 text-sm py-2.5 px-4 flex items-center justify-center gap-2"
							>
								<span>Demo</span>
								<ArrowRight className="w-4 h-4" aria-hidden="true" />
							</Link>
							<Link
								href="/precios"
								onClick={() => trackCtaClick("ver_pricing", "floating_cta")}
								className="flex min-h-11 items-center justify-center rounded-xl border landing-border landing-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-border-strong"
							>
								Ver planes
							</Link>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export function FloatingCTALazy() {
	return <FloatingCTA />;
}
