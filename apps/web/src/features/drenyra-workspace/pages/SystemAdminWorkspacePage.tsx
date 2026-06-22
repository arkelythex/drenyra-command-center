import { AgentWorkspaceLayout } from "../components/AgentWorkspaceLayout";

const SYSTEM_ADMIN_TOOLS = [
	{
		name: "manage_integrations",
		description: "Gestiona integraciones y conexiones",
	},
	{
		name: "update_settings",
		description: "Actualiza configuración del sistema",
	},
	{ name: "update_profile", description: "Actualiza perfil de usuario" },
	{
		name: "toggle_surface",
		description: "Activa/desactiva surfaces de producto",
	},
];

export function SystemAdminWorkspacePage() {
	return (
		<AgentWorkspaceLayout
			agentName="System Admin Agent"
			description="Configuración del sistema: usuarios, integraciones, surfaces"
			tools={SYSTEM_ADMIN_TOOLS}
		>
			<div className="mt-6 space-y-3">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
					Quick Actions
				</h3>
				<QuickAction
					label="Probar Conexión"
					description="Verificar integraciones y conectividad"
					approval="notify"
				/>
				<QuickAction
					label="Configurar Sistema"
					description="Actualizar preferencias generales"
					approval="gate"
				/>
			</div>
		</AgentWorkspaceLayout>
	);
}

function QuickAction({
	label,
	description,
	approval,
}: {
	label: string;
	description: string;
	approval: string;
}) {
	return (
		<div className="rounded-lg border border-[var(--color-stroke-2)] bg-[var(--color-surface-1)]/50 p-3 transition-colors hover:bg-[var(--color-surface-2)]/50">
			<div className="flex items-center justify-between">
				<div className="text-sm font-medium text-[var(--color-text-primary)]">{label}</div>
				<span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-3xs font-bold text-[var(--color-text-muted)] uppercase">
					{approval}
				</span>
			</div>
			<p className="mt-1 text-xs text-[var(--color-text-muted)]">{description}</p>
		</div>
	);
}
