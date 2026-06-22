"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useExitIntent } from "@/lib/hooks/use-exit-intent";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useAnalytics } from "@/lib/use-analytics";

/**
 * Exit intent popup — shows once when user moves cursor to leave (desktop)
 * or rapid scroll-up near top (mobile). Respects 24h cooldown via localStorage.
 */
export function ExitIntentPopup(): ReactElement | null {
	const { isTriggered, reset } = useExitIntent({
		maxTriggers: 1,
		cooldown: 86_400_000,
		delay: 8_000,
	});
	const [isDismissed, setIsDismissed] = useState(false);
	const reduceMotion = useReducedMotion();
	const { trackCtaClick } = useAnalytics();

	if (!isTriggered || isDismissed) return null;

	const handleDismiss = () => {
		setIsDismissed(true);
		reset();
	};

	return (
		<AnimatePresence>
			{isTriggered && !isDismissed && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: reduceMotion ? 0 : 0.25 }}
					className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
					role="dialog"
					aria-modal="true"
					aria-label="Oferta especial"
				>
					<motion.div
						initial={reduceMotion ? {} : { opacity: 0, y: 20, scale: 0.97 }}
						animate={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
						exit={reduceMotion ? {} : { opacity: 0, y: 10, scale: 0.98 }}
						transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
						className="relative w-full max-w-md overflow-hidden rounded-2xl border border-foreground/10 bg-surface p-8 shadow-2xl shadow-black/40"
					>
						{/* Close button */}
						<button
							type="button"
							onClick={handleDismiss}
							className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
							aria-label="Cerrar"
						>
							<X className="h-4 w-4" />
						</button>

						{/* Content */}
						<p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
							Antes de irte
						</p>
						<h3 className="mt-3 text-2xl font-semibold text-foreground">
							¿Listo para automatizar tu cierre fiscal?
						</h3>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							Demo guiada sin compromiso. Vemos tu caso de uso específico y te
							mostramos cómo Drenyra resuelve tu operación en minutos.
						</p>

						<div className="mt-6 flex flex-col gap-3">
							<Link
								href="/demo"
								onClick={() => {
									trackCtaClick("solicitar_demo", "exit_intent");
									handleDismiss();
								}}
								className="btn-primary flex items-center justify-center gap-2 text-sm"
							>
								<span>Agendar demo</span>
								<ArrowRight className="h-4 w-4" aria-hidden />
							</Link>
							<button
								type="button"
								onClick={handleDismiss}
								className="text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
							>
								Ahora no, gracias
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
