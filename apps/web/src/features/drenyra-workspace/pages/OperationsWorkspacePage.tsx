import { AgentWorkspaceLayout } from "../components/AgentWorkspaceLayout";

const OPERATIONS_TOOLS = [
	{
		name: "create_customer",
		description: "Crea un nuevo cliente con validación RUC",
	},
	{ name: "list_customers", description: "Lista los clientes registrados" },
	{ name: "create_vendor", description: "Crea un nuevo proveedor" },
	{ name: "check_stock", description: "Consulta stock de inventario" },
	{ name: "create_product", description: "Crea un producto en el catálogo" },
	{ name: "list_products", description: "Lista productos del catálogo" },
];

export function OperationsWorkspacePage() {
	return (
		<AgentWorkspaceLayout
			agentName="Operations Agent"
			description="Ciclo operativo: clientes, proveedores, inventario, productos"
			tools={OPERATIONS_TOOLS}
		>
			<div className="mt-6 space-y-3">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
					Quick Actions
				</h3>
				<QuickAction
					label="Nuevo Cliente"
					description="Registrar un cliente con validación RUC SUNAT"
					approval="auto"
				/>
				<QuickAction
					label="Consultar Stock"
					description="Ver disponibilidad de productos en inventario"
					approval="auto"
				/>
				<QuickAction
					label="Nuevo Producto"
					description="Agregar producto al catálogo"
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
