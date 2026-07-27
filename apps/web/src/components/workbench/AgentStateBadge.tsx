import {
	AlertOctagon,
	CheckCircle,
	ClipboardCheck,
	Clock,
	HelpCircle,
	Loader,
	SearchCheck,
	XCircle,
} from "lucide-react";
import type { AgentSemanticState } from "../../types/agent-activity";
import { AGENT_STATE_MAP } from "../../types/agent-activity";
import { cn } from "@/lib/utils";

interface AgentStateBadgeProps {
	state: AgentSemanticState;
	compact?: boolean;
	showLabel?: boolean;
	reason?: string;
}

const iconMap: Record<string, typeof Loader> = {
	Loader,
	SearchCheck,
	HelpCircle,
	ClipboardCheck,
	AlertOctagon,
	CheckCircle,
	XCircle,
	Clock,
};

const colorMap: Record<string, string> = {
	blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
	amber:
		"bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
	red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
	green:
		"bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
	gray: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
	purple:
		"bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

/**
 * AgentStateBadge — semantic agent state indicator.
 *
 * Shows state color, icon, and optional label/reason.
 * Compact variant for sidebar/pane headers.
 * Full variant with reason for activity feed.
 */
export function AgentStateBadge({
	state,
	compact = false,
	showLabel = true,
	reason,
}: AgentStateBadgeProps) {
	const info = AGENT_STATE_MAP[state] ?? AGENT_STATE_MAP.unknown;
	const Icon = iconMap[info.icon] ?? HelpCircle;
	const colorClass = colorMap[info.color] ?? colorMap.gray;

	if (compact) {
		return (
			<div
				className={cn(
					"flex h-5 w-5 items-center justify-center rounded-full",
					colorClass,
				)}
				title={reason ? `${info.label}: ${reason}` : info.label}
			>
				<Icon size={10} />
			</div>
		);
	}

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
				colorClass,
			)}
			title={info.description}
		>
			<Icon size={12} />
			{showLabel && (
				<span className="text-[11px] font-medium">{info.label}</span>
			)}
			{reason && (
				<span className="ml-1 text-[10px] opacity-75">· {reason}</span>
			)}
		</div>
	);
}
