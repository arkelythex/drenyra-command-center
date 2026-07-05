import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { dispatchCognitiveWorkspaceAction } from "../../workspace-events";

interface WorkspaceSidebarActionsProps {
	isCollapsed: boolean;
	onNavigate: () => void;
}

export function WorkspaceSidebarActions({
	isCollapsed,
	onNavigate,
}: WorkspaceSidebarActionsProps) {
	const handleStartMission = () => {
		dispatchCognitiveWorkspaceAction("start-mission");
		onNavigate();
	};

	return (
		<section className="space-y-2.5">
			{!isCollapsed ? (
				<p className="px-1 text-label font-medium text-muted-foreground">
					Acciones
				</p>
			) : null}

			<button
				type="button"
				onClick={handleStartMission}
				className={cn(
					"group flex w-full items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] transition-all hover:border-[var(--border-default)] hover:bg-[var(--surface-3)]",
					isCollapsed ? "h-10 justify-center px-0" : "gap-3 px-3 py-2.5",
				)}
				title="Nuevo cierre"
			>
				<PlusCircle size={16} className="shrink-0 text-foreground" />
				{!isCollapsed ? (
					<span className="text-sm font-medium text-foreground">
						Nuevo cierre
					</span>
				) : null}
			</button>
		</section>
	);
}
