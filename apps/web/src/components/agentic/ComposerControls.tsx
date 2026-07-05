"use client";

import { cn } from "@/lib/utils";

interface ComposerControlsProps {
	mode: "consulta" | "periodo";
	onChangeMode: (mode: "consulta" | "periodo") => void;
	activeSkills: Set<string>;
	onToggleSkill: (skill: string) => void;
}

const MODES: ("consulta" | "periodo")[] = ["consulta", "periodo"];
const SKILLS = ["Fiscal", "PCGE", "Datos"] as const;

const MODE_LABELS: Record<string, string> = {
	consulta: "Consultar",
	periodo: "Periodo",
};

export function ComposerControls({
	mode,
	onChangeMode,
	activeSkills,
	onToggleSkill,
}: ComposerControlsProps) {
	return (
		<div className="flex items-center gap-2">
			<div
				className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-0.5"
				role="tablist"
			>
				{MODES.map((m) => (
					<button
						type="button"
						key={m}
						role="tab"
						aria-selected={mode === m}
						onClick={() => onChangeMode(m)}
						className={cn(
							"rounded-md px-2.5 py-1 text-xs font-medium transition-all",
							mode === m
								? "bg-[var(--surface-1)] text-[var(--text-primary)] shadow-sm"
								: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
						)}
					>
						{MODE_LABELS[m]}
					</button>
				))}
			</div>

			<div className="flex items-center gap-1">
				{SKILLS.map((skill) => {
					const isActive = activeSkills.has(skill);
					return (
						<button
							type="button"
							key={skill}
							onClick={() => onToggleSkill(skill)}
							aria-pressed={isActive}
							className={cn(
								"rounded-full px-2.5 py-1 text-xs font-medium transition-all",
								isActive
									? "border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
									: "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
							)}
						>
							{skill}
						</button>
					);
				})}
			</div>
		</div>
	);
}
