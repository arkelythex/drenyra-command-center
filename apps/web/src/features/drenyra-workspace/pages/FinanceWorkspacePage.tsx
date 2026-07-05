import { AgentWorkspaceLayout } from "../components/AgentWorkspaceLayout";

const FINANCE_TOOLS = [
	{
		name: "create_invoice",
		description: "Crea una factura/comprobante de cobro",
	},
	{ name: "list_accounts", description: "Lista cuentas bancarias con saldos" },
	{ name: "get_balance", description: "Obtiene saldo de una cuenta" },
	{
		name: "forecast_cashflow",
		description: "Genera forecast de flujo de caja",
	},
	{ name: "auto_reconcile", description: "Ejecuta conciliación automática" },
	{
		name: "get_ledger_entry",
		description: "Consulta asientos del libro mayor",
	},
];

export function FinanceWorkspacePage() {
	return (
		<AgentWorkspaceLayout
			agentName="Finance Agent"
			description="Ciclo financiero completo: bancos, cobros, pagos, conciliación, libro mayor"
			tools={FINANCE_TOOLS}
		>
			<div className="mt-6 space-y-3">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
					Quick Actions
				</h3>
				<QuickAction
					label="Crear Factura"
					description="Generar un comprobante de cobro (gate — requiere aprobación)"
					approval="gate"
				/>
				<QuickAction
					label="Conciliar Cuentas"
					description="Ejecutar conciliación bancaria automática"
					approval="gate"
				/>
				<QuickAction
					label="Ver Saldos"
					description="Consultar saldos de cuentas bancarias"
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
				<div className="text-sm font-medium text-[var(--color-text-primary)]">
					{label}
				</div>
				<span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-3xs font-bold text-[var(--color-text-muted)] uppercase">
					{approval}
				</span>
			</div>
			<p className="mt-1 text-xs text-[var(--color-text-muted)]">
				{description}
			</p>
		</div>
	);
}
