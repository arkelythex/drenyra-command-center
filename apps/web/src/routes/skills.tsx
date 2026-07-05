import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Grid3X3, List, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	useSkills,
	useInstalledSkills,
	useInstallSkill,
	useUninstallSkill,
} from "@/features/skills/hooks/useSkills";
import { SkillCard } from "@/features/skills/components/SkillCard";
import { SkillSearchBar } from "@/features/skills/components/SkillSearchBar";
import { SkillDetailView } from "@/features/skills/components/SkillDetailView";
import type { SkillDTO } from "@/features/skills/skills.api";
import type { SkillCategory } from "@/features/agent-swarm/types/skills.types";

export const Route = createFileRoute("/skills")({
	component: SkillsPage,
	pendingMinMs: 300,
});

type ViewMode = "grid" | "list";

function SkillsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<SkillCategory | "all">(
		"all",
	);
	const [viewMode, setViewMode] = useState<ViewMode>("grid");
	const [selectedSkill, setSelectedSkill] = useState<SkillDTO | null>(null);

	const { data: skillsData, isLoading } = useSkills();
	const { data: installedData } = useInstalledSkills();
	const installMutation = useInstallSkill();
	const uninstallMutation = useUninstallSkill();

	const skills = skillsData?.data ?? [];
	const installedSkills = installedData?.data ?? [];
	const installedCount = installedSkills.length;

	const filteredSkills = useMemo(() => {
		return skills.filter((s) => {
			const matchesSearch =
				!searchQuery ||
				s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.description.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory =
				activeCategory === "all" || s.category === activeCategory;
			return matchesSearch && matchesCategory;
		});
	}, [skills, searchQuery, activeCategory]);

	const handleInstall = (id: string) => {
		installMutation.mutate(id);
	};

	const handleUninstall = (id: string) => {
		uninstallMutation.mutate(id);
	};

	if (selectedSkill) {
		return (
			<SkillDetailView
				skill={selectedSkill}
				onClose={() => setSelectedSkill(null)}
				onInstall={handleInstall}
				onUninstall={handleUninstall}
			/>
		);
	}

	return (
		<div className="flex h-full flex-col p-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
						<Cpu size={20} className="text-[var(--color-primary)]" />
					</div>
					<div>
						<h1 className="text-lg font-bold text-[var(--text-primary)]">
							Skills Library
						</h1>
						<p className="text-xs text-[var(--text-tertiary)]">
							Catálogo de capacidades de agentes fiscales
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setViewMode("grid")}
						className={cn(
							"rounded-lg p-2 transition-colors",
							viewMode === "grid"
								? "bg-[var(--surface-3)] text-[var(--text-primary)]"
								: "text-[var(--text-muted)] hover:bg-[var(--surface-2)]",
						)}
						aria-label="Vista cuadrícula"
					>
						<Grid3X3 size={16} />
					</button>
					<button
						type="button"
						onClick={() => setViewMode("list")}
						className={cn(
							"rounded-lg p-2 transition-colors",
							viewMode === "list"
								? "bg-[var(--surface-3)] text-[var(--text-primary)]"
								: "text-[var(--text-muted)] hover:bg-[var(--surface-2)]",
						)}
						aria-label="Vista lista"
					>
						<List size={16} />
					</button>
				</div>
			</div>

			{/* Search and filters */}
			<SkillSearchBar
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				activeCategory={activeCategory}
				onCategoryChange={setActiveCategory}
				installedCount={installedCount}
			/>

			{/* Content */}
			<div className="mt-6 flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
					</div>
				) : filteredSkills.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<Cpu size={32} className="mb-3 text-[var(--text-muted)]" />
						<p className="text-sm font-medium text-[var(--text-secondary)]">
							{searchQuery
								? "No se encontraron skills con ese criterio"
								: "No hay skills disponibles"}
						</p>
						{searchQuery && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="mt-2 text-xs text-[var(--color-primary)] hover:underline"
							>
								Limpiar búsqueda
							</button>
						)}
					</div>
				) : (
					<div
						className={cn(
							viewMode === "grid"
								? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
								: "flex flex-col gap-3",
						)}
					>
						{filteredSkills.map((skill) => (
							<SkillCard
								key={skill.id}
								skill={skill}
								onInstall={handleInstall}
								onUninstall={handleUninstall}
								onSelect={setSelectedSkill}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
