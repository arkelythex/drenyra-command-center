import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { UploadCloud } from "lucide-react";

interface DragOverlayProps {
	isVisible: boolean;
}

export const DragOverlay = ({ isVisible }: DragOverlayProps) => {
	const prefersReducedMotion = useReducedMotion();

	return (
		<AnimatePresence>
			{isVisible ? (
				<motion.div
					initial={
						prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }
					}
					animate={{ opacity: 1, scale: 1 }}
					exit={
						prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }
					}
					transition={{
						duration: prefersReducedMotion ? 0.12 : 0.16,
						ease: "easeOut",
					}}
					className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center rounded-xl border border-border/70 bg-background/55 p-4 "
				>
					<div className="flex min-w-[14rem] items-center gap-3 rounded-xl border border-border/70 bg-card/94 px-4 py-3 shadow-xl">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background/70 text-foreground">
							<UploadCloud size={18} />
						</div>
						<div className="min-w-0">
							<p className="text-label font-black uppercase tracking-[0.14em] text-foreground">
								Soltar archivos
							</p>
							<p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
								Adjunta respaldos contables sin salir del flujo actual.
							</p>
						</div>
					</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
};
