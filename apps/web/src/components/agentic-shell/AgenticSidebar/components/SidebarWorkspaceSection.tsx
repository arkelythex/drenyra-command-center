import { useNavigate } from "@tanstack/react-router";
import { Layers, Plus, Search } from "lucide-react";
import { useWorkspace } from "@/contexts/workspace-context";

interface SidebarWorkspaceSectionProps {
	isCollapsed: boolean;
}

/**
 * SidebarWorkspaceSection — shows current workspace context at the top of the sidebar.
 *
 * When a workspace is active, displays company name, period, and intent.
 * In collapsed mode, shows company initial as a compact indicator.
 * Also renders quick-access buttons for common actions.
 */
export function SidebarWorkspaceSection({
	isCollapsed,
}: SidebarWorkspaceSectionProps) {
	const navigate = useNavigate();
	const { workspace } = useWorkspace();

	if (isCollapsed) {
		return (
			<div className="flex flex-col items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-3">
				{workspace ? (
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
						{workspace.company.name.charAt(0).toUpperCase()}
					</div>
				) : (
					<Layers size={16} className="text-[var(--text-muted)]" />
				)}
			</div>
		);
	}

	return (
		<div className="border-b border-[var(--border-subtle)] px-3 py-3">
			{/* Workspace context */}
			{workspace ? (
				<div className="mb-3 rounded-lg bg-[var(--surface-2)] p-2.5">
					<p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
						{workspace.company.name}
					</p>
					<p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
						{workspace.period.label} · {workspace.intent}
					</p>
				</div>
			) : (
				<p className="mb-3 px-1 text-[11px] text-[var(--text-muted)]">
					Sin workspace activo
				</p>
			)}

			{/* Quick-access buttons */}
			<div className="space-y-1">
				<button
					type="button"
					onClick={() =>
						navigate({ to: "/drenyra" } as Parameters<typeof navigate>[0])
					}
					className="flex w-full items-center gap-2 rounded-lg bg-[var(--surface-2)] px-2 py-1.5 text-left text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
				>
					<Plus size={14} className="text-[var(--color-primary)]" />
					<span>Nueva revisión fiscal</span>
				</button>
				<button
					type="button"
					onClick={() =>
						navigate({
							to: "/review-queue",
						} as Parameters<typeof navigate>[0])
					}
					className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
				>
					<Search size={14} className="text-[var(--text-muted)]" />
					<span>Buscar en Drenyra</span>
				</button>
			</div>
		</div>
	);
}
