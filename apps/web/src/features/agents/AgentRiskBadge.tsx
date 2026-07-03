interface AgentRiskBadgeProps {
	risk: "low" | "medium" | "high" | "critical";
}

const RISK_STYLES: Record<AgentRiskBadgeProps["risk"], string> = {
	low: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
	medium: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
	high: "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
	critical:
		"bg-[var(--color-danger)]/20 text-[var(--color-danger)] animate-pulse",
};

const RISK_LABELS: Record<AgentRiskBadgeProps["risk"], string> = {
	low: "Bajo",
	medium: "Medio",
	high: "Alto",
	critical: "Crítico",
};

export function AgentRiskBadge({ risk }: AgentRiskBadgeProps) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${RISK_STYLES[risk]}`}
		>
			{RISK_LABELS[risk]}
		</span>
	);
}
