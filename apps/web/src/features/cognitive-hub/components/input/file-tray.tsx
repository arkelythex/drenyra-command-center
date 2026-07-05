import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FileText, X } from "lucide-react";

interface FileTrayProps {
	files: File[];
	onRemove: (index: number) => void;
}

export const FileTray = ({ files, onRemove }: FileTrayProps) => {
	const prefersReducedMotion = useReducedMotion();

	return (
		<AnimatePresence>
			{files.length > 0 ? (
				<motion.div
					initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
					transition={{
						duration: prefersReducedMotion ? 0.12 : 0.16,
						ease: "easeOut",
					}}
					className="mb-3 flex flex-wrap gap-2 px-3 sm:px-4"
				>
					{files.map((file, index) => (
						<div
							key={`${file.name}-${index}`}
							className="group flex items-center gap-2 rounded-full border border-border/30 bg-card/70 px-3 py-2"
						>
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/25 bg-background/60 text-muted-foreground">
								<FileText size={12} />
							</div>
							<span className="max-w-[140px] truncate text-label font-medium text-foreground sm:max-w-[180px]">
								{file.name}
							</span>
							<button
								type="button"
								onClick={() => onRemove(index)}
								className="flex h-5 w-5 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors duration-150 hover:border-border/30 hover:bg-muted/40 hover:text-foreground"
								aria-label={`Eliminar ${file.name}`}
							>
								<X size={10} />
							</button>
						</div>
					))}
				</motion.div>
			) : null}
		</AnimatePresence>
	);
};
