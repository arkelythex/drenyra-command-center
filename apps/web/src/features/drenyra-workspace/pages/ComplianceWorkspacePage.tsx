import { AgentWorkspaceLayout } from "../components/AgentWorkspaceLayout";

const COMPLIANCE_TOOLS = [
	{ name: "calculate_igv", description: "Calcula IGV (18%) sobre un monto" },
	{
		name: "submit_sire",
		description: "Envía reporte SIRE a SUNAT (fiscal_gate)",
	},
	{ name: "validate_cpe", description: "Valida CPE contra esquemas SUNAT" },
	{ name: "get_tax_calendar", description: "Obtiene calendario fiscal SUNAT" },
];

export function ComplianceWorkspacePage() {
	return (
		<AgentWorkspaceLayout
			agentName="Compliance (Fiscal) Agent"
			description="Ciclo fiscal peruano: SUNAT, IGV, SIRE, CPE, cierre contable"
			tools={COMPLIANCE_TOOLS}
		>
			<div className="mt-6 space-y-3">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
					Quick Actions
				</h3>
				<QuickAction
					label="Calcular IGV"
					description="Calcula IGV 18% sobre un monto específico"
					approval="auto"
				/>
				<QuickAction
					label="Enviar SIRE"
					description="Enviar reporte a SUNAT (fiscal_gate — governance bundle)"
					approval="fiscal_gate"
				/>
				<QuickAction
					label="Validar CPE"
					description="Validar comprobante contra esquemas UBL/SUNAT"
					approval="auto"
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
