import { cn } from "@/lib/utils";
import type { CognitiveActivityEntry } from "../../../hooks/cognitive-stream";
import { getStatusIcon, getStatusStyles } from "../ToolExecutionTimeline.data";

interface TimelineEntryProps {
	entry: CognitiveActivityEntry;
}

export function TimelineEntry({ entry }: TimelineEntryProps) {
	const StatusIcon = getStatusIcon(entry.status);

	return (
		<div
			className={cn(
				"flex items-start gap-2 rounded-xl border px-2.5 py-2 text-xs",
				getStatusStyles(entry.status),
			)}
		>
			<StatusIcon size={14} className="mt-0.5 shrink-0" />
			<div className="min-w-0">
				<p className="font-semibold leading-tight">{entry.label}</p>
				{entry.detail ? (
					<p className="mt-0.5 truncate opacity-80">{entry.detail}</p>
				) : null}
			</div>
			<span className="ml-auto shrink-0 font-mono text-2xs opacity-60">
				{new Date(entry.timestamp).toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				})}
			</span>
		</div>
	);
}
