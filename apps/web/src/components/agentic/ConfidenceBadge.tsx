import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
	score: number; // 0 to 1
	className?: string;
}

export const ConfidenceBadge = ({ score, className }: ConfidenceBadgeProps) => {
	const percentage = Math.round(score * 100);

	const getStyle = () => {
		if (score >= 0.9)
			return "bg-[rgba(var(--premium-success-rgb),0.10)] text-[var(--premium-success)] border-[rgba(var(--premium-success-rgb),0.20)]";
		if (score >= 0.7)
			return "bg-amber-500/10 text-amber-500 border-amber-500/20";
		return "bg-red-500/10 text-red-500 border-red-500/20";
	};

	return (
		<div
			className={cn(
				"px-2 py-0.5 rounded-full border text-2xs font-black uppercase tracking-widest flex items-center gap-1.5",
				getStyle(),
				className,
			)}
		>
			<span className="opacity-60">Robot Match</span>
			<span>{percentage}%</span>
		</div>
	);
};
