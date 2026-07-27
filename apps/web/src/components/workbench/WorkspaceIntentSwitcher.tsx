import {
	FileCheck,
	Landmark,
	Search,
	Settings,
	BarChart3,
	Layers,
} from "lucide-react";
import type { WorkspaceIntent } from "@drenyra/domain";
import { cn } from "@/lib/utils";

interface WorkspaceIntentSwitcherProps {
	activeIntent: WorkspaceIntent | null;
	onSelect: (intent: WorkspaceIntent) => void;
}

interface IntentOption {
	intent: WorkspaceIntent;
	label: string;
	icon: typeof Layers;
	description: string;
}

const INTENTS: IntentOption[] = [
	{
		intent: "close",
		label: "Cierre",
		icon: Layers,
		description: "Cierre mensual y trimestral",
	},
	{
		intent: "reconcile",
		label: "Conciliar",
		icon: Landmark,
		description: "Conciliaciones bancarias",
	},
	{
		intent: "review",
		label: "Revisión",
		icon: Search,
		description: "Cola de revisión y aprobaciones",
	},
	{
		intent: "investigate",
		label: "Investigar",
		icon: FileCheck,
		description: "Análisis y búsqueda de hallazgos",
	},
	{
		intent: "report",
		label: "Reportes",
		icon: BarChart3,
		description: "Reportes financieros y exportaciones",
	},
	{
		intent: "configure",
		label: "Configurar",
		icon: Settings,
		description: "Configuración del workspace",
	},
];

/**
 * WorkspaceIntentSwitcher — intent tabs for the workspace.
 *
 * Shows all available intents as clickable tabs with icons.
 * Active intent is highlighted. Shows description on hover.
 */
export function WorkspaceIntentSwitcher({
	activeIntent,
	onSelect,
}: WorkspaceIntentSwitcherProps) {
	return (
		<div
			className="flex items-center gap-0.5"
			role="tablist"
			aria-label="Intención del workspace"
		>
			{INTENTS.map((item) => {
				const Icon = item.icon;
				const isActive = activeIntent === item.intent;
				return (
					<button
						key={item.intent}
						type="button"
						role="tab"
						aria-selected={isActive}
						title={item.description}
						onClick={() => onSelect(item.intent)}
						className={cn(
							"flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
							isActive
								? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
								: "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
						)}
					>
						<Icon size={13} />
						<span className="hidden sm:inline">{item.label}</span>
					</button>
				);
			})}
		</div>
	);
}
