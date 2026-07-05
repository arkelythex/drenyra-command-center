import {
	CalendarCheck,
	FileSearch,
	Landmark,
	Loader2,
	Search,
} from "lucide-react";
import type { QuickAction } from "./threads.types";

// ─── Icon resolver ───────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
	"calendar-check": CalendarCheck,
	landmark: Landmark,
	"file-search": FileSearch,
	search: Search,
};

function resolveIcon(iconName: string): React.ElementType {
	return ICON_MAP[iconName] ?? Search;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface QuickActionButtonProps {
	action: QuickAction;
	onClick: () => void;
	disabled?: boolean;
}

export function QuickActionButton({
	action,
	onClick,
	disabled = false,
}: QuickActionButtonProps) {
	const Icon = resolveIcon(action.icon);

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={[
				"group relative flex flex-col items-start gap-2 rounded-2xl border p-5 text-left transition-all",
				"border-[var(--border-subtle)] bg-[var(--surface-1)]",
				"hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/[0.03]",
				"active:scale-[0.98]",
				disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
			].join(" ")}
		>
			<div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)]/15">
				{disabled ? (
					<Loader2 size={20} className="animate-spin" />
				) : (
					<Icon size={20} />
				)}
			</div>
			<div className="space-y-1">
				<p className="text-sm font-semibold text-[var(--text-primary)]">
					{action.title}
				</p>
				<p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
					{action.description}
				</p>
			</div>
		</button>
	);
}
