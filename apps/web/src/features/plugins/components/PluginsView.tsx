import {
	CheckCircle2,
	Cloud,
	ExternalLink,
	FileCode,
	Landmark,
	Search,
	ShieldCheck,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Plugin {
	id: string;
	name: string;
	description: string;
	category: "Connectors" | "Storage" | "Compliance" | "Finance";
	icon: React.ComponentType<{ className?: string }>;
	status: "active" | "available" | "experimental";
	provider: string;
}

const PLUGINS: Plugin[] = [
	{
		id: "sunat-bridge",
		name: "SUNAT Bridge (SIRE)",
		description:
			"Conexión nativa con Clave SOL para sincronización de CPE y libros electrónicos.",
		category: "Compliance",
		icon: ShieldCheck,
		status: "active",
		provider: "Drenyra Core",
	},
	{
		id: "bcp-connector",
		name: "BCP Banking API",
		description:
			"Lectura de estados de cuenta y movimientos en tiempo real para conciliación.",
		category: "Finance",
		icon: Landmark,
		status: "active",
		provider: "Drenyra Finance",
	},
	{
		id: "drive-evidence",
		name: "Google Drive Storage",
		description:
			"Almacenamiento automático de expedientes y evidencia fiscal en la nube.",
		category: "Storage",
		icon: Cloud,
		status: "available",
		provider: "Google",
	},
	{
		id: "xml-validator",
		name: "UBL 2.1 Validator",
		description:
			"Motor de validación técnica de archivos XML según estándares OSE/SUNAT.",
		category: "Compliance",
		icon: FileCode,
		status: "active",
		provider: "Drenyra Core",
	},
	{
		id: "bbva-connector",
		name: "BBVA Business",
		description:
			"Conexión segura con banca empresas BBVA para importación de extractos.",
		category: "Finance",
		icon: Landmark,
		status: "available",
		provider: "Drenyra Finance",
	},
	{
		id: "interbank-connector",
		name: "Interbank Connect",
		description:
			"Integración con Interbank para flujos de tesorería y pagos masivos.",
		category: "Finance",
		icon: Landmark,
		status: "experimental",
		provider: "Drenyra Finance",
	},
];

export const PluginsView = () => {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredPlugins = PLUGINS.filter(
		(p) =>
			p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.description.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="flex flex-col h-full bg-white">
			{/* --- HEADER --- */}
			<header className="px-8 py-12 lg:px-16 border-b border-gray-50">
				<div className="max-w-5xl mx-auto space-y-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-xl bg-info-subtle text-info">
							<Zap size={24} strokeWidth={2.5} />
						</div>
						<h1 className="text-3xl font-bold tracking-tight text-primary">
							Plugins
						</h1>
					</div>
					<p className="text-secondary text-lg max-w-2xl">
						Expande las capacidades de tu Fiscal Operating System conectando
						servicios externos y motores de validación.
					</p>

					<div className="pt-4 flex items-center gap-4">
						<div className="relative flex-1 max-w-md">
							<Search
								className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40"
								size={18}
							/>
							<input
								type="text"
								placeholder="Buscar plugins..."
								aria-label="Buscar plugin"
								className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[var(--color-info)]/10 focus:border-info-muted outline-none transition-all text-sm"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-secondary">
							<CheckCircle2 size={14} className="text-success" />3 Plugins
							Activos
						</div>
					</div>
				</div>
			</header>

			{/* --- GRID --- */}
			<main className="flex-1 overflow-y-auto p-8 lg:p-16 bg-[#F9F9FB]">
				<div className="max-w-5xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredPlugins.map((plugin) => (
							<PluginCard key={plugin.id} plugin={plugin} />
						))}
					</div>
				</div>
			</main>
		</div>
	);
};

function PluginCard({ plugin }: { plugin: Plugin }) {
	const Icon = plugin.icon;
	const isActive = plugin.status === "active";

	return (
		<div
			className={cn(
				"group flex flex-col p-6 rounded-2xl border bg-white transition-all duration-300",
				isActive
					? "border-blue-100 shadow-sm"
					: "border-gray-100 hover:border-gray-200",
			)}
		>
			<div className="flex items-start justify-between mb-6">
				<div
					className={cn(
						"p-3 rounded-2xl transition-colors",
						isActive
							? "bg-blue-50 text-blue-600"
							: "bg-gray-50 text-secondary/40 group-hover:bg-gray-100",
					)}
				>
					<Icon size={24} strokeWidth={2} />
				</div>
				<Badge
					className={cn(
						"text-xs uppercase tracking-widest px-2 py-0.5 rounded-md",
						isActive
							? "bg-blue-600 text-white"
							: "bg-gray-100 text-secondary/60",
					)}
				>
					{plugin.status}
				</Badge>
			</div>

			<div className="flex-1 space-y-2">
				<h2 className="font-bold text-primary flex items-center gap-2">
					{plugin.name}
					{isActive && <CheckCircle2 size={14} className="text-info" />}
				</h2>
				<p className="text-xs text-secondary leading-relaxed">
					{plugin.description}
				</p>
			</div>

			<div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between">
				<span className="text-xs font-bold text-secondary/40 uppercase tracking-widest">
					{plugin.provider}
				</span>
				<button
					className={cn(
						"flex items-center gap-1.5 text-xs font-bold transition-all",
						isActive ? "text-blue-600" : "text-secondary hover:text-primary",
					)}
				>
					{isActive ? "Configurar" : "Instalar"}
					<ExternalLink size={12} />
				</button>
			</div>
		</div>
	);
}
