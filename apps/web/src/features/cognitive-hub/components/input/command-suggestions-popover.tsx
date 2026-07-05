import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CornerDownRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandSuggestion } from "./unified-input.types";

interface CommandSuggestionsPopoverProps {
	suggestions: CommandSuggestion[];
	selectedIndex: number;
	suggestionListId: string;
	onSelect: (command: string) => void;
	onHoverIndex: (index: number) => void;
}

export const CommandSuggestionsPopover = ({
	suggestions,
	selectedIndex,
	suggestionListId,
	onSelect,
	onHoverIndex,
}: CommandSuggestionsPopoverProps) => {
	const prefersReducedMotion = useReducedMotion();

	return (
		<AnimatePresence>
			{suggestions.length > 0 ? (
				<motion.div
					initial={
						prefersReducedMotion
							? { opacity: 0 }
							: { opacity: 0, y: 12, scale: 0.98 }
					}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={
						prefersReducedMotion
							? { opacity: 0 }
							: { opacity: 0, y: 8, scale: 0.98 }
					}
					transition={{
						duration: prefersReducedMotion ? 0.12 : 0.18,
						ease: "easeOut",
					}}
					id={suggestionListId}
					role="listbox"
					className="absolute bottom-[calc(100%+14px)] left-4 right-4 z-50 overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--color-surface-1)] p-2 shadow-2xl"
				>
					<div className="mb-1 flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
						<div className="flex h-5 w-5 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-black/10 dark:bg-white/10 text-muted-foreground">
							<Sparkles size={11} />
						</div>
						<span className="text-label font-medium text-muted-foreground">
							Sugerencias contables
						</span>
					</div>
					{suggestions.map((suggestion, index) => {
						const isSelected = selectedIndex === index;

						return (
							<button
								key={suggestion.command}
								type="button"
								id={`${suggestionListId}-option-${index}`}
								role="option"
								aria-selected={isSelected}
								onClick={() => onSelect(suggestion.command)}
								onMouseEnter={() => onHoverIndex(index)}
								className={cn(
									"group flex w-full items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-colors duration-150",
									isSelected
										? "border-primary/20 bg-primary/8 text-foreground"
										: "text-foreground hover:border-[var(--border-subtle)] hover:bg-black/10 dark:hover:bg-white/10",
								)}
							>
								<div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-current/10 bg-current/8">
									<CornerDownRight size={12} />
								</div>
								<div className="min-w-0 flex-1">
									<span className="block truncate text-xs font-semibold">
										{suggestion.command}
									</span>
									<span
										className={cn(
											"mt-1 block text-label font-medium",
											isSelected ? "text-primary" : "text-muted-foreground",
										)}
									>
										{suggestion.title}
									</span>
									<span
										className={cn(
											"mt-1 block text-label leading-relaxed",
											isSelected
												? "text-foreground/70"
												: "text-muted-foreground/85",
										)}
									>
										{suggestion.description}
									</span>
								</div>
								<span
									className={cn(
										"ui-keycap shrink-0 rounded-full px-2 py-0.5 text-3xs font-medium",
										isSelected
											? "border-primary/10 bg-primary/8 text-primary"
											: "",
									)}
								>
									enter
								</span>
							</button>
						);
					})}
				</motion.div>
			) : null}
		</AnimatePresence>
	);
};
