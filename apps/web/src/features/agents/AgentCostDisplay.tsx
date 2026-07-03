import { Timer, Zap } from "lucide-react";

function formatTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	if (totalSeconds < 60) return `${totalSeconds}s`;

	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	if (minutes < 60) return `${minutes}m ${seconds}s`;

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	return `${hours}h ${remainingMinutes}m`;
}

function formatTokens(count: number): string {
	if (count < 1000) return String(count);
	if (count < 1_000_000) return count.toLocaleString();
	return `${(count / 1_000_000).toFixed(1)}M`;
}

interface AgentCostDisplayProps {
	elapsedMs: number;
	tokensUsed: number;
}

export function AgentCostDisplay({
	elapsedMs,
	tokensUsed,
}: AgentCostDisplayProps) {
	return (
		<div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
			<span className="flex items-center gap-1">
				<Timer className="size-3" aria-hidden="true" />
				{formatTime(elapsedMs)}
			</span>
			<span className="flex items-center gap-1">
				<Zap className="size-3" aria-hidden="true" />
				{formatTokens(tokensUsed)}
			</span>
		</div>
	);
}
