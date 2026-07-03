import { Search, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SkillCategory } from "@/features/agent-swarm/types/skills.types";

export const SKILL_CATEGORIES: { key: SkillCategory | "all"; label: string }[] = [
	{ key: "all", label: "Todas" },
	{ key: "fiscal", label: "Fiscal" },
	{ key: "finance", label: "Finanzas" },
	{ key: "operations", label: "Operaciones" },
	{ key: "audit", label: "Auditoría" },
];

export interface SkillSearchBarProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	activeCategory: SkillCategory | "all";
	onCategoryChange: (category: SkillCategory | "all") => void;
	installedCount: number;
}

export function SkillSearchBar({
	searchQuery,
	onSearchChange,
	activeCategory,
	onCategoryChange,
	installedCount,
}: SkillSearchBarProps) {
	return (
		<>
			<div className="flex items-center gap-4 pt-2">
				<div className="relative flex-1 max-w-md">
					<Search
						size={15}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
					/>
					<input
						type="text"
						placeholder="Buscar skills..."
						className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--border-default)]"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						aria-label="Buscar skill"
					/>
				</div>
				<div className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
					<CheckCircle2 size={13} className="text-[var(--color-success)]" />
					{installedCount} Instaladas
				</div>
			</div>

			<div className="border-b border-[var(--border-subtle)] mt-4 -mx-8 px-8 py-3">
				<div className="flex items-center gap-2">
					{SKILL_CATEGORIES.map((cat) => (
						<button
							key={cat.key}
							type="button"
							onClick={() => onCategoryChange(cat.key)}
							className={cn(
								"rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
								activeCategory === cat.key
									? "bg-[var(--surface-3)] text-[var(--text-primary)]"
									: "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]",
							)}
						>
							{cat.label}
						</button>
					))}
				</div>
			</div>
		</>
	);
}
