import { Sparkles } from "lucide-react";

interface MatchSuggesterProps {
	docId: string;
	score: number;
	onConfirm: () => void;
}

export const MatchSuggester = ({
	docId,
	score,
	onConfirm,
}: MatchSuggesterProps) => {
	return (
		<div className="flex items-center gap-4 bg-[var(--surface-2)] border border-[var(--border-subtle)] px-4 py-2 rounded-xl animate-in zoom-in-95 duration-500 group/sug">
			<div className="flex items-center gap-2">
				<Sparkles
					size={12}
					className="text-[var(--text-primary)] animate-pulse"
				/>
				<span className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">
					Sugerencia IA
				</span>
			</div>
			<div className="h-4 w-px bg-border" />
			<div className="flex flex-col">
				<span className="text-label font-bold text-[var(--text-primary)] uppercase">
					{docId}
				</span>
				<span className="text-2xs font-bold text-[var(--text-tertiary)] uppercase">
					{score}% Probabilidad
				</span>
			</div>
			<button
				onClick={(e) => {
					e.stopPropagation();
					onConfirm();
				}}
				className="ml-auto h-7 rounded-lg bg-[var(--accent)] px-3 text-xs font-bold uppercase tracking-widest text-[var(--text-on-accent)] transition-[background-color,box-shadow,transform,opacity] duration-200 hover:opacity-80 active:scale-90"
			>
				Confirmar
			</button>
		</div>
	);
};
