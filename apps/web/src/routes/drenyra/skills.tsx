import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { useSkills, useInstallSkill, useUninstallSkill, SkillCard } from "@/features/skills";
import type { SkillDTO } from "@/features/skills";
import { SkillSearchBar } from "@/features/skills/components/SkillSearchBar";
import { SkillDetailView } from "@/features/skills/components/SkillDetailView";

function SkillsPage() {
	const { data, isLoading } = useSkills();
	const installMutation = useInstallSkill();
	const uninstallMutation = useUninstallSkill();
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string>("all");
	const [selectedSkill, setSelectedSkill] = useState<SkillDTO | null>(null);

	const skills = data?.data ?? [];
	const installedCount = skills.filter((s) => s.installed).length;

	const filtered = useMemo(
		() =>
			skills.filter((s) => {
				const matchesCategory =
					activeCategory === "all" || s.category === activeCategory;
				const matchesSearch =
					s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					s.description.toLowerCase().includes(searchQuery.toLowerCase());
				return matchesCategory && matchesSearch;
			}),
		[skills, activeCategory, searchQuery],
	);

	const handleInstall = (id: string) => {
		installMutation.mutate(id);
	};

	const handleUninstall = (id: string) => {
		uninstallMutation.mutate(id);
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center bg-[var(--surface-1)]">
				<div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--color-primary)]" />
					Cargando skills...
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full bg-[var(--surface-1)]">
			{/* Main Content */}
			<div className="flex flex-1 flex-col">
				{/* Header */}
				<div className="border-b border-[var(--border-subtle)] px-8 py-8">
					<div className="mx-auto max-w-5xl space-y-4">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)]">
								<Zap size={22} strokeWidth={2.5} />
							</div>
							<h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
								Skills
							</h1>
						</div>
						<p className="max-w-2xl text-sm text-[var(--text-secondary)]">
							Capacidades agénticas que expanden lo que Drenyra puede hacer por
							vos. Instalá skills para habilitar nuevos flujos de trabajo fiscal
							y financiero.
						</p>

						<SkillSearchBar
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							activeCategory={activeCategory as any}
							onCategoryChange={setActiveCategory}
							installedCount={installedCount}
						/>
					</div>
				</div>

				{/* Skill Grid */}
				<div className="flex-1 overflow-y-auto p-8">
					<div className="mx-auto max-w-5xl">
						{filtered.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-8 py-16 text-center">
								<p className="text-sm text-[var(--text-muted)]">
									No se encontraron skills con ese filtro.
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{filtered.map((skill) => (
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
			</div>

			{/* Detail Panel */}
			{selectedSkill && (
				<div className="w-96 border-l border-[var(--border-subtle)]">
					<SkillDetailView
						skill={selectedSkill}
						onClose={() => setSelectedSkill(null)}
						onInstall={handleInstall}
						onUninstall={handleUninstall}
					/>
				</div>
			)}
		</div>
	);
}

export const Route = createFileRoute("/drenyra/skills")({
	component: SkillsPage,
});
