import { cn } from "@/lib/utils";

const HIGH = 90;
const MEDIUM = 60;

function level(score: number) {
	if (score >= HIGH)
		return {
			label: "Alta",
			tone: "border-success-muted bg-success-subtle text-success",
		};
	if (score >= MEDIUM)
		return {
			label: "Media",
			tone: "border-warning-muted bg-warning-subtle text-warning",
		};
	return {
		label: "Sin match",
		tone: "border-destructive/30 bg-destructive/10 text-destructive",
	};
}

/** Match confidence (0–100) as a colored pill; the label spells out the level. */
export function ConfidenceBadge({
	score,
	showLabel = false,
}: {
	score: number;
	showLabel?: boolean;
}) {
	const { label, tone } = level(score);
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label font-medium tabular-nums",
				tone,
			)}
			title={`Confianza ${label.toLowerCase()}: ${score}%`}
		>
			{score}%{showLabel ? <span>· {label}</span> : null}
		</span>
	);
}
