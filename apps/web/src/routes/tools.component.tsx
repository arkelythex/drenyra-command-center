import { ExternalLink } from "lucide-react";

const TOOLS = [
	{ name: "Facturación", path: "/invoices", desc: "Gestión de facturas" },
	{ name: "Bancos", path: "/banking", desc: "Cuentas bancarias y movimientos" },
	{ name: "Cuentas por pagar", path: "/bills", desc: "Gestión de cuentas" },
	{ name: "Flujo de caja", path: "/cashflow", desc: "Proyecciones" },
	{ name: "Reportes", path: "/reports", desc: "Reportes personalizados" },
	{ name: "Clientes", path: "/customers", desc: "Gestión de clientes" },
	{ name: "Proveedores", path: "/vendors", desc: "Gestión de proveedores" },
	{ name: "Contador", path: "/accountant", desc: "Vista de contador" },
	{
		name: "Herramientas legacy",
		path: "/drenyra/herramientas",
		desc: "Herramientas Drenyra",
	},
	{ name: "Comparar periodos", path: "/compare", desc: "Comparación" },
] as const;

export default function ToolsPage() {
	return (
		<div className="mx-auto max-w-2xl p-6 space-y-6">
			<header>
				<h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
					Herramientas
				</h1>
				<p className="mt-1 text-xs text-[var(--text-tertiary)]">
					Módulos legacy accesibles desde aquí. La navegación principal está
					organizada por resultados contables.
				</p>
			</header>

			<div className="grid gap-2">
				{TOOLS.map((tool) => (
					<a
						key={tool.path}
						href={tool.path}
						className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-4 py-3 text-xs hover:bg-[var(--surface-2)] transition-colors"
					>
						<div>
							<p className="font-medium text-[var(--text-primary)]">
								{tool.name}
							</p>
							<p className="text-2xs text-[var(--text-tertiary)]">{tool.desc}</p>
						</div>
						<ExternalLink
							size={12}
							className="shrink-0 text-[var(--text-tertiary)]"
						/>
					</a>
				))}
			</div>
		</div>
	);
}
