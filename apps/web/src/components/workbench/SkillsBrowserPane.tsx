import { useState, useMemo } from "react";
import { Download, Grid3X3, List, Search, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types & mock data ──────────────────────────────────────────────────────

interface SkillItem {
	id: string;
	name: string;
	description: string;
	category: "fiscal" | "finance" | "operations" | "audit";
	version: string;
	installed: boolean;
	capabilities: number;
}

const MOCK_SKILLS: SkillItem[] = [
	{
		id: "sk-001",
		name: "Cierre Mensual Automático",
		description:
			"Ejecuta el cierre contable completo con clasificaciones, provisiones y ajustes",
		category: "fiscal",
		version: "2.1.0",
		installed: true,
		capabilities: 12,
	},
	{
		id: "sk-002",
		name: "Conciliación Bancaria",
		description: "Concilia movimientos bancarios contra ledger automáticamente",
		category: "finance",
		version: "1.5.0",
		installed: true,
		capabilities: 8,
	},
	{
		id: "sk-003",
		name: "SIRE RCE Comparator",
		description: "Compara RCE SUNAT contra ledger y propone diferencias",
		category: "fiscal",
		version: "2.0.0",
		installed: true,
		capabilities: 6,
	},
	{
		id: "sk-004",
		name: "Detección de Anomalías",
		description: "Identifica asientos inusuales usando reglas fiscales y ML",
		category: "audit",
		version: "1.2.0",
		installed: false,
		capabilities: 4,
	},
	{
		id: "sk-005",
		name: "Clasificación de Comprobantes",
		description: "Clasifica CPE automáticamente según PCGE y SUNAT",
		category: "operations",
		version: "1.8.0",
		installed: true,
		capabilities: 10,
	},
	{
		id: "sk-006",
		name: "IGV Calculator",
		description: "Calcula IGV mensual con arrastres de periodos anteriores",
		category: "fiscal",
		version: "1.3.0",
		installed: false,
		capabilities: 5,
	},
	{
		id: "sk-007",
		name: "Detracciones Automáticas",
		description: "Gestiona detracciones con montos y plazos SUNAT",
		category: "fiscal",
		version: "1.0.0",
		installed: false,
		capabilities: 3,
	},
	{
		id: "sk-008",
		name: "Flujo de Caja Proyectado",
		description: "Proyecta flujo de caja basado en Cuentas por Cobrar/Pagar",
		category: "finance",
		version: "1.1.0",
		installed: false,
		capabilities: 7,
	},
];

const CATEGORY_COLORS: Record<string, string> = {
	fiscal: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
	finance: "text-blue-600 bg-blue-500/10 border-blue-500/20",
	operations: "text-amber-600 bg-amber-500/10 border-amber-500/20",
	audit: "text-purple-600 bg-purple-500/10 border-purple-500/20",
};

const CATEGORY_LABELS: Record<string, string> = {
	fiscal: "Fiscal",
	finance: "Finanzas",
	operations: "Operaciones",
	audit: "Auditoría",
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function SkillGridCard({
	skill,
	onToggle,
}: {
	skill: SkillItem;
	onToggle: (id: string) => void;
}) {
	return (
		<div
			className={cn(
				"rounded-xl border p-3 transition-all",
				skill.installed
					? "border-[var(--border-subtle)] bg-[var(--surface-1)]"
					: "border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)]/50",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<div className="text-xs font-semibold text-[var(--text-primary)]">
						{skill.name}
					</div>
					<div className="mt-0.5 text-[10px] text-[var(--text-secondary)] line-clamp-2">
						{skill.description}
					</div>
				</div>
			</div>
			<div className="mt-2 flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<span
						className={cn(
							"rounded px-1 py-0.5 text-[8px] font-bold uppercase",
							CATEGORY_COLORS[skill.category],
						)}
					>
						{CATEGORY_LABELS[skill.category]}
					</span>
					<span className="text-[9px] text-[var(--text-muted)]">
						v{skill.version}
					</span>
					<span className="text-[9px] text-[var(--text-muted)]">
						{skill.capabilities} caps.
					</span>
				</div>
				<button
					type="button"
					onClick={() => onToggle(skill.id)}
					className={cn(
						"flex items-center gap-1 rounded-md px-1.5 py-1 text-[9px] font-medium transition-colors",
						skill.installed
							? "text-red-500 hover:bg-red-500/10"
							: "text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10",
					)}
				>
					{skill.installed ? <XCircle size={11} /> : <Download size={11} />}
					{skill.installed ? "Quitar" : "Instalar"}
				</button>
			</div>
		</div>
	);
}

function SkillListItem({
	skill,
	onToggle,
}: {
	skill: SkillItem;
	onToggle: (id: string) => void;
}) {
	return (
		<div className="flex items-center gap-3 px-4 py-2.5">
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="truncate text-xs font-medium text-[var(--text-primary)]">
						{skill.name}
					</span>
					<span
						className={cn(
							"rounded px-1 py-0.5 text-[8px] font-bold uppercase",
							CATEGORY_COLORS[skill.category],
						)}
					>
						{CATEGORY_LABELS[skill.category]}
					</span>
				</div>
				<p className="truncate text-[10px] text-[var(--text-secondary)]">
					{skill.description}
				</p>
			</div>
			<span className="text-[10px] text-[var(--text-muted)]">
				v{skill.version}
			</span>
			<button
				type="button"
				onClick={() => onToggle(skill.id)}
				className={cn(
					"flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
					skill.installed
						? "text-red-500 hover:bg-red-500/10"
						: "text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10",
				)}
			>
				{skill.installed ? <XCircle size={12} /> : <Download size={12} />}
				{skill.installed ? "Quitar" : "Instalar"}
			</button>
		</div>
	);
}

// ─── Main component ─────────────────────────────────────────────────────────

interface SkillsBrowserPaneProps {
	className?: string;
}

export function SkillsBrowserPane({ className }: SkillsBrowserPaneProps) {
	const [query, setQuery] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [filterCategory, setFilterCategory] = useState<string | null>(null);
	const [skills, setSkills] = useState<SkillItem[]>(MOCK_SKILLS);

	const filtered = useMemo(() => {
		return skills.filter((s) => {
			if (filterCategory && s.category !== filterCategory) return false;
			if (!query) return true;
			const q = query.toLowerCase();
			return (
				s.name.toLowerCase().includes(q) ||
				s.description.toLowerCase().includes(q)
			);
		});
	}, [skills, query, filterCategory]);

	const toggleInstall = (id: string) => {
		setSkills((prev) =>
			prev.map((s) => (s.id === id ? { ...s, installed: !s.installed } : s)),
		);
	};

	const categories = Array.from(new Set(skills.map((s) => s.category)));
	const installedCount = skills.filter((s) => s.installed).length;

	return (
		<div className={cn("flex flex-col", className)}>
			<div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
				<div className="flex flex-1 items-center gap-2 rounded-md bg-[var(--surface-2)] px-2 py-1.5">
					<Search size={13} className="text-[var(--text-muted)] shrink-0" />
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Buscar skills..."
						className="w-full bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
					/>
				</div>
				<button
					type="button"
					onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
					className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
					aria-label={viewMode === "grid" ? "Vista lista" : "Vista cuadrícula"}
				>
					{viewMode === "grid" ? <List size={14} /> : <Grid3X3 size={14} />}
				</button>
				<span className="text-[10px] text-[var(--text-muted)]">
					{installedCount}/{skills.length}
				</span>
			</div>

			<div className="flex gap-1 border-b border-[var(--border-subtle)] px-3 py-1.5">
				<button
					type="button"
					onClick={() => setFilterCategory(null)}
					className={cn(
						"rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
						filterCategory === null
							? "bg-[var(--surface-2)] text-[var(--text-primary)]"
							: "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
					)}
				>
					Todos
				</button>
				{categories.map((cat) => (
					<button
						key={cat}
						type="button"
						onClick={() =>
							setFilterCategory(filterCategory === cat ? null : cat)
						}
						className={cn(
							"rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
							filterCategory === cat
								? CATEGORY_COLORS[cat]
								: "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
						)}
					>
						{CATEGORY_LABELS[cat] ?? cat}
					</button>
				))}
			</div>

			<div className="flex-1 overflow-y-auto">
				{filtered.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<Search size={24} className="text-[var(--text-muted)]" />
						<p className="mt-2 text-xs text-[var(--text-muted)]">
							No se encontraron skills
						</p>
					</div>
				) : viewMode === "grid" ? (
					<div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
						{filtered.map((skill) => (
							<SkillGridCard
								key={skill.id}
								skill={skill}
								onToggle={toggleInstall}
							/>
						))}
					</div>
				) : (
					<div className="divide-y divide-[var(--border-subtle)]">
						{filtered.map((skill) => (
							<SkillListItem
								key={skill.id}
								skill={skill}
								onToggle={toggleInstall}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
