import { useNavigate } from "@tanstack/react-router";
import { Settings, User } from "lucide-react";
import { useAccountingStore } from "@/stores/accounting-store";

interface SidebarFooterProps {
	isCollapsed: boolean;
	onNavigate: () => void;
}

export function SidebarFooter({ isCollapsed, onNavigate }: SidebarFooterProps) {
	const navigate = useNavigate();
	const activeCompany = useAccountingStore((s) => s.getActiveCompany());
	const activePeriod = useAccountingStore((s) => s.getActivePeriod());

	if (isCollapsed) {
		return (
			<footer className="border-t border-[var(--border-subtle)] px-3 py-3">
				<button
					type="button"
					onClick={() => {
						onNavigate();
						navigate({ to: "/configuracion" });
					}}
					className="flex w-full items-center justify-center rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
					aria-label="Ajustes"
				>
					<Settings size={15} strokeWidth={1.5} />
				</button>
			</footer>
		);
	}

	return (
		<footer className="border-t border-[var(--border-subtle)] px-3 py-3 space-y-2">
			<div className="flex flex-col gap-0.5 px-1">
				<span className="text-xs font-medium text-[var(--text-primary)] truncate">
					{activeCompany?.name ?? "Sin empresa"}
				</span>
				<span className="text-2xs text-[var(--text-muted)]">
					{activePeriod?.label ?? "Sin período"}
				</span>
			</div>
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={() => {
						onNavigate();
						navigate({ to: "/configuracion" });
					}}
					className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-2xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
				>
					<Settings size={12} />
					<span>Ajustes</span>
				</button>
				<button
					type="button"
					onClick={() => {
						onNavigate();
						/* TODO: navigate to profile */
					}}
					className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-2xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
				>
					<User size={12} />
					<span>Perfil</span>
				</button>
			</div>
		</footer>
	);
}
