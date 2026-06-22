import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { JSX } from "react";
import { cn } from "@/lib/utils";
import { QUICK_COMMANDS, type QuickCommand } from "./quick-commands";

interface QuickCommandPaletteProps {
	isVisible: boolean;
	onSend: (command: string) => void;
}

export const QuickCommandPalette = ({
	isVisible,
	onSend,
}: QuickCommandPaletteProps): JSX.Element => (
	<AnimatePresence>
		{isVisible ? (
			<motion.div
				initial={{ opacity: 0, y: 18, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 18, scale: 0.98 }}
				className="absolute bottom-[calc(100%+14px)] left-0 right-0 z-40 rounded-xl border border-[var(--border-default)] bg-[var(--color-surface-1)] p-3 shadow-2xl"
			>
				<div className="mb-3 flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
					<Sparkles size={12} className="text-muted-foreground" />
					<span className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Acciones rápidas
					</span>
				</div>
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					{QUICK_COMMANDS.map((hint: QuickCommand) => (
						<button
							key={hint.label}
							type="button"
							onClick={() => onSend(hint.command)}
							className={cn(
								"flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200",
								hint.emphasis === "high"
									? "border-[rgba(var(--premium-info-rgb),0.25)] bg-foreground text-background hover:bg-foreground/92"
									: "border-[var(--border-subtle)] bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10",
							)}
						>
							<hint.icon size={13} strokeWidth={2.5} />
							<span className="text-label font-semibold uppercase tracking-[0.08em]">
								{hint.label}
							</span>
						</button>
					))}
				</div>
			</motion.div>
		) : null}
	</AnimatePresence>
);
