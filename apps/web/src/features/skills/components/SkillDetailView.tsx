import { Zap, CheckCircle2, XCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SkillDTO } from "../skills.api";

export interface SkillDetailViewProps {
	skill: SkillDTO;
	onClose: () => void;
	onInstall: (id: string) => void;
	onUninstall: (id: string) => void;
}

export function SkillDetailView({
	skill,
	onClose,
	onInstall,
	onUninstall,
}: SkillDetailViewProps) {
	const isInstalled = skill.installed ?? false;

	return (
		<div className="flex h-full flex-col bg-[var(--surface-1)]">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
				<div className="flex items-center gap-3">
					<div className="rounded-xl bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)]">
						<Zap size={20} strokeWidth={2.5} />
					</div>
					<div>
						<h2 className="text-base font-bold text-[var(--text-primary)]">
							{skill.name}
						</h2>
						<span className="text-xs text-[var(--text-muted)]">
							v{skill.version} &middot; {skill.author}
						</span>
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
				>
					<XCircle size={18} />
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
				{/* Description */}
				<div>
					<h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
						Descripción
					</h3>
					<p className="text-sm leading-relaxed text-[var(--text-secondary)]">
						{skill.description}
					</p>
				</div>

				{/* Meta */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
							Categoría
						</h3>
						<span className="rounded-md bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
							{skill.category}
						</span>
					</div>
					<div>
						<h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
							Estado
						</h3>
						<span
							className={cn(
								"text-xs font-medium",
								skill.status === "active"
									? "text-[var(--color-success)]"
									: "text-[var(--color-warning)]",
							)}
						>
							{skill.status === "active" ? "Activo" : skill.status}
						</span>
					</div>
				</div>

				{/* Capabilities */}
				{skill.capabilities && skill.capabilities.length > 0 && (
					<div>
						<h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
							Capacidades ({skill.capabilities.length})
						</h3>
						<ul className="space-y-2">
							{skill.capabilities.map((cap) => (
								<li
									key={cap.id}
									className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3"
								>
									<CheckCircle2
										size={14}
										className="mt-0.5 shrink-0 text-[var(--color-success)]"
									/>
									<div>
										<p className="text-sm font-medium text-[var(--text-primary)]">
											{cap.name}
										</p>
										<p className="text-xs text-[var(--text-secondary)]">
											{cap.description}
										</p>
										<span className="mt-1 inline-block rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
											{cap.actionType}
										</span>
									</div>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>

			{/* Footer */}
			<div className="border-t border-[var(--border-subtle)] px-6 py-4">
				<button
					type="button"
					onClick={() => (isInstalled ? onUninstall(skill.id) : onInstall(skill.id))}
					className={cn(
						"flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
						isInstalled
							? "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-red-200 hover:bg-red-50 hover:text-red-600"
							: "bg-[var(--color-primary)] text-white hover:opacity-90",
					)}
				>
					{isInstalled ? (
						<>
							<XCircle size={16} />
							Desinstalar skill
						</>
					) : (
						<>
							<Download size={16} />
							Instalar skill
						</>
					)}
				</button>
			</div>
		</div>
	);
}


