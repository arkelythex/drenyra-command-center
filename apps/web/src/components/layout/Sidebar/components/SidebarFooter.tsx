import { useNavigate } from "@tanstack/react-router";
import { Bot, Settings } from "lucide-react";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

interface SidebarFooterProps {
	isCollapsed: boolean;
	onNavigate: () => void;
}

export function SidebarFooter({ isCollapsed, onNavigate }: SidebarFooterProps) {
	const navigate = useNavigate();
	const { companyContext } = useActiveCompanyContext();

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
		<footer className="border-t border-[var(--border-subtle)] px-3 py-2.5">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-2xs font-bold text-[var(--text-secondary)]">
						{companyContext.companyName?.charAt(0) ?? "?"}
					</div>
					<span className="truncate text-xs font-medium text-[var(--text-primary)]">
						{companyContext.companyName ?? "Sin empresa"}
					</span>
				</div>
				<div className="flex items-center gap-1">
					<span className="flex items-center gap-1 rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 text-2xs text-[var(--text-muted)]">
						<Bot size={10} className="text-[var(--color-primary)]" />3
					</span>
					<button
						type="button"
						onClick={() => {
							onNavigate();
							navigate({ to: "/configuracion" });
						}}
						className="flex items-center justify-center rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
						aria-label="Ajustes"
					>
						<Settings size={13} strokeWidth={1.5} />
					</button>
				</div>
			</div>
		</footer>
	);
}
