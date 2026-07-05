import { Bell } from "lucide-react";

interface NotificationBadgeProps {
	count: number;
	onMarkAllRead: () => void;
	t: (key: string) => string;
}

export function NotificationBadge({
	count,
	onMarkAllRead,
	t,
}: NotificationBadgeProps) {
	if (count <= 0) return null;
	return (
		<button
			onClick={() => onMarkAllRead()}
			className="mt-3 flex w-full items-center gap-2 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-3 py-2 text-xs transition hover:border-[var(--color-warning)]/50"
			type="button"
		>
			<Bell
				size={14}
				className="text-[var(--color-warning)]"
				aria-hidden="true"
			/>
			<span className="flex-1 font-semibold text-[var(--color-warning)]">
				{count} notificación{count !== 1 ? "es" : ""}
			</span>
			<span className="text-2xs text-[var(--text-tertiary)]">
				{t("sidebar.markAllRead")}
			</span>
		</button>
	);
}
