import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Mic, Plus } from "lucide-react";
import type { KeyboardEvent, RefObject } from "react";
import { cn } from "@/lib/utils";
import type { QuickRoute } from "./types";

interface ExpandedOmnibarProps {
	inputRef: RefObject<HTMLInputElement | null>;
	query: string;
	selectedIndex: number;
	filteredRoutes: readonly QuickRoute[];
	onQueryChange: (value: string) => void;
	onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
	onRouteSelect: (path: QuickRoute["path"]) => void;
}

export function ExpandedOmnibar({
	inputRef,
	query,
	selectedIndex,
	filteredRoutes,
	onQueryChange,
	onKeyDown,
	onRouteSelect,
}: ExpandedOmnibarProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			layoutId="omnibar-container"
			layout
			className="fixed bottom-6 left-4 right-4 z-[100] flex flex-col items-center justify-end gap-2"
			transition={{
				duration: prefersReducedMotion ? 0.1 : 0.16,
				ease: "easeOut",
			}}
		>
			<AnimatePresence>
				{filteredRoutes.length > 0 ? (
					<motion.div
						layout
						initial={
							prefersReducedMotion
								? { opacity: 0 }
								: { opacity: 0, y: 8, scale: 0.98 }
						}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={
							prefersReducedMotion
								? { opacity: 0 }
								: { opacity: 0, y: 8, scale: 0.98 }
						}
						transition={{
							duration: prefersReducedMotion ? 0.1 : 0.14,
							ease: "easeOut",
						}}
						className="custom-scrollbar z-20 mb-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-surface)] shadow-xl "
					>
						{filteredRoutes.map((route, index) => (
							<button
								type="button"
								key={route.path}
								onClick={() => onRouteSelect(route.path)}
								aria-label={`Ir a ${route.label}`}
								className={cn(
									"flex w-full cursor-pointer items-center gap-3 border-b border-[var(--border-subtle)]/40 px-4 py-3 text-left transition-colors last:border-0",
									index === selectedIndex
										? "bg-[var(--info)]/14"
										: "hover:bg-[var(--info)]/8",
								)}
							>
								<route.icon
									size={16}
									className="shrink-0 text-[var(--accent)]"
								/>
								<div className="flex min-w-0 flex-col">
									<span className="truncate text-sm font-medium text-primary">
										{route.label}
									</span>
									<span className="truncate font-mono text-2xs text-secondary">
										{route.path}
									</span>
								</div>
								{index === selectedIndex ? (
									<ArrowRight
										size={14}
										className="ml-auto shrink-0 text-secondary"
									/>
								) : null}
							</button>
						))}
					</motion.div>
				) : null}
			</AnimatePresence>

			<motion.div
				layout
				transition={{
					duration: prefersReducedMotion ? 0.1 : 0.16,
					ease: "easeOut",
				}}
				className="relative z-30 flex h-14 w-full shrink-0 items-center gap-3 overflow-hidden rounded-full border border-[var(--glass-border)] bg-[var(--glass-surface)] px-4 shadow-xl "
			>
				<Plus className="h-5 w-5 shrink-0 text-[var(--accent)]" />

				<input
					ref={inputRef}
					value={query}
					onChange={(event) => onQueryChange(event.target.value)}
					onKeyDown={onKeyDown}
					placeholder="Escribe '/' para navegar..."
					aria-label="Buscar ruta o comando"
					className="h-full w-full flex-1 border-none bg-transparent text-base font-medium text-primary outline-none placeholder:text-secondary"
				/>

				<button
					type="button"
					aria-label="Activar entrada por voz"
					className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--info)]/14 text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--info)]/20 hover:text-primary"
				>
					<Mic size={16} />
				</button>

				<div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--info)]/20 to-transparent opacity-50" />
			</motion.div>
		</motion.div>
	);
}
