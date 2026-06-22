import type { FiscalRiskLevel } from "../api/drenyra-command-center.api";
import { cn } from "@/lib/utils";

export function FiscalRiskBadge({
	riskLevel,
	score,
	compact = false,
}: {
	riskLevel: FiscalRiskLevel;
	score?: number;
	compact?: boolean;
}) {
	const color =
		riskLevel === "LOW"
			? "text-[var(--color-success)] border-[var(--color-success)]/30 bg-[var(--color-success)]/10"
			: riskLevel === "MEDIUM"
				? "text-[var(--color-warning)] border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10"
				: "text-[var(--color-danger)] border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10";
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-1 text-2xs font-bold",
				color,
			)}
		>
			{riskLevel}
			{!compact && typeof score === "number" ? ` · ${score}` : ""}
		</span>
	);
}
