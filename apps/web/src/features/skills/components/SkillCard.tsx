import {
	CheckCircle2,
	Download,
	type LucideIcon,
	XCircle,
	Zap,
} from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import type { SkillDTO } from "../skills.api";

const CATEGORY_COLORS: Record<string, string> = {
	fiscal: "text-[var(--color-success)]",
	finance: "text-[var(--color-primary)]",
	operations: "text-[var(--color-steel)]",
	audit: "text-[var(--color-warning)]",
};

const CATEGORY_BG: Record<string, string> = {
	fiscal: "bg-[var(--color-success)]/10",
	finance: "bg-[var(--color-primary)]/10",
	operations: "bg-[var(--color-steel)]/10",
	audit: "bg-[var(--color-warning)]/10",
};

const OUTPUT_ICON: Record<string, LucideIcon> = {
	fiscal: CheckCircle2,
	finance: Zap,
	operations: Download,
	audit: CheckCircle2,
};

export interface SkillCardProps {
	skill: SkillDTO;
	onInstall: (id: string) => void;
	onUninstall: (id: string) => void;
	onSelect?: (skill: SkillDTO) => void;
}

export function SkillCard({
	skill,
	onInstall,
	onUninstall,
	onSelect,
}: SkillCardProps) {
	const isInstalled = skill.installed ?? false;
	const Icon = OUTPUT_ICON[skill.category] || Zap;

	const handleClick = useCallback(() => {
		if (isInstalled) {
			onUninstall(skill.id);
		} else {
			onInstall(skill.id);
		}
	}, [isInstalled, skill.id, onInstall, onUninstall]);

	const handleSelect = useCallback(() => {
		onSelect?.(skill);
	}, [onSelect, skill]);

	return (
		<button
			type="button"
			onClick={handleSelect}
			className={cn(
				"group flex w-full flex-col rounded-2xl border p-6 text-left transition-all duration-200",
				isInstalled
					? "border-[var(--border-default)] bg-[var(--surface-2)]"
					: "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)]",
			)}
		>
			<div className="mb-4 flex items-start justify-between">
				<div
					className={cn(
						"rounded-2xl p-3 transition-colors",
						isInstalled ? CATEGORY_BG[skill.category] : "bg-[var(--surface-2)]",
					)}
				>
					<Icon
						size={20}
						strokeWidth={2}
						className={
							isInstalled
								? CATEGORY_COLORS[skill.category]
								: "text-[var(--text-muted)]"
						}
					/>
				</div>
				<span
					className={cn(
						"rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
						isInstalled
							? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
							: "bg-[var(--surface-2)] text-[var(--text-muted)]",
					)}
				>
					v{skill.version}
				</span>
			</div>

			<div className="flex-1 space-y-2">
				<h2 className="text-sm font-semibold text-[var(--text-primary)]">
					{skill.name}
				</h2>
				<p className="text-xs leading-relaxed text-[var(--text-secondary)]">
					{skill.description}
				</p>
				<div className="flex items-center gap-2 pt-1">
					<span
						className={cn(
							"rounded-md px-1.5 py-0.5 text-xs font-medium uppercase tracking-wider",
							CATEGORY_BG[skill.category],
							CATEGORY_COLORS[skill.category],
						)}
					>
						{skill.category}
					</span>
					{skill.capabilities && (
						<span className="text-xs text-[var(--text-muted)]">
							{skill.capabilities.length} capacidades
						</span>
					)}
				</div>
			</div>

			<div className="mt-6 flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handleClick();
					}}
					className={cn(
						"flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
						isInstalled
							? "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-red-200 hover:bg-red-50 hover:text-red-600"
							: "bg-[var(--color-primary)] text-white hover:opacity-90",
					)}
				>
					{isInstalled ? (
						<>
							<XCircle size={12} />
							Desinstalar
						</>
					) : (
						<>
							<Download size={12} />
							Instalar
						</>
					)}
				</button>
				{isInstalled && (
					<span className="flex items-center gap-1 text-xs text-[var(--color-success)]">
						<CheckCircle2 size={10} />
						Instalado
					</span>
				)}
			</div>
		</button>
	);
}
