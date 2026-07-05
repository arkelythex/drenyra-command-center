import { Layers, PlusCircle, Zap } from "lucide-react";
import type { AccountingSkill } from "@/features/agent-swarm/types/skills.types";
import { cn } from "@/lib/utils";
import { MAX_VISIBLE_SKILLS } from "../hub-context-aside.data";

interface ContextSkillsSectionProps {
	skills: AccountingSkill[];
	onInstallSkill: (skillId: string) => void;
}

export function ContextSkillsSection({
	skills,
	onInstallSkill,
}: ContextSkillsSectionProps) {
	const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS);
	const hiddenSkillsCount = Math.max(skills.length - visibleSkills.length, 0);

	return (
		<div className="space-y-3">
			<span className="flex items-center justify-between px-1 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
				Plan de Acción
				<Layers size={12} />
			</span>

			<div className="grid grid-cols-1 gap-2.5">
				{visibleSkills.map((skill) => (
					<button
						key={skill.id}
						onClick={() => {
							if (!skill.isInstalled) onInstallSkill(skill.id);
						}}
						className={cn(
							"group relative flex items-center overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-colors duration-150",
							skill.isInstalled
								? "border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-primary)]"
								: "border-dashed border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-default)]",
						)}
					>
						<div className="flex flex-col">
							<span className="text-label font-medium">{skill.name}</span>
							<span className="mt-0.5 text-3xs font-bold uppercase tracking-wider opacity-60">
								{skill.isInstalled ? "Completado" : "Pendiente"}
							</span>
						</div>

						{skill.isInstalled ? (
							<div className="ml-auto inline-flex items-center gap-1 rounded-md border border-primary/15 bg-primary/10 px-2 py-1 text-3xs font-bold uppercase tracking-wider text-primary">
								<Zap size={10} />
								Hecho
							</div>
						) : (
							<div className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)]">
								<PlusCircle size={10} />
							</div>
						)}
					</button>
				))}
			</div>

			{hiddenSkillsCount > 0 ? (
				<p className="px-1 text-2xs text-[var(--text-secondary)]">
					+{hiddenSkillsCount} automatizaciones adicionales disponibles.
				</p>
			) : null}
		</div>
	);
}
